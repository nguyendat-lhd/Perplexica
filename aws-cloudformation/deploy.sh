#!/bin/bash

# Deploy script for Perplexica AWS CloudFormation Stack
# Usage: ./deploy.sh [environment] [action]
# Actions: create, update, delete, build-and-push

set -e

ENVIRONMENT=${1:-production}
ACTION=${2:-update}
STACK_NAME="perplexica-${ENVIRONMENT}"
REGION=${AWS_REGION:-us-east-1}
PARAMETERS_FILE="parameters.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Build and push Docker images
build_and_push_images() {
    echo_info "Building and pushing Docker images..."
    
    # Build Perplexica web app
    echo_info "Building Perplexica web app..."
    docker build -f app.dockerfile -t perplexica-web:latest .
    
    # Build MCP server
    echo_info "Building MCP server..."
    cd apps/mcp-server
    docker build -t perplexica-mcp-server:latest .
    cd ../..
    
    # Login to ECR
    echo_info "Logging in to ECR..."
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
    
    # Get ECR repository URIs from stack outputs (if stack exists)
    if aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} &> /dev/null; then
        PERPLEXICA_ECR=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='PerplexicaECRURI'].OutputValue" --output text)
        MCP_ECR=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs[?OutputKey=='MCPServerECRURI'].OutputValue" --output text)
    else
        # Create ECR repositories first if they don't exist
        echo_warn "Stack doesn't exist yet. Creating ECR repositories..."
        aws ecr create-repository --repository-name ${ENVIRONMENT}-perplexica-web --region ${REGION} 2>/dev/null || true
        aws ecr create-repository --repository-name ${ENVIRONMENT}-perplexica-mcp-server --region ${REGION} 2>/dev/null || true
        
        PERPLEXICA_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ENVIRONMENT}-perplexica-web"
        MCP_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ENVIRONMENT}-perplexica-mcp-server"
    fi
    
    # Tag and push Perplexica web
    echo_info "Tagging and pushing Perplexica web app..."
    docker tag perplexica-web:latest ${PERPLEXICA_ECR}:latest
    docker push ${PERPLEXICA_ECR}:latest
    
    # Tag and push MCP server
    echo_info "Tagging and pushing MCP server..."
    docker tag perplexica-mcp-server:latest ${MCP_ECR}:latest
    docker push ${MCP_ECR}:latest
    
    echo_info "Images pushed successfully!"
    echo_info "Perplexica Web: ${PERPLEXICA_ECR}:latest"
    echo_info "MCP Server: ${MCP_ECR}:latest"
}

# Create stack
create_stack() {
    echo_info "Creating CloudFormation stack..."
    
    # Update parameters with ECR URIs
    PERPLEXICA_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ENVIRONMENT}-perplexica-web"
    MCP_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ENVIRONMENT}-perplexica-mcp-server"
    
    aws cloudformation create-stack \
        --stack-name ${STACK_NAME} \
        --template-body file://perplexica-stack.yaml \
        --parameters file://${PARAMETERS_FILE} \
        --capabilities CAPABILITY_NAMED_IAM \
        --region ${REGION} \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=Perplexica
    
    echo_info "Stack creation initiated. Waiting for completion..."
    aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME} --region ${REGION}
    echo_info "Stack created successfully!"
    
    # Display outputs
    echo_info "Stack Outputs:"
    aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs" --output table
}

# Update stack
update_stack() {
    echo_info "Updating CloudFormation stack..."
    
    aws cloudformation update-stack \
        --stack-name ${STACK_NAME} \
        --template-body file://perplexica-stack.yaml \
        --parameters file://${PARAMETERS_FILE} \
        --capabilities CAPABILITY_NAMED_IAM \
        --region ${REGION} \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=Perplexica 2>&1 | tee /tmp/update-stack.log
    
    if grep -q "No updates are to be performed" /tmp/update-stack.log; then
        echo_warn "No updates to perform."
    else
        echo_info "Stack update initiated. Waiting for completion..."
        aws cloudformation wait stack-update-complete --stack-name ${STACK_NAME} --region ${REGION}
        echo_info "Stack updated successfully!"
    fi
    
    # Display outputs
    echo_info "Stack Outputs:"
    aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs" --output table
}

# Delete stack
delete_stack() {
    echo_warn "This will delete the entire stack including all resources!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo_info "Deletion cancelled."
        exit 0
    fi
    
    echo_info "Deleting CloudFormation stack..."
    aws cloudformation delete-stack --stack-name ${STACK_NAME} --region ${REGION}
    echo_info "Stack deletion initiated. This may take several minutes..."
    echo_info "You can check the status with: aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION}"
}

# Main execution
case ${ACTION} in
    create)
        create_stack
        ;;
    update)
        update_stack
        ;;
    delete)
        delete_stack
        ;;
    build-and-push)
        build_and_push_images
        ;;
    build-deploy)
        build_and_push_images
        update_stack
        ;;
    *)
        echo_error "Invalid action: ${ACTION}"
        echo "Usage: $0 [environment] [action]"
        echo "Actions: create, update, delete, build-and-push, build-deploy"
        exit 1
        ;;
esac

