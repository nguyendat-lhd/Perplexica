# Monitoring và Alerting Guide cho Perplexica

Hướng dẫn setup monitoring và alerting để phát hiện khi hệ thống quá tải và tự động scale.

## Tổng quan

Hệ thống monitoring bao gồm:
1. **CloudWatch Alarms**: Cảnh báo khi metrics vượt ngưỡng
2. **Auto Scaling**: Tự động scale up/down dựa trên CPU/Memory
3. **SNS Notifications**: Gửi email/SMS khi có alert
4. **CloudWatch Dashboard**: Xem metrics real-time

## Metrics được monitor

### ECS Service Metrics

1. **CPU Utilization**
   - Warning: > 80% trong 10 phút
   - Critical: > 90% trong 5 phút
   - Auto Scale: Target 70% CPU

2. **Memory Utilization**
   - Warning: > 80% trong 10 phút
   - Critical: > 90% trong 5 phút
   - Auto Scale: Target 80% Memory

3. **Task Count**
   - Monitor số lượng tasks đang chạy
   - Alert nếu không có tasks healthy

### ALB Metrics

1. **Response Time**
   - Alert: > 5 giây trong 10 phút

2. **HTTP 5xx Errors**
   - Alert: > 10 errors trong 10 phút

3. **Unhealthy Hosts**
   - Alert: Có bất kỳ unhealthy host nào

4. **Request Count**
   - Monitor traffic patterns

## Setup Monitoring

### Bước 1: Deploy Monitoring Stack

**Cách 1: Dùng script (Khuyến nghị) ✅**

```bash
cd aws-cloudformation
./setup-monitoring.sh production your-email@example.com
```

Script sẽ tự động:
- Lấy tất cả outputs từ main stack
- Tạo/update monitoring stack
- Setup CloudWatch Alarms và Auto Scaling
- Gửi email để confirm SNS subscription

**Cách 2: Deploy thủ công**

```bash
cd aws-cloudformation

# Lấy outputs từ main stack
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" \
  --output text)

PERPLEXICA_SERVICE=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='PerplexicaServiceName'].OutputValue" \
  --output text)

MCP_SERVICE=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='MCPServerServiceName'].OutputValue" \
  --output text)

SEARXNG_SERVICE=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='SearXNGServiceName'].OutputValue" \
  --output text)

# Get ALB Full Name
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='ALBDNSName'].OutputValue" \
  --output text)

ALB_NAME=$(echo $ALB_DNS | cut -d'.' -f1)
ALB_FULL_NAME="app/${ALB_NAME}"

# Deploy monitoring stack
aws cloudformation create-stack \
  --stack-name perplexica-production-monitoring \
  --template-body file://monitoring-alarms.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=ClusterName,ParameterValue=$CLUSTER_NAME \
    ParameterKey=PerplexicaServiceName,ParameterValue=$PERPLEXICA_SERVICE \
    ParameterKey=MCPServerServiceName,ParameterValue=$MCP_SERVICE \
    ParameterKey=SearXNGServiceName,ParameterValue=$SEARXNG_SERVICE \
    ParameterKey=ALBFullName,ParameterValue=$ALB_FULL_NAME \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

### Bước 2: Confirm SNS Subscription

Sau khi deploy, kiểm tra email và confirm subscription:
1. Vào email inbox
2. Tìm email từ AWS SNS
3. Click "Confirm subscription"

### Bước 3: Test Alarms

```bash
# Trigger test alarm
aws cloudwatch set-alarm-state \
  --alarm-name production-perplexica-web-cpu-high \
  --state-value ALARM \
  --state-reason "Testing alarm" \
  --region ap-southeast-1
```

## Auto Scaling Configuration

### Perplexica Web Service

**CPU-based Scaling:**
- Target: 70% CPU utilization
- Scale Out Cooldown: 60 giây
- Scale In Cooldown: 300 giây (5 phút)
- Min: 1 task
- Max: 10 tasks

**Memory-based Scaling:**
- Target: 80% Memory utilization
- Scale Out Cooldown: 60 giây
- Scale In Cooldown: 300 giây (5 phút)

### Scaling Behavior

**Scale Out (Khi quá tải):**
1. CPU > 70% hoặc Memory > 80% trong 1 phút
2. ECS tự động tăng số tasks
3. ALB tự động distribute traffic
4. Scale nhanh (60 giây cooldown)

**Scale In (Khi giảm tải):**
1. CPU < 70% và Memory < 80% trong 5 phút
2. ECS tự động giảm số tasks
3. Scale chậm (300 giây cooldown) để tránh scale down quá nhanh

## CloudWatch Dashboard

Tạo dashboard để xem metrics real-time:

```bash
# Tạo dashboard
aws cloudwatch put-dashboard \
  --dashboard-name perplexica-production \
  --dashboard-body file://dashboard.json \
  --region ap-southeast-1
```

Hoặc tạo manual trong AWS Console:
1. Vào CloudWatch → Dashboards
2. Create dashboard
3. Add widgets cho:
   - ECS Service CPU/Memory
   - ALB Request Count/Response Time
   - ECS Task Count
   - Error Rates

## Alert Thresholds

### Warning Level (Email notification)

| Metric | Threshold | Duration |
|--------|-----------|----------|
| CPU Utilization | > 80% | 10 phút |
| Memory Utilization | > 80% | 10 phút |
| ALB Response Time | > 5 giây | 10 phút |
| HTTP 5xx Errors | > 10 errors | 10 phút |

### Critical Level (Immediate alert)

| Metric | Threshold | Duration |
|--------|-----------|----------|
| CPU Utilization | > 90% | 5 phút |
| Memory Utilization | > 90% | 5 phút |
| Unhealthy Hosts | > 0 | Immediate |

## Manual Scaling

Nếu cần scale manual:

```bash
# Scale Perplexica Web service
aws ecs update-service \
  --cluster production-perplexica-cluster \
  --service production-perplexica-web \
  --desired-count 3 \
  --region ap-southeast-1

# Scale MCP Server
aws ecs update-service \
  --cluster production-perplexica-cluster \
  --service production-perplexica-mcp-server \
  --desired-count 2 \
  --region ap-southeast-1
```

## Monitoring Commands

### Xem metrics real-time

```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=production-perplexica-web Name=ClusterName,Value=production-perplexica-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ap-southeast-1

# Memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=production-perplexica-web Name=ClusterName,Value=production-perplexica-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ap-southeast-1
```

### Xem alarm status

```bash
# List all alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix production-perplexica \
  --region ap-southeast-1

# Check alarm state
aws cloudwatch describe-alarms \
  --alarm-names production-perplexica-web-cpu-high \
  --region ap-southeast-1
```

### Xem ECS service metrics

```bash
# Service status
aws ecs describe-services \
  --cluster production-perplexica-cluster \
  --services production-perplexica-web \
  --region ap-southeast-1 \
  --query 'services[0].[runningCount,desiredCount,deployments[0].status]' \
  --output table

# Task count over time
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name RunningTaskCount \
  --dimensions Name=ServiceName,Value=production-perplexica-web Name=ClusterName,Value=production-perplexica-cluster \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum \
  --region ap-southeast-1
```

## Troubleshooting High Load

### Khi nhận được CPU Alert:

1. **Kiểm tra current metrics:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=production-perplexica-web \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum \
  --region ap-southeast-1
```

2. **Kiểm tra số tasks đang chạy:**
```bash
aws ecs describe-services \
  --cluster production-perplexica-cluster \
  --services production-perplexica-web \
  --query 'services[0].[runningCount,desiredCount]' \
  --output table
```

3. **Kiểm tra logs để tìm nguyên nhân:**
```bash
aws logs tail /ecs/production-perplexica-web --follow --since 10m
```

4. **Nếu auto scaling chưa kịp, scale manual:**
```bash
aws ecs update-service \
  --cluster production-perplexica-cluster \
  --service production-perplexica-web \
  --desired-count 3 \
  --region ap-southeast-1
```

### Khi nhận được Memory Alert:

1. **Kiểm tra memory usage:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=production-perplexica-web \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum \
  --region ap-southeast-1
```

2. **Có thể cần tăng memory limit trong Task Definition:**
```bash
# Update task definition với memory cao hơn
aws ecs register-task-definition \
  --cli-input-json file://task-definition-updated.json
```

### Khi nhận được Response Time Alert:

1. **Kiểm tra ALB metrics:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/production-perplexica-alb/xxx \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum \
  --region ap-southeast-1
```

2. **Kiểm tra database/EFS performance:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/EFS \
  --metric-name PercentIOLimit \
  --dimensions Name=FileSystemId,Value=fs-xxx \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ap-southeast-1
```

## Best Practices

1. **Setup multiple alert channels:**
   - Email (SNS)
   - Slack (SNS → Lambda → Slack webhook)
   - PagerDuty (SNS → PagerDuty integration)

2. **Review và adjust thresholds:**
   - Monitor trong 1-2 tuần đầu
   - Điều chỉnh thresholds dựa trên baseline
   - Tránh alert fatigue (quá nhiều false positives)

3. **Setup cost alerts:**
   - Alert khi cost vượt budget
   - Monitor ECS task count để tránh scale quá nhiều

4. **Regular review:**
   - Review alarms hàng tuần
   - Analyze trends
   - Optimize auto scaling policies

5. **Document runbooks:**
   - Tạo runbook cho từng loại alert
   - Document steps để troubleshoot

## Cost của Monitoring

- **CloudWatch Alarms**: Free (10 alarms free)
- **CloudWatch Metrics**: Free (10 custom metrics free)
- **SNS**: Free (100,000 notifications/month free)
- **Auto Scaling**: Free
- **CloudWatch Dashboard**: Free

**Tổng chi phí monitoring: ~$0-5/tháng** (tùy số lượng metrics và alarms)

## Next Steps

1. ✅ Deploy monitoring stack
2. ✅ Confirm SNS subscription
3. ⬜ Setup CloudWatch Dashboard
4. ⬜ Test alarms
5. ⬜ Setup Slack/PagerDuty integration (optional)
6. ⬜ Review và adjust thresholds sau 1-2 tuần
7. ⬜ Create runbooks cho common alerts

