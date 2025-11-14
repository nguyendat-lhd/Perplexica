#!/bin/bash

# Quick connect script using Session Manager
# Usage: ./connect-instance.sh [stack-name] [region]

STACK_NAME=${1:-perplexica-simple-development}
REGION=${2:-ap-southeast-1}

INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
  --output text 2>/dev/null)

if [ -z "$INSTANCE_ID" ]; then
  echo "Error: Could not find instance ID for stack '${STACK_NAME}'"
  echo ""
  echo "Available stacks:"
  aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
    --region ${REGION} \
    --query "StackSummaries[?contains(StackName, 'perplexica')].StackName" \
    --output table
  exit 1
fi

echo "Connecting to instance: ${INSTANCE_ID}"
echo "Stack: ${STACK_NAME}"
echo "Region: ${REGION}"
echo ""
echo "Tip: Type 'exit' to disconnect"
echo ""

aws ssm start-session --target ${INSTANCE_ID} --region ${REGION}

