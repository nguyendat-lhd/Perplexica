#!/bin/bash

# ==============================================================================
# AWS EC2 Deployment Setup Script
# ==============================================================================
# Script tự động setup AWS resources cho GitHub Actions deployment
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IAM_USER_NAME="github-actions-perplexica"
KEY_PAIR_NAME="trangvang-perplexica-key"
AWS_REGION="ap-southeast-1"
GITHUB_REPO="nguyendat-lhd/Perplexica"  # Update với repo của bạn

# ==============================================================================
# Helper Functions
# ==============================================================================

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI chưa được cài đặt!"
        echo "Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    print_success "AWS CLI đã cài đặt"
}

check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials chưa được cấu hình!"
        echo "Chạy: aws configure"
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    print_success "AWS credentials OK"
    print_info "Account ID: $ACCOUNT_ID"
    print_info "User: $USER_ARN"
}

check_github_cli() {
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI chưa cài đặt (optional)"
        print_info "Bạn sẽ cần add GitHub Secrets thủ công"
        return 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_warning "GitHub CLI chưa authenticated"
        print_info "Chạy: gh auth login"
        return 1
    fi
    
    print_success "GitHub CLI ready"
    return 0
}

# ==============================================================================
# Main Setup Functions
# ==============================================================================

create_iam_user() {
    print_header "📝 Bước 1: Tạo IAM User"
    
    # Check if user exists
    if aws iam get-user --user-name "$IAM_USER_NAME" &> /dev/null; then
        print_warning "IAM User '$IAM_USER_NAME' đã tồn tại"
        read -p "Xóa và tạo lại? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Delete access keys first
            print_info "Xóa access keys cũ..."
            aws iam list-access-keys --user-name "$IAM_USER_NAME" --query 'AccessKeyMetadata[].AccessKeyId' --output text | while read -r key; do
                aws iam delete-access-key --user-name "$IAM_USER_NAME" --access-key-id "$key" || true
            done
            
            # Detach policies
            print_info "Xóa policies..."
            aws iam list-attached-user-policies --user-name "$IAM_USER_NAME" --query 'AttachedPolicies[].PolicyArn' --output text | while read -r policy; do
                aws iam detach-user-policy --user-name "$IAM_USER_NAME" --policy-arn "$policy" || true
            done
            
            # Delete user
            aws iam delete-user --user-name "$IAM_USER_NAME" || true
            print_success "Đã xóa user cũ"
        else
            print_info "Sử dụng user hiện tại"
            return 0
        fi
    fi
    
    # Create IAM user
    print_info "Tạo IAM user: $IAM_USER_NAME"
    aws iam create-user --user-name "$IAM_USER_NAME" > /dev/null
    print_success "Đã tạo IAM user"
    
    # Attach policies
    print_info "Attach policies..."
    aws iam attach-user-policy \
        --user-name "$IAM_USER_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
    
    aws iam attach-user-policy \
        --user-name "$IAM_USER_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
    
    # Create custom CloudFormation policy
    print_info "Tạo CloudFormation policy..."
    POLICY_JSON=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:GetRole",
                "iam:PassRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy"
            ],
            "Resource": "*"
        }
    ]
}
EOF
)
    
    POLICY_ARN=$(aws iam create-policy \
        --policy-name "PerplexicaCloudFormationPolicy" \
        --policy-document "$POLICY_JSON" \
        --query 'Policy.Arn' \
        --output text 2>/dev/null || echo "arn:aws:iam::${ACCOUNT_ID}:policy/PerplexicaCloudFormationPolicy")
    
    aws iam attach-user-policy \
        --user-name "$IAM_USER_NAME" \
        --policy-arn "$POLICY_ARN" || true
    
    print_success "Đã attach policies"
    
    # Create access key
    print_info "Tạo access key..."
    ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name "$IAM_USER_NAME")
    
    AWS_ACCESS_KEY_ID=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*' | cut -d'"' -f4)
    AWS_SECRET_ACCESS_KEY=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*' | cut -d'"' -f4)
    
    print_success "Đã tạo access key"
    
    # Save to file
    mkdir -p .aws-credentials
    cat > .aws-credentials/github-actions-credentials.txt <<EOF
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
EOF
    
    print_success "Đã lưu credentials vào .aws-credentials/github-actions-credentials.txt"
}

create_key_pair() {
    print_header "🔑 Bước 2: Tạo EC2 Key Pair"
    
    # Check if key pair exists
    if aws ec2 describe-key-pairs --key-names "$KEY_PAIR_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_warning "Key pair '$KEY_PAIR_NAME' đã tồn tại"
        read -p "Xóa và tạo lại? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws ec2 delete-key-pair --key-name "$KEY_PAIR_NAME" --region "$AWS_REGION"
            print_success "Đã xóa key pair cũ"
        else
            print_info "Sử dụng key pair hiện tại"
            if [ ! -f ".aws-credentials/${KEY_PAIR_NAME}.pem" ]; then
                print_error "File .pem không tồn tại! Cần tạo lại key pair."
                read -p "Tạo lại? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    return 0
                fi
            else
                return 0
            fi
        fi
    fi
    
    # Create key pair
    print_info "Tạo key pair: $KEY_PAIR_NAME"
    mkdir -p .aws-credentials
    
    aws ec2 create-key-pair \
        --key-name "$KEY_PAIR_NAME" \
        --region "$AWS_REGION" \
        --query 'KeyMaterial' \
        --output text > ".aws-credentials/${KEY_PAIR_NAME}.pem"
    
    chmod 400 ".aws-credentials/${KEY_PAIR_NAME}.pem"
    print_success "Đã tạo và lưu key pair vào .aws-credentials/${KEY_PAIR_NAME}.pem"
}

setup_github_secrets() {
    print_header "🔐 Bước 3: Setup GitHub Secrets"
    
    if ! check_github_cli; then
        print_warning "Không thể tự động add GitHub Secrets"
        print_info "Vui lòng add thủ công:"
        echo ""
        echo "GitHub Repository → Settings → Secrets and variables → Actions"
        echo ""
        echo "Add 3 secrets sau:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. AWS_ACCESS_KEY_ID"
        cat .aws-credentials/github-actions-credentials.txt | grep AWS_ACCESS_KEY_ID
        echo ""
        echo "2. AWS_SECRET_ACCESS_KEY"
        cat .aws-credentials/github-actions-credentials.txt | grep AWS_SECRET_ACCESS_KEY
        echo ""
        echo "3. EC2_SSH_PRIVATE_KEY"
        echo "(Copy toàn bộ nội dung file .aws-credentials/${KEY_PAIR_NAME}.pem)"
        echo ""
        return 0
    fi
    
    print_info "Đang add GitHub Secrets tự động..."
    
    # Add secrets using GitHub CLI
    echo "$AWS_ACCESS_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID -R "$GITHUB_REPO"
    print_success "Added AWS_ACCESS_KEY_ID"
    
    echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY -R "$GITHUB_REPO"
    print_success "Added AWS_SECRET_ACCESS_KEY"
    
    gh secret set EC2_SSH_PRIVATE_KEY -R "$GITHUB_REPO" < ".aws-credentials/${KEY_PAIR_NAME}.pem"
    print_success "Added EC2_SSH_PRIVATE_KEY"
    
    print_success "Đã add tất cả GitHub Secrets"
}

verify_setup() {
    print_header "✅ Bước 4: Verify Setup"
    
    print_info "Kiểm tra IAM User..."
    if aws iam get-user --user-name "$IAM_USER_NAME" &> /dev/null; then
        print_success "IAM User: $IAM_USER_NAME ✓"
    else
        print_error "IAM User không tồn tại!"
    fi
    
    print_info "Kiểm tra Key Pair..."
    if aws ec2 describe-key-pairs --key-names "$KEY_PAIR_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_success "Key Pair: $KEY_PAIR_NAME ✓"
    else
        print_error "Key Pair không tồn tại!"
    fi
    
    print_info "Kiểm tra credentials file..."
    if [ -f ".aws-credentials/github-actions-credentials.txt" ]; then
        print_success "Credentials file ✓"
    else
        print_error "Credentials file không tồn tại!"
    fi
    
    print_info "Kiểm tra .pem file..."
    if [ -f ".aws-credentials/${KEY_PAIR_NAME}.pem" ]; then
        print_success "PEM file ✓"
    else
        print_error "PEM file không tồn tại!"
    fi
}

trigger_deployment() {
    print_header "🚀 Bước 5: Trigger Deployment"
    
    read -p "Trigger deployment ngay bây giờ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Bỏ qua deployment. Bạn có thể trigger sau."
        return 0
    fi
    
    print_info "Triggering deployment..."
    
    # Create empty commit to trigger deployment
    git add .aws-credentials/.gitkeep || true
    git commit --allow-empty -m "chore: trigger EC2 deployment" || true
    git push origin develop-deployment || print_error "Push failed. Vui lòng push thủ công."
    
    print_success "Đã trigger deployment!"
    print_info "Xem progress tại: https://github.com/$GITHUB_REPO/actions"
}

cleanup_sensitive_files() {
    print_header "🧹 Cleanup"
    
    print_warning "QUAN TRỌNG: Credentials đã được lưu tại .aws-credentials/"
    print_info "File này đã được add vào .gitignore để tránh commit lên GitHub"
    
    # Add to .gitignore if not exists
    if ! grep -q ".aws-credentials" .gitignore 2>/dev/null; then
        echo "" >> .gitignore
        echo "# AWS Credentials (DO NOT COMMIT)" >> .gitignore
        echo ".aws-credentials/" >> .gitignore
        print_success "Đã add .aws-credentials vào .gitignore"
    fi
    
    # Create .gitkeep
    mkdir -p .aws-credentials
    touch .aws-credentials/.gitkeep
    
    print_success "Cleanup hoàn tất"
}

show_summary() {
    print_header "📋 Summary"
    
    echo -e "${GREEN}✅ Setup hoàn tất!${NC}\n"
    
    echo "📁 Files đã tạo:"
    echo "  └─ .aws-credentials/github-actions-credentials.txt"
    echo "  └─ .aws-credentials/${KEY_PAIR_NAME}.pem"
    echo ""
    
    echo "🔐 GitHub Secrets cần add (nếu chưa tự động):"
    echo "  1. AWS_ACCESS_KEY_ID"
    echo "  2. AWS_SECRET_ACCESS_KEY"
    echo "  3. EC2_SSH_PRIVATE_KEY"
    echo ""
    
    echo "🚀 Next Steps:"
    echo "  1. Verify GitHub Secrets: https://github.com/$GITHUB_REPO/settings/secrets/actions"
    echo "  2. Trigger deployment:"
    echo "     → Push code: git push origin develop-deployment"
    echo "     → Hoặc manual: GitHub Actions → Deploy to EC2 Staging → Run workflow"
    echo "  3. Monitor: https://github.com/$GITHUB_REPO/actions"
    echo ""
    
    echo "📚 Documentation:"
    echo "  → SETUP_EC2_DEPLOYMENT.md"
    echo "  → QUICK_DEPLOY_GUIDE.md"
    echo "  → DEPLOYMENT_WORKFLOW.md"
    echo ""
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    print_header "🚀 AWS EC2 Deployment Setup"
    
    echo "Script này sẽ tự động setup:"
    echo "  1. IAM User với permissions cần thiết"
    echo "  2. EC2 Key Pair"
    echo "  3. GitHub Secrets (nếu có GitHub CLI)"
    echo "  4. Trigger deployment (optional)"
    echo ""
    
    read -p "Tiếp tục? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Đã hủy."
        exit 0
    fi
    
    # Prerequisites
    check_aws_cli
    check_aws_credentials
    
    # Main setup
    create_iam_user
    create_key_pair
    setup_github_secrets
    verify_setup
    cleanup_sensitive_files
    trigger_deployment
    
    # Summary
    show_summary
    
    print_success "🎉 Hoàn tất setup!"
}

# Run main
main "$@"

