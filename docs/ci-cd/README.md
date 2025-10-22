# 🔄 CI/CD Documentation

Tài liệu về tích hợp liên tục và triển khai liên tục (CI/CD) cho Perplexica.

## 📑 Nội dung

### Hướng dẫn thiết lập
- **[GIT_FLOW_CI_CD.md](./GIT_FLOW_CI_CD.md)** ⭐ - Quy trình Git Flow và CI/CD workflow
- **[NODEJS_CI_CD_SETUP.md](./NODEJS_CI_CD_SETUP.md)** - Thiết lập CI/CD cho Node.js deployment
- **[README_CI_CD.md](./README_CI_CD.md)** - Tổng quan về CI/CD pipeline

### Testing và Monitoring
- **[CI_TEST.md](./CI_TEST.md)** - Hướng dẫn testing trong CI pipeline
- **[GITHUB_WORKFLOWS_STATUS.md](./GITHUB_WORKFLOWS_STATUS.md)** - Trạng thái và monitoring của GitHub Workflows

## 🚀 Quick Start

### 1. Setup GitHub Actions
```bash
# Repository đã có sẵn workflows trong .github/workflows/
# Chỉ cần configure secrets
```

### 2. Configure Secrets
Cần thiết lập các secrets sau trong GitHub repository:

#### AWS Credentials
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - Region (default: ap-southeast-1)

#### API Keys
- `GEMINI_API_KEY` - Google Gemini API key
- `CUSTOM_OPENAI_API_KEY` - Custom OpenAI API key
- `GROQ_API_KEY` - Groq API key (optional)

#### Notifications
- `SLACK_WEBHOOK_URL` - Slack webhook cho notifications (optional)

### 3. Trigger Deployment
```bash
# Staging: Push to develop branch
git push origin develop

# Production: Manual trigger hoặc push to main
gh workflow run deploy.yml -f environment=production
```

## 🔄 Git Flow

### Branch Strategy
```
main (production)
  ↑
release/v1.x
  ↑
develop (staging)
  ↑
feature/xxx, bugfix/xxx, hotfix/xxx
```

### Workflow Steps

#### 1. Feature Development
```bash
# Tạo feature branch
git checkout develop
git checkout -b feature/new-feature

# Develop và commit
git add .
git commit -m "feat: add new feature"

# Push và tạo PR
git push origin feature/new-feature
```

#### 2. Staging Deployment
```bash
# Merge PR vào develop
# Auto deploy to staging via GitHub Actions
```

#### 3. Production Release
```bash
# Tạo release branch
git checkout develop
git checkout -b release/v1.2.0

# Final testing và bug fixes
git commit -m "fix: final adjustments"

# Merge vào main
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags

# Manual trigger production deployment
```

## 🛠️ CI/CD Pipeline

### Pipeline Stages

#### 1. Code Quality (CI)
- **Linting**: ESLint, Prettier
- **Type Checking**: TypeScript
- **Unit Tests**: Jest
- **Code Coverage**: >80%

#### 2. Build
- **Install Dependencies**: `npm ci`
- **Build Application**: `npm run build`
- **Optimize Assets**: Minification, compression

#### 3. Deploy (CD)
- **Infrastructure**: CloudFormation stack update
- **Application**: Deploy to EC2
- **Configuration**: Update environment variables
- **Health Check**: Verify deployment

#### 4. Post-deployment
- **Smoke Tests**: Critical path testing
- **Monitoring**: Check metrics
- **Notifications**: Slack/Email alerts

## 📊 Pipeline Visualization

```
[Push Code] → [Linting] → [Tests] → [Build] → [Deploy to Staging]
                  ↓           ↓         ↓              ↓
               [Fail]      [Fail]    [Fail]     [Health Check]
                  ↓           ↓         ↓              ↓
             [Notify]    [Notify]  [Notify]    [Manual Approve]
                                                       ↓
                                              [Deploy to Production]
                                                       ↓
                                                [Health Check]
                                                       ↓
                                                   [Notify]
```

## 🔧 Configuration Files

### GitHub Actions Workflows
```
.github/workflows/
├── deploy.yml              # Main deployment workflow
├── test.yml               # Test workflow
├── lint.yml               # Linting workflow
└── release.yml            # Release workflow
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'perplexica',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

## 🧪 Testing in CI

### Run Tests Locally
```bash
# All tests
npm test

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### CI Test Configuration
Xem chi tiết tại [CI_TEST.md](./CI_TEST.md)

## 📈 Monitoring

### GitHub Actions Status
- Xem [GITHUB_WORKFLOWS_STATUS.md](./GITHUB_WORKFLOWS_STATUS.md)
- Badges: ![Deploy Status](https://github.com/user/repo/workflows/deploy.yml/badge.svg)

### Application Monitoring
- Health checks: `/api/health`
- Metrics: CloudWatch
- Logs: CloudWatch Logs

### Alerts
- Failed deployments → Slack
- Health check failures → Email
- Critical errors → SMS (if configured)

## 🚨 Troubleshooting

### Common CI/CD Issues

#### Deployment Failed
```bash
# Check workflow logs
gh run list
gh run view <run-id>

# Check application logs
ssh -i ~/.ssh/perplexica-key.pem ubuntu@<EC2-IP>
pm2 logs perplexica
```

#### Tests Failed
```bash
# Run tests locally
npm test

# Check specific test
npm test -- test-file.spec.ts

# Debug mode
npm test -- --verbose
```

#### Build Failed
```bash
# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## 📚 Best Practices

### Commit Messages
```
feat: add new feature
fix: resolve bug
docs: update documentation
chore: update dependencies
test: add tests
refactor: code refactoring
```

### Pull Requests
- Clear description
- Link to issues
- Screenshots/videos if UI changes
- Request reviews
- Wait for CI to pass

### Deployment
- Always test on staging first
- Review changes before production
- Have rollback plan
- Monitor after deployment
- Document changes

## 🔐 Security

### Secrets Management
- Never commit secrets
- Use GitHub Secrets
- Rotate keys regularly
- Audit access logs

### Access Control
- Protected branches (main, develop)
- Required reviews
- Status checks must pass
- Signed commits (optional)

## 📖 Related Documentation

- [Deployment Guide](../deployment/)
- [Troubleshooting](../troubleshooting/)
- [Git Flow Details](./GIT_FLOW_CI_CD.md)
- [Node.js CI/CD Setup](./NODEJS_CI_CD_SETUP.md)

## 🎯 Next Steps

1. **Setup CI/CD**: Follow [NODEJS_CI_CD_SETUP.md](./NODEJS_CI_CD_SETUP.md)
2. **Configure Git Flow**: Read [GIT_FLOW_CI_CD.md](./GIT_FLOW_CI_CD.md)
3. **Monitor Workflows**: Check [GITHUB_WORKFLOWS_STATUS.md](./GITHUB_WORKFLOWS_STATUS.md)
4. **Run Tests**: Review [CI_TEST.md](./CI_TEST.md)

[← Quay lại Docs chính](../README.md)

