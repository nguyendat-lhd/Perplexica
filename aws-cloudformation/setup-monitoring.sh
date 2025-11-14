#!/bin/bash

# Setup Monitoring và Alerts cho Perplexica Stack
# Usage: ./setup-monitoring.sh [environment] [email]

set -e

ENVIRONMENT=${1:-production}
ALERT_EMAIL=${2:-""}
STACK_NAME="perplexica-${ENVIRONMENT}"
MONITORING_STACK="${STACK_NAME}-monitoring"
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

# Check if email provided
if [ -z "$ALERT_EMAIL" ]; then
    echo_error "Email address is required!"
    echo "Usage: $0 [environment] [email]"
    echo "Example: $0 production your-email@example.com"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo_error "AWS CLI is not installed."
    exit 1
fi

# Check if main stack exists
if ! aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} &> /dev/null; then
    echo_error "Main stack '${STACK_NAME}' does not exist!"
    echo "Please deploy the main stack first: ./deploy.sh ${ENVIRONMENT} create"
    exit 1
fi

echo_info "Setting up monitoring for ${STACK_NAME}..."
echo_info "Alert email: ${ALERT_EMAIL}"
echo_info "Region: ${REGION}"

# Get outputs from main stack
echo_info "Getting stack outputs..."
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" \
  --output text 2>/dev/null || echo "")

PERPLEXICA_SERVICE=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='PerplexicaServiceName'].OutputValue" \
  --output text 2>/dev/null || echo "")

MCP_SERVICE=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='MCPServerServiceName'].OutputValue" \
  --output text 2>/dev/null || echo "")

SEARXNG_SERVICE=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='SearXNGServiceName'].OutputValue" \
  --output text 2>/dev/null || echo "")

ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='ALBDNSName'].OutputValue" \
  --output text 2>/dev/null || echo "")

# Get ALB Full Name from ALB DNS
if [ ! -z "$ALB_DNS" ]; then
    # Extract ALB name from DNS (format: name-1234567890.region.elb.amazonaws.com)
    ALB_NAME=$(echo $ALB_DNS | cut -d'.' -f1)
    ALB_FULL_NAME="app/${ALB_NAME}"
else
    # Try to get from ALB resource directly
    ALB_FULL_NAME=$(aws elbv2 describe-load-balancers \
      --region ${REGION} \
      --query "LoadBalancers[?contains(DNSName, '${STACK_NAME}')].LoadBalancerFullName" \
      --output text 2>/dev/null | head -n1 || echo "")
fi

if [ -z "$CLUSTER_NAME" ] || [ -z "$PERPLEXICA_SERVICE" ]; then
    echo_error "Failed to get required outputs from main stack!"
    exit 1
fi

if [ -z "$ALB_FULL_NAME" ]; then
    echo_warn "Could not determine ALB Full Name. ALB alarms may not work correctly."
fi

echo_info "Cluster: ${CLUSTER_NAME}"
echo_info "Perplexica Service: ${PERPLEXICA_SERVICE}"
echo_info "MCP Service: ${MCP_SERVICE}"
echo_info "SearXNG Service: ${SEARXNG_SERVICE}"
echo_info "ALB Full Name: ${ALB_FULL_NAME}"

# Check if monitoring stack exists
if aws cloudformation describe-stacks --stack-name ${MONITORING_STACK} --region ${REGION} &> /dev/null; then
    echo_warn "Monitoring stack already exists. Updating..."
    ACTION="update"
else
    echo_info "Creating monitoring stack..."
    ACTION="create"
fi

# Deploy monitoring stack
if [ "$ACTION" = "create" ]; then
    aws cloudformation create-stack \
      --stack-name ${MONITORING_STACK} \
      --template-body file://monitoring-alarms.yaml \
      --parameters \
        ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
        ParameterKey=ClusterName,ParameterValue=${CLUSTER_NAME} \
        ParameterKey=PerplexicaServiceName,ParameterValue=${PERPLEXICA_SERVICE} \
        ParameterKey=MCPServerServiceName,ParameterValue=${MCP_SERVICE} \
        ParameterKey=SearXNGServiceName,ParameterValue=${SEARXNG_SERVICE} \
        ParameterKey=ALBFullName,ParameterValue=${ALB_FULL_NAME} \
        ParameterKey=AlertEmail,ParameterValue=${ALERT_EMAIL} \
      --capabilities CAPABILITY_NAMED_IAM \
      --region ${REGION} \
      --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=Perplexica
    
    echo_info "Monitoring stack creation initiated. Waiting for completion..."
    aws cloudformation wait stack-create-complete --stack-name ${MONITORING_STACK} --region ${REGION}
    echo_info "Monitoring stack created successfully!"
else
    aws cloudformation update-stack \
      --stack-name ${MONITORING_STACK} \
      --template-body file://monitoring-alarms.yaml \
      --parameters \
        ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
        ParameterKey=ClusterName,ParameterValue=${CLUSTER_NAME} \
        ParameterKey=PerplexicaServiceName,ParameterValue=${PERPLEXICA_SERVICE} \
        ParameterKey=MCPServerServiceName,ParameterValue=${MCP_SERVICE} \
        ParameterKey=SearXNGServiceName,ParameterValue=${SEARXNG_SERVICE} \
        ParameterKey=ALBFullName,ParameterValue=${ALB_FULL_NAME} \
        ParameterKey=AlertEmail,ParameterValue=${ALERT_EMAIL} \
      --capabilities CAPABILITY_NAMED_IAM \
      --region ${REGION} 2>&1 | tee /tmp/update-monitoring.log
    
    if grep -q "No updates are to be performed" /tmp/update-monitoring.log; then
        echo_warn "No updates to perform."
    else
        echo_info "Monitoring stack update initiated. Waiting for completion..."
        aws cloudformation wait stack-update-complete --stack-name ${MONITORING_STACK} --region ${REGION}
        echo_info "Monitoring stack updated successfully!"
    fi
fi

# Get SNS Topic ARN
SNS_TOPIC_ARN=$(aws cloudformation describe-stacks \
  --stack-name ${MONITORING_STACK} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='AlertTopicArn'].OutputValue" \
  --output text)

echo_info ""
echo_info "=========================================="
echo_info "Monitoring setup completed!"
echo_info "=========================================="
echo_info ""
echo_info "SNS Topic ARN: ${SNS_TOPIC_ARN}"
echo_info ""
echo_warn "IMPORTANT: Check your email (${ALERT_EMAIL}) and confirm SNS subscription!"
echo_info ""
echo_info "Next steps:"
echo_info "1. Check email and confirm SNS subscription"
echo_info "2. Test alarms:"
echo_info "   aws cloudwatch set-alarm-state \\"
echo_info "     --alarm-name ${ENVIRONMENT}-perplexica-web-cpu-high \\"
echo_info "     --state-value ALARM \\"
echo_info "     --state-reason 'Testing alarm' \\"
echo_info "     --region ${REGION}"
echo_info ""
echo_info "3. View alarms:"
echo_info "   aws cloudwatch describe-alarms \\"
echo_info "     --alarm-name-prefix ${ENVIRONMENT}-perplexica \\"
echo_info "     --region ${REGION}"
echo_info ""
echo_info "See MONITORING_GUIDE.md for detailed instructions."

