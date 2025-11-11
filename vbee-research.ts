/**
 * Script sử dụng Code Mode của MCP Perplexica để:
 * 1. Tìm hiểu thông tin về VBee AI từ https://vbee.vn/
 * 2. Tìm kiếm hình ảnh liên quan
 * 3. Tìm kiếm video YouTube
 * 4. Tạo bài báo tổng hợp
 */

// Code để execute qua Code Mode API
// Lưu ý: apiBaseUrl sẽ được inject vào sandbox thông qua executor
const code = `
// Import PerplexicaAPI (sẽ được inject vào sandbox)
// api instance đã được tạo sẵn trong sandbox với baseUrl đúng

// Kết quả tổng hợp
const article = {
  title: "VBee AI - Tổng quan và Đánh giá",
  sections: [],
  images: [],
  videos: [],
  sources: []
};

console.log("🔍 Bắt đầu nghiên cứu về VBee AI...");

// 1. Tìm hiểu thông tin về VBee AI
console.log("\\n📝 Đang tìm kiếm thông tin về VBee AI...");
const searchResult = await api.search({
  query: "VBee AI vbee.vn công nghệ AI giọng nói Việt Nam",
  focusMode: "webSearch",
  optimizationMode: "quality"
});

article.sections.push({
  title: "Thông tin về VBee AI",
  content: searchResult.message,
  sources: searchResult.sources || []
});

console.log("✅ Đã thu thập thông tin cơ bản");
console.log("Số lượng nguồn:", searchResult.sources?.length || 0);

// 2. Tìm kiếm hình ảnh về VBee
console.log("\\n🖼️ Đang tìm kiếm hình ảnh về VBee...");
const imageResult = await api.searchImages({
  query: "VBee AI công nghệ giọng nói Việt Nam"
});

if (imageResult && imageResult.images) {
  article.images = imageResult.images.slice(0, 10); // Lấy 10 hình đầu tiên
  console.log("✅ Đã tìm thấy", article.images.length, "hình ảnh");
} else {
  console.log("⚠️ Không tìm thấy hình ảnh");
}

// 3. Tìm kiếm video YouTube về VBee
console.log("\\n🎥 Đang tìm kiếm video YouTube về VBee...");
const videoResult = await api.searchVideos({
  query: "VBee AI công nghệ giọng nói"
});

if (videoResult && videoResult.videos) {
  article.videos = videoResult.videos.slice(0, 10); // Lấy 10 video đầu tiên
  console.log("✅ Đã tìm thấy", article.videos.length, "video");
} else {
  console.log("⚠️ Không tìm thấy video");
}

// 4. Tìm hiểu thêm về công nghệ và ứng dụng
console.log("\\n🔬 Đang tìm hiểu về công nghệ và ứng dụng của VBee...");
const techSearch = await api.search({
  query: "VBee AI công nghệ text-to-speech TTS giọng nói tiếng Việt ứng dụng",
  focusMode: "webSearch",
  optimizationMode: "quality"
});

article.sections.push({
  title: "Công nghệ và Ứng dụng",
  content: techSearch.message,
  sources: techSearch.sources || []
});

// 5. Tạo nhận định và đánh giá
console.log("\\n💭 Đang tạo nhận định và đánh giá...");
const analysisSearch = await api.search({
  query: "đánh giá VBee AI ưu điểm nhược điểm so sánh với công nghệ khác",
  focusMode: "webSearch",
  optimizationMode: "quality"
});

article.sections.push({
  title: "Nhận định và Đánh giá",
  content: analysisSearch.message,
  sources: analysisSearch.sources || []
});

// 6. Tổng hợp tất cả nguồn
const allSources = new Set();
article.sections.forEach(section => {
  if (section.sources) {
    section.sources.forEach(source => {
      if (source.url) {
        allSources.add(source.url);
      }
    });
  }
});
article.sources = Array.from(allSources);

// In kết quả
console.log("\\n" + "=".repeat(80));
console.log("📄 BÀI BÁO TỔNG HỢP VỀ VBEE AI");
console.log("=".repeat(80));
console.log("\\n📌 Tiêu đề:", article.title);
console.log("\\n📊 Thống kê:");
console.log("  - Số phần:", article.sections.length);
console.log("  - Số hình ảnh:", article.images.length);
console.log("  - Số video:", article.videos.length);
console.log("  - Số nguồn tham khảo:", article.sources.length);

console.log("\\n" + "-".repeat(80));
article.sections.forEach((section, index) => {
  console.log("\\n## " + section.title);
  console.log(section.content.substring(0, 500) + "...");
  if (section.sources && section.sources.length > 0) {
    console.log("\\nNguồn tham khảo:");
    section.sources.slice(0, 3).forEach((source, i) => {
      console.log(\`  \${i + 1}. \${source.title || source.url}\`);
      console.log(\`     \${source.url}\`);
    });
  }
});

if (article.images.length > 0) {
  console.log("\\n" + "-".repeat(80));
  console.log("\\n🖼️ DANH SÁCH HÌNH ẢNH:");
  article.images.forEach((img, index) => {
    console.log(\`\\n\${index + 1}. \${img.title || 'Hình ảnh về VBee'}\`);
    console.log(\`   URL: \${img.url}\`);
    if (img.thumbnail) {
      console.log(\`   Thumbnail: \${img.thumbnail}\`);
    }
  });
}

if (article.videos.length > 0) {
  console.log("\\n" + "-".repeat(80));
  console.log("\\n🎥 DANH SÁCH VIDEO YOUTUBE:");
  article.videos.forEach((video, index) => {
    console.log(\`\\n\${index + 1}. \${video.title || 'Video về VBee'}\`);
    console.log(\`   URL: \${video.url}\`);
    if (video.thumbnail) {
      console.log(\`   Thumbnail: \${video.thumbnail}\`);
    }
    if (video.duration) {
      console.log(\`   Thời lượng: \${video.duration}\`);
    }
  });
}

console.log("\\n" + "=".repeat(80));
console.log("✅ Hoàn thành nghiên cứu về VBee AI!");
console.log("=".repeat(80));

// Trả về kết quả
return JSON.stringify(article, null, 2);
`;

// Export code để có thể sử dụng
export default code;

