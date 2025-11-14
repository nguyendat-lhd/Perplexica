#!/bin/bash

# Script để test performance thực tế của Perplexica trên AWS

set -e

ENVIRONMENT="${1:-development}"
INSTANCE_IP="${2:-13.228.19.21}"
REGION="${3:-ap-southeast-1}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get instance ID
get_instance_id() {
    aws ec2 describe-instances \
        --filters "Name=ip-address,Values=$INSTANCE_IP" "Name=instance-state-name,Values=running" \
        --query "Reservations[0].Instances[0].InstanceId" \
        --output text \
        --region $REGION 2>/dev/null || echo ""
}

# Test homepage response time
test_homepage() {
    log_info "Testing homepage response time..."
    
    START=$(date +%s.%N)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://$INSTANCE_IP:3000/" 2>&1)
    END=$(date +%s.%N)
    DURATION=$(echo "$END - $START" | bc)
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_info "Homepage: ${DURATION}s (HTTP $HTTP_CODE)"
        echo "$DURATION"
    else
        log_error "Homepage failed: HTTP $HTTP_CODE"
        echo "999"
    fi
}

# Test search API với timeout ngắn hơn để đo thời gian
test_search_api() {
    local query="${1:-What is artificial intelligence?}"
    local timeout="${2:-30}"
    
    log_info "Testing search API: '$query' (timeout: ${timeout}s)..."
    
    START=$(date +%s.%N)
    
    RESPONSE=$(timeout $timeout curl -X POST "http://$INSTANCE_IP:3000/api/search" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\",\"focusMode\":\"webSearch\",\"stream\":false,\"optimizationMode\":\"speed\"}" \
        -s -w "\n%{http_code}" \
        --max-time $timeout 2>&1)
    
    END=$(date +%s.%N)
    DURATION=$(echo "$END - $START" | bc)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        MESSAGE_LENGTH=$(echo "$BODY" | jq -r '.message' 2>/dev/null | wc -c || echo "0")
        SOURCES_COUNT=$(echo "$BODY" | jq -r '.sources | length' 2>/dev/null || echo "0")
        
        log_info "Search API: ${DURATION}s (HTTP $HTTP_CODE, Message: ${MESSAGE_LENGTH} chars, Sources: ${SOURCES_COUNT})"
        echo "$DURATION"
    else
        log_warn "Search API: ${DURATION}s (HTTP $HTTP_CODE) - may have timed out"
        echo "$DURATION"
    fi
}

# Get EC2 metrics
get_ec2_metrics() {
    local instance_id="$1"
    local hours="${2:-1}"
    
    log_info "Getting EC2 metrics for last $hours hour(s)..."
    
    END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)
    START_TIME=$(date -u -v-${hours}H +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -d "$hours hours ago" +%Y-%m-%dT%H:%M:%S)
    
    # CPU Utilization
    CPU_DATA=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/EC2 \
        --metric-name CPUUtilization \
        --dimensions Name=InstanceId,Value=$instance_id \
        --start-time "$START_TIME" \
        --end-time "$END_TIME" \
        --period 300 \
        --statistics Average,Maximum \
        --region $REGION \
        --output json 2>/dev/null)
    
    if [ -n "$CPU_DATA" ]; then
        CPU_AVG=$(echo "$CPU_DATA" | jq -r '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "N/A")
        CPU_MAX=$(echo "$CPU_DATA" | jq -r '.Datapoints | map(.Maximum) | max' 2>/dev/null || echo "N/A")
        log_info "CPU: Avg=${CPU_AVG}%, Max=${CPU_MAX}%"
    fi
    
    # Network In
    NET_IN=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/EC2 \
        --metric-name NetworkIn \
        --dimensions Name=InstanceId,Value=$instance_id \
        --start-time "$START_TIME" \
        --end-time "$END_TIME" \
        --period 300 \
        --statistics Sum \
        --region $REGION \
        --output json 2>/dev/null)
    
    if [ -n "$NET_IN" ]; then
        NET_IN_TOTAL=$(echo "$NET_IN" | jq -r '.Datapoints | map(.Sum) | add' 2>/dev/null || echo "0")
        NET_IN_MB=$(echo "scale=2; $NET_IN_TOTAL / 1024 / 1024" | bc 2>/dev/null || echo "0")
        log_info "Network In: ${NET_IN_MB} MB"
    fi
}

# Get instance details
get_instance_details() {
    local instance_id="$1"
    
    log_info "Getting instance details..."
    
    INSTANCE_DATA=$(aws ec2 describe-instances \
        --instance-ids $instance_id \
        --query "Reservations[0].Instances[0].[InstanceType,InstanceLifecycle,State.Name]" \
        --output json \
        --region $REGION 2>/dev/null)
    
    if [ -n "$INSTANCE_DATA" ]; then
        INSTANCE_TYPE=$(echo "$INSTANCE_DATA" | jq -r '.[0]')
        LIFECYCLE=$(echo "$INSTANCE_DATA" | jq -r '.[1] // "On-Demand"')
        STATE=$(echo "$INSTANCE_DATA" | jq -r '.[2]')
        
        log_info "Instance: $INSTANCE_TYPE ($LIFECYCLE) - $STATE"
    fi
}

# Main test
main() {
    log_info "=== Perplexica Performance Test ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Instance IP: $INSTANCE_IP"
    log_info "Region: $REGION"
    echo ""
    
    # Get instance ID
    INSTANCE_ID=$(get_instance_id)
    if [ -z "$INSTANCE_ID" ]; then
        log_error "Could not find instance with IP $INSTANCE_IP"
        exit 1
    fi
    
    log_info "Instance ID: $INSTANCE_ID"
    echo ""
    
    # Get instance details
    get_instance_details "$INSTANCE_ID"
    echo ""
    
    # Test homepage
    HOMEPAGE_TIME=$(test_homepage)
    echo ""
    
    # Test search API với timeout ngắn
    log_info "Testing search API (this may take 30-60 seconds)..."
    SEARCH_TIME=$(test_search_api "What is AI?" 60)
    echo ""
    
    # Get metrics
    get_ec2_metrics "$INSTANCE_ID" 1
    echo ""
    
    # Summary
    log_info "=== Performance Summary ==="
    echo "Homepage Response Time: ${HOMEPAGE_TIME}s"
    echo "Search API Response Time: ${SEARCH_TIME}s"
    echo ""
    
    if (( $(echo "$SEARCH_TIME > 30" | bc -l) )); then
        log_warn "⚠️  Search API is slow (>30s). Consider optimizations."
    elif (( $(echo "$SEARCH_TIME > 10" | bc -l) )); then
        log_warn "⚠️  Search API is moderate (10-30s). Room for improvement."
    else
        log_info "✅ Search API performance is good (<10s)."
    fi
}

main

