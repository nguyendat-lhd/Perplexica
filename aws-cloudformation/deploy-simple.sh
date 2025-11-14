#!/bin/bash

# Simple deployment script for EC2 + Docker Compose
# Usage: ./deploy-simple.sh [environment] [key-pair-name]

set -e

ENVIRONMENT=${1:-development}
KEY_PAIR_NAME=${2:-""}
STACK_NAME="perplexica-simple-${ENVIRONMENT}"
REGION=${AWS_REGION:-ap-southeast-1}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Key pair is optional - Session Manager doesn't need it
if [ -z "$KEY_PAIR_NAME" ] || [ "$KEY_PAIR_NAME" = "" ]; then
    echo_warn "No key pair provided - will use Session Manager instead (recommended)"
    KEY_PAIR_NAME=""
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo_error "AWS CLI is not installed."
    exit 1
fi

# Check if key pair exists (only if provided)
if [ -n "$KEY_PAIR_NAME" ] && [ "$KEY_PAIR_NAME" != "" ]; then
    if ! aws ec2 describe-key-pairs --key-names ${KEY_PAIR_NAME} --region ${REGION} &> /dev/null; then
        echo_error "Key pair '${KEY_PAIR_NAME}' does not exist!"
        echo ""
        echo "Available key pairs:"
        aws ec2 describe-key-pairs --region ${REGION} --query "KeyPairs[*].KeyName" --output table
        echo ""
        echo "Or deploy without key pair (using Session Manager):"
        echo "  $0 ${ENVIRONMENT} \"\""
        exit 1
    fi
fi

echo_info "Deploying Perplexica Simple Stack..."
echo_info "Environment: ${ENVIRONMENT}"
if [ -n "$KEY_PAIR_NAME" ] && [ "$KEY_PAIR_NAME" != "" ]; then
    echo_info "Key Pair: ${KEY_PAIR_NAME} (SSH access)"
else
    echo_info "Key Pair: None (using Session Manager - recommended)"
fi
echo_info "Region: ${REGION}"
echo_info "Stack Name: ${STACK_NAME}"

# Update parameters file
cat > parameters-simple.json << EOF
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "${ENVIRONMENT}"
  },
  {
    "ParameterKey": "InstanceType",
    "ParameterValue": "t3.small"
  },
  {
    "ParameterKey": "UseSpotInstance",
    "ParameterValue": "true"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "${KEY_PAIR_NAME}"
  },
  {
    "ParameterKey": "ECRImageURI",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "GitHubRepo",
    "ParameterValue": ""
  }
]
EOF

# Check if stack exists
if aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} &> /dev/null; then
    echo_warn "Stack already exists. Updating..."
    ACTION="update"
else
    echo_info "Creating new stack..."
    ACTION="create"
fi

# Deploy stack
if [ "$ACTION" = "create" ]; then
    aws cloudformation create-stack \
      --stack-name ${STACK_NAME} \
      --template-body file://perplexica-simple-ec2.yaml \
      --parameters file://parameters-simple.json \
      --capabilities CAPABILITY_NAMED_IAM \
      --region ${REGION} \
      --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=Perplexica Key=DeploymentType,Value=Simple
    
    echo_info "Stack creation initiated. Waiting for completion (5-10 minutes)..."
    aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME} --region ${REGION}
    echo_info "Stack created successfully!"
else
    aws cloudformation update-stack \
      --stack-name ${STACK_NAME} \
      --template-body file://perplexica-simple-ec2.yaml \
      --parameters file://parameters-simple.json \
      --capabilities CAPABILITY_NAMED_IAM \
      --region ${REGION} 2>&1 | tee /tmp/update-simple-stack.log
    
    if grep -q "No updates are to be performed" /tmp/update-simple-stack.log; then
        echo_warn "No updates to perform."
    else
        echo_info "Stack update initiated. Waiting for completion..."
        aws cloudformation wait stack-update-complete --stack-name ${STACK_NAME} --region ${REGION}
        echo_info "Stack updated successfully!"
    fi
fi

# Get outputs
echo_info ""
echo_info "=========================================="
echo_info "Deployment completed!"
echo_info "=========================================="
echo_info ""

PUBLIC_IP=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
  --output text)

INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
  --output text)

echo_info "Instance ID: ${INSTANCE_ID}"
echo_info "Public IP: ${PUBLIC_IP}"
echo_info ""
echo_info "Services URLs:"
echo_info "  Perplexica Web: http://${PUBLIC_IP}:3000"
echo_info "  MCP Server: http://${PUBLIC_IP}:3001"
echo_info "  SearXNG: http://${PUBLIC_IP}:4000"
echo_info ""
echo_info ""
echo_info "Connect via Session Manager (Recommended):"
echo_info "  aws ssm start-session --target ${INSTANCE_ID} --region ${REGION}"
echo_info ""
if [ -n "$KEY_PAIR_NAME" ] && [ "$KEY_PAIR_NAME" != "" ]; then
    echo_info "Or via SSH (if key pair provided):"
    echo_info "  ssh -i ${KEY_PAIR_NAME}.pem ec2-user@${PUBLIC_IP}"
    echo_info ""
fi
echo_info "See SESSION_MANAGER_GUIDE.md for detailed instructions"
echo_info ""
echo_warn "Note: Services may take 2-3 minutes to start after instance launch"
echo_info "Check logs: Connect via Session Manager và chạy 'docker-compose logs'"

