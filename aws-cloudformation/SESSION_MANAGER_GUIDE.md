# AWS Session Manager Guide

Hướng dẫn sử dụng AWS Systems Manager Session Manager để quản lý EC2 instances thay vì SSH.

## 🎯 Tại sao dùng Session Manager?

✅ **Bảo mật hơn**: Không cần mở port 22  
✅ **Không cần key pairs**: Quản lý qua IAM  
✅ **Audit logs**: Tất cả sessions được log  
✅ **Dễ quản lý**: Không cần giữ key files  
✅ **Port forwarding**: Có thể forward ports qua Session Manager  

## 📋 Prerequisites

### 1. Install Session Manager Plugin

**macOS:**
```bash
brew install --cask session-manager-plugin
```

**Linux:**
```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
sudo yum install -y session-manager-plugin.rpm
```

**Windows:**
Download từ: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

### 2. Verify Installation

```bash
session-manager-plugin
# Should show version info
```

### 3. IAM Permissions

Đảm bảo IAM user/role của bạn có permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:StartSession"
      ],
      "Resource": [
        "arn:aws:ec2:*:*:instance/*",
        "arn:aws:ssm:*:*:document/AWS-StartSSMSession"
      ]
    }
  ]
}
```

EC2 instance đã được cấu hình với `AmazonSSMManagedInstanceCore` policy trong template.

## 🚀 Cách sử dụng

### Connect to Instance

```bash
# Get instance ID
INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name perplexica-simple-development \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
  --output text)

# Connect via Session Manager
aws ssm start-session --target ${INSTANCE_ID} --region ap-southeast-1
```

Hoặc dùng command từ stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name perplexica-simple-development \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='SessionManagerCommand'].OutputValue" \
  --output text | bash
```

### Disconnect

Trong session, gõ:
```
exit
```

Hoặc nhấn `Ctrl+D`

## 🔧 Useful Commands

### Check Docker Services

```bash
# Connect to instance
aws ssm start-session --target <instance-id>

# Once connected:
cd /home/ec2-user/perplexica
docker-compose ps
docker-compose logs
docker-compose logs -f app  # Follow logs
```

### Restart Services

```bash
cd /home/ec2-user/perplexica
docker-compose restart
# hoặc
docker-compose down
docker-compose up -d
```

### Update Code

```bash
cd /home/ec2-user/perplexica
git pull
docker-compose up -d --build
```

### Check System Resources

```bash
# CPU and Memory
top
# hoặc
htop  # if installed

# Disk usage
df -h
du -sh /home/ec2-user/perplexica/*

# Docker stats
docker stats
```

## 🔌 Port Forwarding

Session Manager hỗ trợ port forwarding để access services local:

### Forward Perplexica Web (port 3000)

```bash
aws ssm start-session \
  --target <instance-id> \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3000"],"localPortNumber":["3000"]}'
```

Sau đó mở browser: `http://localhost:3000`

### Forward Multiple Ports

Cần mở nhiều terminals:

**Terminal 1:**
```bash
aws ssm start-session \
  --target <instance-id> \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3000"],"localPortNumber":["3000"]}'
```

**Terminal 2:**
```bash
aws ssm start-session \
  --target <instance-id> \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3001"],"localPortNumber":["3001"]}'
```

**Terminal 3:**
```bash
aws ssm start-session \
  --target <instance-id> \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["4000"],"localPortNumber":["4000"]}'
```

## 📝 Script Helper

Tạo script để dễ connect:

```bash
# Create file: connect-instance.sh
#!/bin/bash

STACK_NAME=${1:-perplexica-simple-development}
REGION=${2:-ap-southeast-1}

INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
  --output text)

if [ -z "$INSTANCE_ID" ]; then
  echo "Error: Could not find instance ID"
  exit 1
fi

echo "Connecting to instance: ${INSTANCE_ID}"
aws ssm start-session --target ${INSTANCE_ID} --region ${REGION}
```

```bash
chmod +x connect-instance.sh
./connect-instance.sh
```

## 🔐 Security Best Practices

### 1. Restrict IAM Permissions

Chỉ cho phép specific users/roles:

```json
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::ACCOUNT_ID:user/specific-user"
  },
  "Action": "ssm:StartSession",
  "Resource": "arn:aws:ec2:region:account:instance/instance-id"
}
```

### 2. Enable Session Logging

Sessions được tự động log vào CloudWatch Logs hoặc S3.

### 3. Use Session Preferences

Tạo session preferences để enforce best practices:

```bash
aws ssm create-document \
  --name SSM-SessionManagerRunShell \
  --document-type Session \
  --content file://session-preferences.json
```

## 🆚 So sánh với SSH

| Feature | Session Manager | SSH |
|---------|----------------|-----|
| **Port** | Không cần mở port | Cần port 22 |
| **Key Pair** | Không cần | Cần |
| **Security** | IAM-based | Key-based |
| **Audit** | Tự động log | Cần setup riêng |
| **Port Forward** | Có | Có |
| **File Transfer** | Cần S3 hoặc scp qua port forward | scp/sftp |

## 🐛 Troubleshooting

### Session Manager không connect được

1. **Check IAM permissions:**
```bash
aws iam get-user-policy --user-name your-user --policy-name your-policy
```

2. **Check instance IAM role:**
```bash
aws ec2 describe-instances \
  --instance-ids <instance-id> \
  --query "Reservations[0].Instances[0].IamInstanceProfile"
```

3. **Check SSM Agent:**
```bash
# Connect via console hoặc existing session
sudo systemctl status amazon-ssm-agent
sudo systemctl start amazon-ssm-agent
```

4. **Check instance connectivity:**
- Instance phải có internet access (qua NAT hoặc public IP)
- Security group phải allow outbound traffic

### Plugin không hoạt động

```bash
# Reinstall plugin
brew reinstall --cask session-manager-plugin

# Check AWS CLI version
aws --version  # Should be >= 1.16.0
```

## 📚 Additional Resources

- [AWS Session Manager Documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [Session Manager Plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)
- [Port Forwarding Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html#sessions-port-forwarding)

