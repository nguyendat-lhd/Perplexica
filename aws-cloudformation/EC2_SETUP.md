# Setup EC2 thay vì Fargate để tiết kiệm

## Giải thích ngắn gọn

**ECR (Elastic Container Registry):**
- ✅ **LUÔN CẦN THIẾT** - Nơi lưu Docker images
- Giống như Docker Hub nhưng của AWS
- Chi phí: ~$0.50/tháng (rất rẻ)
- **Không thể thay thế** - Cả Fargate và EC2 đều cần pull images từ ECR

**Fargate vs EC2:**
- **Fargate**: AWS quản lý EC2 cho bạn → Đắt hơn (~$32/tháng)
- **EC2**: Bạn tự quản lý EC2 → Rẻ hơn (~$7-18/tháng)

## Template hiện tại

Template `perplexica-stack.yaml` hiện tại đang dùng **Fargate**.

Để tiết kiệm, bạn có 2 options:

### Option 1: Dùng template hiện tại với Fargate (Đơn giản)

- Template đã sẵn sàng
- Chỉ cần deploy
- Chi phí: ~$72-87/tháng (với NAT Instance)

### Option 2: Modify để dùng EC2 (Tiết kiệm hơn)

Cần thay đổi:
1. Thêm EC2 instances vào ECS cluster
2. Thay `LaunchType: FARGATE` thành không có LaunchType (dùng EC2)
3. Setup Auto Scaling Group cho EC2
4. Setup IAM roles cho EC2 instances

**Chi phí với EC2:** ~$48-58/tháng (tiết kiệm ~$24-29/tháng)

## Khuyến nghị

**Cho Dev Environment:**
- ✅ Dùng EC2 với Spot instances: ~$48/tháng
- ✅ Setup auto start/stop: ~$42/tháng

**Cho Production:**
- ✅ Dùng Fargate: Dễ quản lý, auto-scaling tốt
- Hoặc EC2 Reserved Instances nếu commit lâu dài

## Cách deploy với EC2

Template hiện tại chưa hỗ trợ EC2 đầy đủ. Bạn có thể:

1. **Dùng template hiện tại với Fargate** (đơn giản nhất)
2. **Tạo variant template với EC2** (cần modify template)
3. **Deploy thủ công EC2 instances** sau khi deploy stack

Tôi có thể tạo variant template với EC2 nếu bạn muốn!

