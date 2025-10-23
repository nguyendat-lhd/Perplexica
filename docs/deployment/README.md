# 🚀 Deployment Documentation

Tài liệu hướng dẫn triển khai Perplexica lên các môi trường khác nhau.

## 📑 Nội dung

### Hướng dẫn chính
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** ⭐ - Hướng dẫn triển khai tổng quan với CloudFormation (recommended)
- **[DEPLOYMENT_GUIDE_NODEJS.md](./DEPLOYMENT_GUIDE_NODEJS.md)** - Hướng dẫn triển khai với Node.js và PM2

### Triển khai nhanh
- **[QUICK_DEPLOY_GUIDE.md](./QUICK_DEPLOY_GUIDE.md)** - Hướng dẫn triển khai nhanh nhất (5-10 phút)
- **[DEPLOY_EC2_QUICKSTART.md](./DEPLOY_EC2_QUICKSTART.md)** - Quick start cho AWS EC2

### Phương pháp triển khai EC2
- **[DEPLOY_EC2_CLOUDFORMATION.md](./DEPLOY_EC2_CLOUDFORMATION.md)** - Sử dụng CloudFormation (infrastructure as code)
- **[DEPLOY_EC2_AWS_CLI.md](./DEPLOY_EC2_AWS_CLI.md)** - Sử dụng AWS CLI
- **[DEPLOY_EC2_COMPOSE.md](./DEPLOY_EC2_COMPOSE.md)** - Sử dụng Docker Compose
- **[DEPLOY_TO_EXISTING_EC2.md](./DEPLOY_TO_EXISTING_EC2.md)** - Triển khai lên EC2 instance có sẵn

### Thiết lập và cấu hình
- **[SETUP_EC2_DEPLOYMENT.md](./SETUP_EC2_DEPLOYMENT.md)** - Thiết lập ban đầu cho EC2 deployment
- **[DEPLOYMENT_WORKFLOW.md](./DEPLOYMENT_WORKFLOW.md)** - Quy trình deployment chi tiết

### Checklist và tổng kết
- **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** - Checklist sẵn sàng deployment
- **[DEPLOYMENT_COMPLETED.md](./DEPLOYMENT_COMPLETED.md)** - Checklist sau khi deployment
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Tổng kết deployment

## 🎯 Lộ trình triển khai đề xuất

### Cho người mới bắt đầu
1. Đọc [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) để hiểu tổng quan
2. Làm theo [QUICK_DEPLOY_GUIDE.md](./QUICK_DEPLOY_GUIDE.md) để deploy nhanh
3. Kiểm tra [DEPLOYMENT_COMPLETED.md](./DEPLOYMENT_COMPLETED.md) để verify

### Cho production
1. Chuẩn bị theo [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)
2. Sử dụng [DEPLOY_EC2_CLOUDFORMATION.md](./DEPLOY_EC2_CLOUDFORMATION.md) cho infrastructure as code
3. Theo dõi [DEPLOYMENT_WORKFLOW.md](./DEPLOYMENT_WORKFLOW.md)
4. Verify bằng [DEPLOYMENT_COMPLETED.md](./DEPLOYMENT_COMPLETED.md)

### Cho existing infrastructure
1. Xem [DEPLOY_TO_EXISTING_EC2.md](./DEPLOY_TO_EXISTING_EC2.md)
2. Làm theo [DEPLOYMENT_GUIDE_NODEJS.md](./DEPLOYMENT_GUIDE_NODEJS.md) nếu dùng PM2

## 🛠️ Các phương pháp deployment

| Phương pháp | Phù hợp cho | Thời gian | Độ khó |
|-------------|-------------|-----------|---------|
| CloudFormation | Production, IaC | 15-20 phút | Trung bình |
| Docker Compose | Development, Testing | 10-15 phút | Dễ |
| Node.js/PM2 | Existing servers | 20-30 phút | Khó |
| AWS CLI | Manual setup | 25-35 phút | Khó |

## 🔧 Pre-deployment Requirements

### AWS Requirements
- AWS Account với quyền EC2, CloudFormation
- AWS CLI installed và configured
- SSH key pair

### Application Requirements
- API keys cho LLM providers (Gemini, OpenAI, etc.)
- Domain name (optional, cho SSL)
- Email address (cho SSL certificates)

### System Requirements
- Minimum: t3.small (2 vCPU, 2GB RAM)
- Recommended: t3.medium (2 vCPU, 4GB RAM)
- Storage: 20-30GB

## 📚 Tài liệu liên quan

- [CI/CD Documentation](../ci-cd/) - Tích hợp CI/CD với GitHub Actions
- [Troubleshooting](../troubleshooting/) - Xử lý lỗi deployment
- [Installation](../installation/) - Cài đặt và cấu hình
- [Architecture](../architecture/) - Hiểu về kiến trúc hệ thống

## 🆘 Cần trợ giúp?

- Gặp lỗi? Xem [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING.md)
- Câu hỏi về CI/CD? Xem [CI/CD Documentation](../ci-cd/)
- Vấn đề về LLM? Xem [LLM Troubleshooting](../troubleshooting/TROUBLESHOOTING_LLM.md)

[← Quay lại Docs chính](../README.md)



