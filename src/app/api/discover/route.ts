import { searchSearxng } from '@/lib/searxng';
import { translateTextsInBatches } from '@/lib/translator';

// Cache 30 phút để tránh dịch lại quá nhiều
const CACHE_DURATION = 30 * 60 * 1000;

// Global cache để tránh bị reset khi hot reload
declare global {
  var discoverCache: Map<string, { data: any; timestamp: number }> | undefined;
}

if (!global.discoverCache) {
  global.discoverCache = new Map();
}

const cache = global.discoverCache;

const websitesForTopic = {
  tech: {
    query: ['technology news', 'latest tech', 'AI', 'science and innovation', 'startup', 'innovation'],
    links: ['techcrunch.com', 'wired.com', 'theverge.com', 'arstechnica.com', 'engadget.com'],
  },
  finance: {
    query: ['finance news', 'economy', 'stock market', 'investing', 'business', 'markets'],
    links: ['bloomberg.com', 'cnbc.com', 'marketwatch.com', 'reuters.com', 'ft.com'],
  },
  art: {
    query: ['art news', 'culture', 'modern art', 'cultural events', 'exhibition', 'gallery'],
    links: ['artnews.com', 'hyperallergic.com', 'theartnewspaper.com', 'artforum.com', 'artnet.com'],
  },
  sports: {
    query: ['sports news', 'latest sports', 'cricket football tennis', 'basketball', 'soccer'],
    links: ['espn.com', 'bbc.com/sport', 'skysports.com', 'theguardian.com/sport', 'sports.yahoo.com'],
  },
  entertainment: {
    query: ['entertainment news', 'movies', 'TV shows', 'celebrities', 'cinema', 'television'],
    links: ['hollywoodreporter.com', 'variety.com', 'deadline.com', 'entertainmentweekly.com', 'ew.com'],
  },
};

type Topic = keyof typeof websitesForTopic;

export const GET = async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;

    const mode: 'normal' | 'preview' =
      (params.get('mode') as 'normal' | 'preview') || 'normal';
    const topic: Topic = (params.get('topic') as Topic) || 'tech';

    // Tạo cache key dựa trên mode và topic
    const cacheKey = `${mode}-${topic}`;

    // Kiểm tra cache
    console.log(`🔍 Checking cache for key: ${cacheKey}`);
    console.log(`📦 Current cache size: ${cache.size}`);
    console.log(`🗂️ Cache keys:`, Array.from(cache.keys()));
    
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      console.log(`✅ Cache hit for ${cacheKey} (age: ${cacheAge}s, returning ${cached.data.length} articles)`);
      return Response.json(
        {
          blogs: cached.data,
        },
        {
          status: 200,
        },
      );
    }

    if (cached) {
      const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      console.log(`⏰ Cache expired for ${cacheKey} (age: ${cacheAge}s)`);
    }
    console.log(`🔄 Cache miss for ${cacheKey}, fetching new data...`);

    const selectedTopic = websitesForTopic[topic];

    let data = [];

    if (mode === 'normal') {
      const seenUrls = new Set();

      // Search với tất cả queries để có đủ 100 tin
      // 5 links × 6 queries = 30 searches → có thể được 150+ tin
      data = (
        await Promise.all(
          selectedTopic.links.flatMap((link) =>
            selectedTopic.query.map(async (query) => {
              return (
                await searchSearxng(`site:${link} ${query}`, {
                  engines: ['bing news'],
                  pageno: 1,
                  language: 'en',
                })
              ).results;
            }),
          ),
        )
      )
        .flat()
        .filter((item) => {
          const url = item.url?.toLowerCase().trim();
          if (seenUrls.has(url)) return false;
          seenUrls.add(url);
          return true;
        })
        .sort(() => Math.random() - 0.5);
    } else {
      data = (
        await searchSearxng(
          `site:${selectedTopic.links[Math.floor(Math.random() * selectedTopic.links.length)]} ${selectedTopic.query[Math.floor(Math.random() * selectedTopic.query.length)]}`,
          {
            engines: ['bing news'],
            pageno: 1,
            language: 'en',
          },
        )
      ).results;
    }

    // Lọc các kết quả có thumbnail TRƯỚC KHI dịch để tránh dịch những kết quả không dùng đến
    const dataWithThumbnail = data.filter((item: any) => {
      return item.thumbnail || item.thumbnail_src || item.img_src;
    });

    console.log(`📊 Tổng kết quả: ${data.length}, có thumbnail: ${dataWithThumbnail.length}`);

    // Tối ưu khác nhau cho mode normal và preview
    let limitedData;
    let shouldTranslateContent = false;
    
    if (mode === 'preview') {
      // Preview mode: chỉ cần ít tin (widget chỉ cần 1), nhưng cần dịch cả content
      limitedData = dataWithThumbnail.slice(0, 5); // Chỉ lấy 5 tin
      shouldTranslateContent = true; // Widget hiển thị content nên cần dịch
    } else {
      // Normal mode: nhiều tin hơn, dịch cả title và content
      limitedData = dataWithThumbnail.slice(0, 100); // Tăng lên 100 kết quả để đủ cho infinite scroll
      shouldTranslateContent = true; // Trang khám phá cũng hiển thị content
    }

    // Dịch sang tiếng Việt với delay lớn hơn để tránh rate limit
    if (limitedData.length > 0) {
      try {
        console.log(`🌐 Đang dịch ${limitedData.length} tin tức (mode: ${mode})...`);

        // Dịch theo mode
        const textsToTranslate: string[] = [];
        limitedData.forEach((item: any) => {
          if (item.title) textsToTranslate.push(item.title);
          if (shouldTranslateContent && item.content) {
            textsToTranslate.push(item.content);
          }
        });

        if (textsToTranslate.length > 0) {
          // Dịch theo batch với delay phù hợp
          // Normal mode: batch lớn hơn để dịch nhanh hơn với nhiều tin, Preview mode: batch nhỏ hơn
          const batchSize = mode === 'preview' ? 2 : 5;
          const translations = await translateTextsInBatches(
            textsToTranslate,
            batchSize,
            'vi',
          );

          // Gán lại giá trị đã dịch vào data
          let translationIndex = 0;
          data = limitedData.map((item: any) => {
            const translatedItem = { ...item };
            if (item.title) {
              translatedItem.title = translations[translationIndex];
              translationIndex++;
            }
            if (shouldTranslateContent && item.content) {
              translatedItem.content = translations[translationIndex];
              translationIndex++;
            }
            return translatedItem;
          });

          console.log(`✅ Dịch xong ${textsToTranslate.length} đoạn văn bản`);
        }
      } catch (err) {
        console.error('Error translating content:', err);
        // Nếu có lỗi trong quá trình dịch, vẫn trả về data gốc
        data = limitedData;
      }
    } else {
      data = [];
    }

    // Lưu vào cache kết quả đã dịch
    cache.set(cacheKey, { data, timestamp: Date.now() });
    console.log(`💾 Cached ${data.length} articles for ${cacheKey}`);

    return Response.json(
      {
        blogs: data,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(`An error occurred in discover route: ${err}`);
    return Response.json(
      {
        message: 'An error has occurred',
      },
      {
        status: 500,
      },
    );
  }
};
