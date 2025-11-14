#!/bin/bash

# Deploy code to EC2 instance
# Usage: ./deploy-code.sh [environment] [branch]

set -e

ENVIRONMENT=${1:-development}
BRANCH=${2:-feat/mcp-integration-clean}
REGION=${AWS_REGION:-ap-southeast-1}
STACK_NAME="perplexica-simple-${ENVIRONMENT}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get instance ID
INSTANCE_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${REGION} \
    --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
    --output text 2>/dev/null)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
    INSTANCE_ID=$(aws cloudformation describe-stack-resources \
        --stack-name ${STACK_NAME} \
        --region ${REGION} \
        --query "StackResources[?ResourceType=='AWS::EC2::Instance'].PhysicalResourceId" \
        --output text 2>/dev/null)
fi

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
    log_error "Instance not found in stack ${STACK_NAME}"
    exit 1
fi

log_info "Instance ID: ${INSTANCE_ID}"
log_info "Branch: ${BRANCH}"
log_info "Deploying code..."

# Commands to run on EC2
COMMANDS=(
    "cd /opt/Perplexica || cd /home/ec2-user/perplexica || cd ~/perplexica"
    "git fetch origin"
    "git checkout ${BRANCH}"
    "git pull origin ${BRANCH}"
    "docker-compose -f docker-compose.prod.yaml build --no-cache"
    "docker-compose -f docker-compose.prod.yaml up -d"
    "docker-compose -f docker-compose.prod.yaml ps"
)

# Join commands with &&
COMMAND_STRING=$(IFS=' && '; echo "${COMMANDS[*]}")

log_info "Sending command to instance..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids ${INSTANCE_ID} \
    --region ${REGION} \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[\"${COMMAND_STRING}\"]" \
    --output text \
    --query "Command.CommandId")

log_info "Command ID: ${COMMAND_ID}"
log_info "Waiting for command to complete..."

# Wait for command to complete
for i in {1..60}; do
    STATUS=$(aws ssm get-command-invocation \
        --command-id ${COMMAND_ID} \
        --instance-id ${INSTANCE_ID} \
        --region ${REGION} \
        --query "Status" \
        --output text 2>/dev/null || echo "InProgress")
    
    if [ "$STATUS" == "Success" ]; then
        log_info "✅ Command completed successfully!"
        break
    elif [ "$STATUS" == "Failed" ] || [ "$STATUS" == "Cancelled" ] || [ "$STATUS" == "TimedOut" ]; then
        log_error "Command failed with status: ${STATUS}"
        aws ssm get-command-invocation \
            --command-id ${COMMAND_ID} \
            --instance-id ${INSTANCE_ID} \
            --region ${REGION} \
            --query "StandardErrorContent" \
            --output text
        exit 1
    fi
    
    echo -n "."
    sleep 2
done

echo ""

# Get output
log_info "Command output:"
aws ssm get-command-invocation \
    --command-id ${COMMAND_ID} \
    --instance-id ${INSTANCE_ID} \
    --region ${REGION} \
    --query "StandardOutputContent" \
    --output text

log_info ""
log_info "✅ Deployment completed!"
log_info "Check services: http://$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' --output text):3000"

