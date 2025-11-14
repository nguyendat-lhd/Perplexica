#!/bin/bash

# Script để optimize performance của Perplexica trên AWS
# Mục tiêu: Tăng tốc độ x2 bằng cách tăng resources và implement caching

set -e

ENVIRONMENT="${1:-production}"
ACTION="${2:-help}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warn "jq not found. Some features may not work."
    fi
    
    log_info "Prerequisites check passed."
}

# Get current stack resources
get_current_resources() {
    log_info "Getting current stack resources..."
    
    STACK_NAME="${ENVIRONMENT}-perplexica"
    
    if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
        log_error "Stack $STACK_NAME not found."
        exit 1
    fi
    
    # Get current CPU/Memory from task definitions
    log_info "Current resources:"
    aws ecs describe-task-definition \
        --task-definition "${ENVIRONMENT}-perplexica-web" \
        --query 'taskDefinition.containerDefinitions[0].[cpu,memory]' \
        --output table 2>/dev/null || log_warn "Could not get task definition"
}

# Update CloudFormation template với resources cao hơn
update_resources() {
    log_info "Updating CloudFormation template with higher resources..."
    
    TEMPLATE_FILE="perplexica-stack.yaml"
    
    if [ ! -f "$TEMPLATE_FILE" ]; then
        log_error "Template file $TEMPLATE_FILE not found."
        exit 1
    fi
    
    # Backup original template
    cp "$TEMPLATE_FILE" "${TEMPLATE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    log_info "Backup created: ${TEMPLATE_FILE}.backup.*"
    
    # Update CPU/Memory trong Mappings
    # Note: This is a simple sed replacement. For production, use proper YAML parser
    log_warn "Manual update required:"
    log_info "Please update perplexica-stack.yaml Mappings section:"
    echo ""
    echo "  InstanceTypeMap:"
    echo "    production:"
    echo "      WebCpu: 1024      # Tăng từ 512"
    echo "      WebMemory: 2048    # Tăng từ 1024"
    echo "      SearXNGCpu: 512    # Tăng từ 256"
    echo "      SearXNGMemory: 1024 # Tăng từ 512"
    echo ""
    
    read -p "Press Enter after updating the template..."
}

# Deploy updated stack
deploy_updates() {
    log_info "Deploying updated stack..."
    
    STACK_NAME="${ENVIRONMENT}-perplexica"
    
    log_warn "This will update your running stack. Continue? (y/n)"
    read -r response
    
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled."
        exit 0
    fi
    
    log_info "Updating stack $STACK_NAME..."
    
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://perplexica-stack.yaml \
        --parameters file://parameters.json \
        --capabilities CAPABILITY_NAMED_IAM \
        --region ap-southeast-1
    
    log_info "Stack update initiated. Waiting for completion..."
    
    aws cloudformation wait stack-update-complete \
        --stack-name "$STACK_NAME" \
        --region ap-southeast-1
    
    log_info "Stack update completed!"
}

# Setup Redis cache
setup_redis() {
    log_info "Setting up Redis cache..."
    
    log_warn "Redis setup requires manual CloudFormation template update."
    log_info "Add this to your CloudFormation template:"
    echo ""
    cat << 'EOF'
  RedisCache:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupDescription: Perplexica cache
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheClusters: 1
      AutomaticFailoverEnabled: false
      ReplicationGroupDescription: Perplexica Redis Cache
      Tags:
        - Key: Environment
          Value: !Ref Environment
EOF
    echo ""
    
    log_info "After adding Redis to template, run deploy_updates"
}

# Monitor performance
monitor_performance() {
    log_info "Monitoring performance metrics..."
    
    STACK_NAME="${ENVIRONMENT}-perplexica"
    CLUSTER_NAME=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" \
        --output text \
        --region ap-southeast-1)
    
    SERVICE_NAME="${ENVIRONMENT}-perplexica-web"
    
    log_info "Getting CPU utilization..."
    aws cloudwatch get-metric-statistics \
        --namespace AWS/ECS \
        --metric-name CPUUtilization \
        --dimensions Name=ServiceName,Value="$SERVICE_NAME" Name=ClusterName,Value="$CLUSTER_NAME" \
        --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Average,Maximum \
        --region ap-southeast-1 \
        --output table
    
    log_info "Getting Memory utilization..."
    aws cloudwatch get-metric-statistics \
        --namespace AWS/ECS \
        --metric-name MemoryUtilization \
        --dimensions Name=ServiceName,Value="$SERVICE_NAME" Name=ClusterName,Value="$CLUSTER_NAME" \
        --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Average,Maximum \
        --region ap-southeast-1 \
        --output table
}

# Show cost estimate
show_cost() {
    log_info "Cost estimation for performance optimization..."
    
    cat << 'EOF'

Current Monthly Cost: ~$138-163/month

After Optimization (Priority 1 + 2):
- Increased Resources: +$21/month
  - Perplexica Web: 0.5→1 vCPU, 1GB→2GB (+$14)
  - SearXNG: 0.25→0.5 vCPU, 512MB→1GB (+$7)
- Redis Cache: +$15/month
- RDS PostgreSQL: +$15/month

Total Additional Cost: +$51/month
New Total: ~$189-214/month

Performance Improvement: 2x faster (6-13s → 3-6s)
ROI: Excellent - Significant UX improvement

EOF
}

# Show help
show_help() {
    cat << EOF
Perplexica AWS Performance Optimization Script

Usage: $0 [ENVIRONMENT] [ACTION]

ENVIRONMENT: production (default), staging, development
ACTION: One of the following:

  help              Show this help message
  check             Check prerequisites and current resources
  update-resources  Update CloudFormation template with higher resources
  deploy            Deploy updated stack
  setup-redis       Show instructions for Redis setup
  monitor           Monitor current performance metrics
  cost              Show cost estimation

Examples:
  $0 production check
  $0 production update-resources
  $0 production deploy
  $0 production monitor

For detailed analysis, see: PERFORMANCE_ANALYSIS_AWS.md

EOF
}

# Main script
main() {
    check_prerequisites
    
    case "$ACTION" in
        help)
            show_help
            ;;
        check)
            get_current_resources
            ;;
        update-resources)
            update_resources
            ;;
        deploy)
            deploy_updates
            ;;
        setup-redis)
            setup_redis
            ;;
        monitor)
            monitor_performance
            ;;
        cost)
            show_cost
            ;;
        *)
            log_error "Unknown action: $ACTION"
            show_help
            exit 1
            ;;
    esac
}

main

