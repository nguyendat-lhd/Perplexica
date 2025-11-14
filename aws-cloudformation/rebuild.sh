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
STACK_NAME="perplexica-${ENVIRONMENT}"
REGION=${AWS_REGION:-ap-southeast-1}

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
    exit 1
fi

PERPLEXICA_ECR=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='PerplexicaECRURI'].OutputValue" --output text)
MCP_ECR=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='MCPServerECRURI'].OutputValue" --output text)
CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" --output text)

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

# Force update ECS service
force_update_service() {
    local SERVICE_NAME=$1
    echo_step "Forcing new deployment for ECS service: ${SERVICE_NAME}..."
    
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${SERVICE_NAME} \
        --force-new-deployment \
        --region ${REGION} > /dev/null
    
    echo_info "✅ Service ${SERVICE_NAME} update initiated"
    echo_info "   Check status with: aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION}"
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
get_service_names

case ${SERVICE} in
    web|app|perplexica)
        build_web
        if [ "$FORCE_UPDATE" == "--force-update" ]; then
            force_update_service "${WEB_SERVICE}"
        fi
        ;;
    mcp|mcp-server)
        build_mcp
        if [ "$FORCE_UPDATE" == "--force-update" ]; then
            force_update_service "${MCP_SERVICE}"
        fi
        ;;
    all)
        build_web
        build_mcp
        if [ "$FORCE_UPDATE" == "--force-update" ]; then
            force_update_service "${WEB_SERVICE}"
            force_update_service "${MCP_SERVICE}"
        fi
        ;;
    *)
        echo_error "Invalid service: ${SERVICE}"
        echo "Usage: $0 [environment] [service] [--force-update]"
        echo "Services: web, mcp, all"
        echo ""
        echo "Examples:"
        echo "  $0 production web                    # Build và push web app"
        echo "  $0 production mcp                   # Build và push MCP server"
        echo "  $0 production all                   # Build và push tất cả"
        echo "  $0 production web --force-update    # Build, push và force update ECS"
        exit 1
        ;;
esac

echo_info "✅ Rebuild completed!"
if [ "$FORCE_UPDATE" != "--force-update" ]; then
    echo_warn "Note: Images pushed but ECS services not updated."
    echo_warn "      To force update, run: $0 ${ENVIRONMENT} ${SERVICE} --force-update"
fi

