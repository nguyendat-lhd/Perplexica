# AI Agent Review Mode

## Tổng quan

AI Agent Review Mode là một tính năng mới trong Perplexica cho phép tìm kiếm và đánh giá các AI agent dựa trên thông tin đầu vào, với khả năng xuất ra nội dung mô tả chi tiết, hình ảnh và video liên quan.

## Tính năng chính

### 1. Tìm kiếm AI Agent thông minh
- Tự động nhận diện các AI agent từ query của người dùng
- Tìm kiếm thông tin chi tiết về AI agent từ nhiều nguồn
- Hỗ trợ các AI agent phổ biến như ChatGPT, Claude, Bard, Copilot, v.v.

### 2. Đánh giá toàn diện
- **Overview**: Giới thiệu tổng quan về AI agent
- **Technical Specifications**: Chi tiết kỹ thuật, kiến trúc model, khả năng
- **Use Cases**: Các ứng dụng và trường hợp sử dụng chính
- **Strengths**: Điểm mạnh của AI agent
- **Limitations**: Hạn chế và thách thức hiện tại
- **Comparison**: So sánh với các AI agent khác
- **Recommendations**: Khi nào nên sử dụng AI agent này
- **Future Outlook**: Triển vọng phát triển

### 3. Hỗ trợ đa phương tiện
- **Tìm kiếm hình ảnh**: Screenshot, giao diện, diagram kiến trúc
- **Tìm kiếm video**: Tutorial, demo, review, so sánh
- **Sources**: Danh sách nguồn tham khảo đáng tin cậy

## Cách sử dụng

### 1. Chọn chế độ AI Agent Review
- Trong giao diện chính, click vào dropdown "Focus"
- Chọn "AI Agent Review" từ danh sách các chế độ tìm kiếm
- Icon: 🧠 (Brain)

### 2. Đặt câu hỏi về AI Agent
Ví dụ các câu hỏi:
- "Tell me about ChatGPT and how it works"
- "Compare Claude AI with GPT-4"
- "What are the best AI writing assistants?"
- "Review GitHub Copilot for coding"
- "How does Midjourney work for image generation?"

### 3. Xem kết quả
- Đọc đánh giá chi tiết về AI agent
- Click "Find Images" để xem hình ảnh liên quan
- Click "Find Videos" để xem video tutorial/demo
- Xem danh sách sources để tìm hiểu thêm

## Cấu trúc kỹ thuật

### Backend
- **Prompt Engineering**: Sử dụng prompts chuyên biệt cho AI agent review
- **Search Integration**: Tích hợp với các search engine (Google, Bing, DuckDuckGo)
- **Media APIs**: Sử dụng existing image/video search APIs

### Frontend
- **AIAgentReviewWidget**: Component chính hiển thị kết quả
- **Focus Mode Integration**: Tích hợp vào hệ thống focus mode hiện có
- **Media Display**: Hiển thị hình ảnh và video với UI đẹp mắt

### Files được tạo/cập nhật
```
src/lib/prompts/aiAgentReview.ts          # Prompts cho AI agent review
src/components/AIAgentReviewWidget.tsx    # Component hiển thị kết quả
src/lib/prompts/index.ts                  # Export prompts
src/lib/search/index.ts                   # Thêm aiAgentReview mode
src/components/MessageBox.tsx             # Tích hợp widget
src/components/MessageInputActions/Focus.tsx # Thêm option mới
```

## Ví dụ sử dụng

### Query: "Tell me about ChatGPT"
**Kết quả:**
- Đánh giá chi tiết về ChatGPT
- Hình ảnh: Giao diện ChatGPT, logo, diagram kiến trúc
- Video: Tutorial sử dụng ChatGPT, so sánh với các AI khác
- Sources: OpenAI official docs, Wikipedia, reviews

### Query: "Compare Claude vs GPT-4"
**Kết quả:**
- So sánh chi tiết giữa Claude và GPT-4
- Hình ảnh: Biểu đồ so sánh, giao diện của cả hai
- Video: Demo side-by-side, review comparison
- Sources: Anthropic docs, OpenAI docs, independent reviews

## Lợi ích

1. **Thông tin toàn diện**: Cung cấp cái nhìn 360 độ về AI agent
2. **Đa phương tiện**: Kết hợp text, hình ảnh, video
3. **So sánh khách quan**: Giúp người dùng đưa ra quyết định
4. **Cập nhật thường xuyên**: Tự động tìm kiếm thông tin mới nhất
5. **Dễ sử dụng**: Giao diện trực quan, tích hợp mượt mà

## Tương lai

- Thêm support cho nhiều AI agent hơn
- Cải thiện khả năng nhận diện AI agent
- Thêm tính năng rating và review từ cộng đồng
- Tích hợp với các API AI agent để test trực tiếp
- Thêm tính năng so sánh nhiều AI agent cùng lúc

