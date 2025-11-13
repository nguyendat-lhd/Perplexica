#!/usr/bin/env tsx
/**
 * Script nghiên cứu về VBee AI - Gọi trực tiếp API endpoints
 * 
 * Usage:
 *   tsx vbee-research-direct.ts
 *   hoặc
 *   npm run research:vbee:direct
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL của Perplexica API
const API_BASE_URL = process.env.PERPLEXICA_BASE_URL || 'http://localhost:3000';

interface Article {
  title: string;
  sections: Array<{
    title: string;
    content: string;
    sources: any[];
  }>;
  images: any[];
  videos: any[];
  sources: string[];
}

async function callAPI(endpoint: string, body: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  return response.json();
}

async function runResearch() {
  console.log('🚀 Bắt đầu nghiên cứu về VBee AI...');
  console.log(`📡 Kết nối đến: ${API_BASE_URL}\n`);

  const article: Article = {
    title: 'VBee AI - Tổng quan và Đánh giá',
    sections: [],
    images: [],
    videos: [],
    sources: [],
  };

  try {
    // 1. Tìm hiểu thông tin về VBee AI
    console.log('📝 Đang tìm kiếm thông tin về VBee AI...');
    const searchResult1 = await callAPI('/api/search', {
      query: 'VBee AI vbee.vn công nghệ AI giọng nói Việt Nam',
      focusMode: 'webSearch',
      optimizationMode: 'quality',
      stream: false,
    });

    article.sections.push({
      title: 'Thông tin về VBee AI',
      content: searchResult1.message || '',
      sources: searchResult1.sources || [],
    });

    console.log('✅ Đã thu thập thông tin cơ bản');
    console.log(`   Số lượng nguồn: ${searchResult1.sources?.length || 0}`);

    // 2. Tìm kiếm hình ảnh về VBee
    console.log('\n🖼️ Đang tìm kiếm hình ảnh về VBee...');
    try {
      const imageResult = await callAPI('/api/images', {
        query: 'VBee AI công nghệ giọng nói Việt Nam',
      });

      if (imageResult && imageResult.images) {
        article.images = imageResult.images.slice(0, 10);
        console.log(`✅ Đã tìm thấy ${article.images.length} hình ảnh`);
      } else {
        console.log('⚠️ Không tìm thấy hình ảnh');
      }
    } catch (error: any) {
      console.log(`⚠️ Lỗi khi tìm hình ảnh: ${error.message}`);
    }

    // 3. Tìm kiếm video YouTube về VBee
    console.log('\n🎥 Đang tìm kiếm video YouTube về VBee...');
    try {
      const videoResult = await callAPI('/api/videos', {
        query: 'VBee AI công nghệ giọng nói',
      });

      if (videoResult && videoResult.videos) {
        article.videos = videoResult.videos.slice(0, 10);
        console.log(`✅ Đã tìm thấy ${article.videos.length} video`);
      } else {
        console.log('⚠️ Không tìm thấy video');
      }
    } catch (error: any) {
      console.log(`⚠️ Lỗi khi tìm video: ${error.message}`);
    }

    // 4. Tìm hiểu thêm về công nghệ và ứng dụng
    console.log('\n🔬 Đang tìm hiểu về công nghệ và ứng dụng của VBee...');
    const techSearch = await callAPI('/api/search', {
      query: 'VBee AI công nghệ text-to-speech TTS giọng nói tiếng Việt ứng dụng',
      focusMode: 'webSearch',
      optimizationMode: 'quality',
      stream: false,
    });

    article.sections.push({
      title: 'Công nghệ và Ứng dụng',
      content: techSearch.message || '',
      sources: techSearch.sources || [],
    });

    // 5. Tạo nhận định và đánh giá
    console.log('\n💭 Đang tạo nhận định và đánh giá...');
    const analysisSearch = await callAPI('/api/search', {
      query: 'đánh giá VBee AI ưu điểm nhược điểm so sánh với công nghệ khác',
      focusMode: 'webSearch',
      optimizationMode: 'quality',
      stream: false,
    });

    article.sections.push({
      title: 'Nhận định và Đánh giá',
      content: analysisSearch.message || '',
      sources: analysisSearch.sources || [],
    });

    // 6. Tổng hợp tất cả nguồn
    const allSources = new Set<string>();
    article.sections.forEach((section) => {
      if (section.sources) {
        section.sources.forEach((source: any) => {
          if (source.url) {
            allSources.add(source.url);
          }
        });
      }
    });
    article.sources = Array.from(allSources);

    // In kết quả
    console.log('\n' + '='.repeat(80));
    console.log('📄 BÀI BÁO TỔNG HỢP VỀ VBEE AI');
    console.log('='.repeat(80));
    console.log(`\n📌 Tiêu đề: ${article.title}`);
    console.log('\n📊 Thống kê:');
    console.log(`  - Số phần: ${article.sections.length}`);
    console.log(`  - Số hình ảnh: ${article.images.length}`);
    console.log(`  - Số video: ${article.videos.length}`);
    console.log(`  - Số nguồn tham khảo: ${article.sources.length}`);

    console.log('\n' + '-'.repeat(80));
    article.sections.forEach((section) => {
      console.log(`\n## ${section.title}`);
      console.log(section.content.substring(0, 500) + '...');
      if (section.sources && section.sources.length > 0) {
        console.log('\nNguồn tham khảo:');
        section.sources.slice(0, 3).forEach((source: any, i: number) => {
          console.log(`  ${i + 1}. ${source.title || source.url}`);
          console.log(`     ${source.url}`);
        });
      }
    });

    if (article.images.length > 0) {
      console.log('\n' + '-'.repeat(80));
      console.log('\n🖼️ DANH SÁCH HÌNH ẢNH:');
      article.images.forEach((img: any, index: number) => {
        console.log(`\n${index + 1}. ${img.title || 'Hình ảnh về VBee'}`);
        console.log(`   URL: ${img.url}`);
        if (img.thumbnail) {
          console.log(`   Thumbnail: ${img.thumbnail}`);
        }
      });
    }

    if (article.videos.length > 0) {
      console.log('\n' + '-'.repeat(80));
      console.log('\n🎥 DANH SÁCH VIDEO YOUTUBE:');
      article.videos.forEach((video: any, index: number) => {
        console.log(`\n${index + 1}. ${video.title || 'Video về VBee'}`);
        console.log(`   URL: ${video.url}`);
        if (video.thumbnail) {
          console.log(`   Thumbnail: ${video.thumbnail}`);
        }
        if (video.duration) {
          console.log(`   Thời lượng: ${video.duration}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Hoàn thành nghiên cứu về VBee AI!');
    console.log('='.repeat(80));

    // Lưu kết quả vào file
    const outputFile = join(__dirname, 'vbee-research-result.json');
    writeFileSync(outputFile, JSON.stringify(article, null, 2), 'utf-8');
    console.log(`\n💾 Đã lưu kết quả vào: ${outputFile}`);

    console.log('\n✅ Hoàn thành!');
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    if (error.cause) {
      console.error('Chi tiết:', error.cause);
    }
    process.exit(1);
  }
}

runResearch();







