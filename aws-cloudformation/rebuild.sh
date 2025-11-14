#!/bin/bash

# Rebuild script for Perplexica services
# Usage: 
#   ./rebuild.sh [environment] [service] [--force-update]
#   ./rebuild.sh production web          # Build và push web app
#   ./rebuild.sh production mcp           # Build và push MCP server
#   ./rebuild.sh production all           # Build và push tất cả
#   ./rebuild.sh production web --force-update  # Build, push và force update ECS service

set -e

ENVIRONMENT=${1:-production}
SERVICE=${2:-all}
FORCE_UPDATE=${3:-}
REGION=${AWS_REGION:-ap-southeast-1}

# Map environment to actual stack names
# You can override by setting STACK_NAME environment variable
if [ -n "$STACK_NAME" ]; then
    # Use explicitly provided stack name
    :
elif [ "$ENVIRONMENT" == "production" ]; then
    STACK_NAME="perplexica-prod"
elif [ "$ENVIRONMENT" == "staging" ]; then
    STACK_NAME="perplexica-staging"
elif [ "$ENVIRONMENT" == "development" ] || [ "$ENVIRONMENT" == "dev" ]; then
    STACK_NAME="perplexica-simple-development"
else
    # Try to find stack automatically
    STACK_NAME=$(aws cloudformation list-stacks \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --region ${REGION} \
        --query "StackSummaries[?contains(StackName, 'perplexica') && contains(StackName, '${ENVIRONMENT}')].StackName" \
        --output text | head -1)
    
    # If still not found, try default naming convention
    if [ -z "$STACK_NAME" ]; then
        STACK_NAME="perplexica-${ENVIRONMENT}"
    fi
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo_info "AWS Account ID: ${AWS_ACCOUNT_ID}"
echo_info "AWS Region: ${REGION}"
echo_info "Stack Name: ${STACK_NAME}"
echo_info "Service: ${SERVICE}"

# Get ECR repository URIs and ECS cluster/service names from stack
if ! aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} &> /dev/null; then
    echo_error "Stack ${STACK_NAME} does not exist!"
    echo_warn "Available stacks:"
    aws cloudformation list-stacks \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --region ${REGION} \
        --query "StackSummaries[?contains(StackName, 'perplexica')].StackName" \
        --output table
    echo ""
    echo_info "Usage: STACK_NAME=<stack-name> ./rebuild.sh <environment> <service> [--force-update]"
    echo_info "Or use: ./rebuild.sh development web --force-update  (for perplexica-simple-development)"
    exit 1
fi

# Get ECR repositories (may not exist for EC2 deployments)
PERPLEXICA_ECR=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='PerplexicaECRURI'].OutputValue" --output text 2>/dev/null || echo "")
MCP_ECR=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='MCPServerECRURI'].OutputValue" --output text 2>/dev/null || echo "")

# If ECR not in outputs, try to get from stack resources or construct
if [ -z "$PERPLEXICA_ECR" ] || [ "$PERPLEXICA_ECR" == "None" ]; then
    PERPLEXICA_ECR_REPO=$(aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::ECR::Repository' && contains(LogicalResourceId, 'Perplexica')].PhysicalResourceId" --output text | head -1)
    if [ -n "$PERPLEXICA_ECR_REPO" ] && [ "$PERPLEXICA_ECR_REPO" != "None" ]; then
        PERPLEXICA_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PERPLEXICA_ECR_REPO}"
    else
        # Fallback: construct from environment
        PERPLEXICA_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ENVIRONMENT}-perplexica-web"
    fi
fi

if [ -z "$MCP_ECR" ] || [ "$MCP_ECR" == "None" ]; then
    MCP_ECR_REPO=$(aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::ECR::Repository' && contains(LogicalResourceId, 'MCP')].PhysicalResourceId" --output text | head -1)
    if [ -n "$MCP_ECR_REPO" ] && [ "$MCP_ECR_REPO" != "None" ]; then
        MCP_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${MCP_ECR_REPO}"
    else
        # Fallback: construct from environment
        MCP_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ENVIRONMENT}-perplexica-mcp-server"
    fi
fi

CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" --output text 2>/dev/null || echo "")

if [ -z "$CLUSTER_NAME" ]; then
    # Try alternative output key
    CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" --output text)
fi

if [ -z "$CLUSTER_NAME" ]; then
    # Try to get from stack resources
    CLUSTER_NAME=$(aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::ECS::Cluster'].PhysicalResourceId" --output text)
fi

echo_info "Cluster: ${CLUSTER_NAME}"
echo_info "Perplexica ECR: ${PERPLEXICA_ECR}"
echo_info "MCP ECR: ${MCP_ECR}"

# Login to ECR
login_ecr() {
    echo_step "Logging in to ECR..."
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
}

# Build and push Perplexica web app
build_web() {
    echo_step "Building Perplexica web app..."
    docker build -f app.dockerfile -t perplexica-web:latest .
    
    echo_step "Tagging and pushing Perplexica web app..."
    docker tag perplexica-web:latest ${PERPLEXICA_ECR}:latest
    docker push ${PERPLEXICA_ECR}:latest
    
    echo_info "✅ Perplexica web app pushed: ${PERPLEXICA_ECR}:latest"
}

# Build and push MCP server
build_mcp() {
    echo_step "Building MCP server..."
    cd apps/mcp-server
    docker build -t perplexica-mcp-server:latest .
    cd ../..
    
    echo_step "Tagging and pushing MCP server..."
    docker tag perplexica-mcp-server:latest ${MCP_ECR}:latest
    docker push ${MCP_ECR}:latest
    
    echo_info "✅ MCP server pushed: ${MCP_ECR}:latest"
}

# Detect deployment type (ECS or EC2)
detect_deployment_type() {
    # Check if stack has ECS services
    ECS_SERVICES=$(aws cloudformation describe-stack-resources \
        --stack-name ${STACK_NAME} \
        --region ${REGION} \
        --query "StackResources[?ResourceType=='AWS::ECS::Service'].PhysicalResourceId" \
        --output text 2>/dev/null)
    
    # Check if stack has EC2 instance
    EC2_INSTANCE=$(aws cloudformation describe-stack-resources \
        --stack-name ${STACK_NAME} \
        --region ${REGION} \
        --query "StackResources[?ResourceType=='AWS::EC2::Instance'].PhysicalResourceId" \
        --output text 2>/dev/null)
    
    if [ -n "$ECS_SERVICES" ] && [ "$ECS_SERVICES" != "None" ]; then
        DEPLOYMENT_TYPE="ECS"
    elif [ -n "$EC2_INSTANCE" ] && [ "$EC2_INSTANCE" != "None" ]; then
        DEPLOYMENT_TYPE="EC2"
    else
        DEPLOYMENT_TYPE="UNKNOWN"
    fi
    
    echo_info "Deployment Type: ${DEPLOYMENT_TYPE}"
}

# Force update ECS service
force_update_ecs_service() {
    local SERVICE_NAME=$1
    echo_step "Forcing new deployment for ECS service: ${SERVICE_NAME}..."
    
    if [ -z "$CLUSTER_NAME" ]; then
        echo_warn "Cluster name not found. Skipping ECS service update."
        return
    fi
    
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${SERVICE_NAME} \
        --force-new-deployment \
        --region ${REGION} > /dev/null
    
    echo_info "✅ Service ${SERVICE_NAME} update initiated"
    echo_info "   Check status with: aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION}"
}

# Force update EC2 docker-compose services
force_update_ec2_services() {
    local SERVICE=$1
    echo_step "Updating docker-compose services on EC2 instance..."
    
    INSTANCE_ID=$(aws cloudformation describe-stack-resources \
        --stack-name ${STACK_NAME} \
        --region ${REGION} \
        --query "StackResources[?ResourceType=='AWS::EC2::Instance'].PhysicalResourceId" \
        --output text)
    
    if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
        echo_error "EC2 instance not found in stack!"
        return
    fi
    
    echo_info "Instance ID: ${INSTANCE_ID}"
    echo_warn "To update services on EC2, you need to:"
    echo_warn "1. Connect to instance: aws ssm start-session --target ${INSTANCE_ID} --region ${REGION}"
    echo_warn "2. Run: cd /home/ec2-user/perplexica"
    if [ "$SERVICE" == "web" ] || [ "$SERVICE" == "all" ]; then
        echo_warn "3. Run: docker-compose pull app && docker-compose up -d app"
    fi
    if [ "$SERVICE" == "mcp" ] || [ "$SERVICE" == "all" ]; then
        echo_warn "4. Run: docker-compose pull mcp-server && docker-compose up -d mcp-server"
    fi
    echo_warn ""
    echo_info "Or use this one-liner:"
    echo_info "aws ssm send-command --instance-ids ${INSTANCE_ID} --region ${REGION} --document-name 'AWS-RunShellScript' --parameters 'commands=[\"cd /home/ec2-user/perplexica\",\"docker-compose pull\",\"docker-compose up -d\"]'"
}

# Get ECS service names
get_service_names() {
    # Get from stack outputs
    WEB_SERVICE=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='PerplexicaServiceName'].OutputValue" --output text 2>/dev/null || echo "")
    MCP_SERVICE=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='MCPServerServiceName'].OutputValue" --output text 2>/dev/null || echo "")
    
    # If not in outputs, try to get from stack resources
    if [ -z "$WEB_SERVICE" ]; then
        WEB_SERVICE=$(aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::ECS::Service' && contains(LogicalResourceId, 'Perplexica') && !contains(LogicalResourceId, 'MCP')].PhysicalResourceId" --output text | head -1)
    fi
    
    if [ -z "$MCP_SERVICE" ]; then
        MCP_SERVICE=$(aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::ECS::Service' && contains(LogicalResourceId, 'MCP')].PhysicalResourceId" --output text | head -1)
    fi
    
    # Fallback: construct from environment (standard naming convention)
    if [ -z "$WEB_SERVICE" ]; then
        WEB_SERVICE="${ENVIRONMENT}-perplexica-web"
    fi
    
    if [ -z "$MCP_SERVICE" ]; then
        MCP_SERVICE="${ENVIRONMENT}-perplexica-mcp-server"
    fi
    
    echo_info "Web Service: ${WEB_SERVICE}"
    echo_info "MCP Service: ${MCP_SERVICE}"
}

# Main execution
login_ecr
detect_deployment_type
get_service_names

case ${SERVICE} in
    web|app|perplexica)
        build_web
        if [ "$FORCE_UPDATE" == "--force-update" ]; then
            if [ "$DEPLOYMENT_TYPE" == "ECS" ]; then
                force_update_ecs_service "${WEB_SERVICE}"
            elif [ "$DEPLOYMENT_TYPE" == "EC2" ]; then
                force_update_ec2_services "web"
            else
                echo_warn "Unknown deployment type. Images pushed but services not updated."
            fi
        fi
        ;;
    mcp|mcp-server)
        build_mcp
        if [ "$FORCE_UPDATE" == "--force-update" ]; then
            if [ "$DEPLOYMENT_TYPE" == "ECS" ]; then
                force_update_ecs_service "${MCP_SERVICE}"
            elif [ "$DEPLOYMENT_TYPE" == "EC2" ]; then
                force_update_ec2_services "mcp"
            else
                echo_warn "Unknown deployment type. Images pushed but services not updated."
            fi
        fi
        ;;
    all)
        build_web
        build_mcp
        if [ "$FORCE_UPDATE" == "--force-update" ]; then
            if [ "$DEPLOYMENT_TYPE" == "ECS" ]; then
                force_update_ecs_service "${WEB_SERVICE}"
                force_update_ecs_service "${MCP_SERVICE}"
            elif [ "$DEPLOYMENT_TYPE" == "EC2" ]; then
                force_update_ec2_services "all"
            else
                echo_warn "Unknown deployment type. Images pushed but services not updated."
            fi
        fi
        ;;
    *)
        echo_error "Invalid service: ${SERVICE}"
        echo "Usage: $0 [environment] [service] [--force-update]"
        echo "Services: web, mcp, all"
        echo ""
        echo "Examples:"
        echo "  $0 production web                    # Build và push web app"
        echo "  $0 development web                  # Build và push web app (for EC2 deployment)"
        echo "  $0 production mcp                   # Build và push MCP server"
        echo "  $0 production all                   # Build và push tất cả"
        echo "  $0 production web --force-update    # Build, push và force update ECS"
        echo "  $0 development web --force-update   # Build, push và show EC2 update commands"
        exit 1
        ;;
esac

echo_info "✅ Rebuild completed!"
if [ "$FORCE_UPDATE" != "--force-update" ]; then
    echo_warn "Note: Images pushed but ECS services not updated."
    echo_warn "      To force update, run: $0 ${ENVIRONMENT} ${SERVICE} --force-update"
fi

