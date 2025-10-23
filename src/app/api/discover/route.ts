import { searchSearxng } from '@/lib/searxng';
import { translateTextsInBatches } from '@/lib/translator';

const websitesForTopic = {
  tech: {
    query: ['technology news', 'latest tech', 'AI', 'science and innovation'],
    links: ['techcrunch.com', 'wired.com', 'theverge.com'],
  },
  finance: {
    query: ['finance news', 'economy', 'stock market', 'investing'],
    links: ['bloomberg.com', 'cnbc.com', 'marketwatch.com'],
  },
  art: {
    query: ['art news', 'culture', 'modern art', 'cultural events'],
    links: ['artnews.com', 'hyperallergic.com', 'theartnewspaper.com'],
  },
  sports: {
    query: ['sports news', 'latest sports', 'cricket football tennis'],
    links: ['espn.com', 'bbc.com/sport', 'skysports.com'],
  },
  entertainment: {
    query: ['entertainment news', 'movies', 'TV shows', 'celebrities'],
    links: ['hollywoodreporter.com', 'variety.com', 'deadline.com'],
  },
};

type Topic = keyof typeof websitesForTopic;

// Cache 5 phút (300000ms)
const CACHE_DURATION = 5 * 60 * 1000;
const cache: Map<string, { data: any; timestamp: number }> = new Map();

export const GET = async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;

    const mode: 'normal' | 'preview' =
      (params.get('mode') as 'normal' | 'preview') || 'normal';
    const topic: Topic = (params.get('topic') as Topic) || 'tech';

    // Tạo cache key dựa trên mode và topic
    const cacheKey = `${mode}-${topic}`;

    // Kiểm tra cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      return Response.json(
        {
          blogs: cached.data,
        },
        {
          status: 200,
        },
      );
    }

    console.log(`🔄 Cache miss, fetching new data for ${cacheKey}`);

    const selectedTopic = websitesForTopic[topic];

    let data = [];

    if (mode === 'normal') {
      const seenUrls = new Set();

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

    // Dịch sang tiếng Việt với delay lớn hơn để tránh rate limit
    if (data.length > 0) {
      try {
        console.log(`🌐 Đang dịch ${data.length} tin tức sang tiếng Việt...`);

        // Tạo mảng chứa tất cả text cần dịch (title và content)
        const textsToTranslate: string[] = [];
        data.forEach((item: any) => {
          if (item.title) textsToTranslate.push(item.title);
          if (item.content) textsToTranslate.push(item.content);
        });

        if (textsToTranslate.length > 0) {
          // Dịch theo batch nhỏ (2 text mỗi batch) với delay lớn hơn
          const translations = await translateTextsInBatches(
            textsToTranslate,
            2, // Giảm batch size xuống 2
            'vi',
          );

          // Gán lại giá trị đã dịch vào data
          let translationIndex = 0;
          data = data.map((item: any) => {
            const translatedItem = { ...item };
            if (item.title) {
              translatedItem.title = translations[translationIndex];
              translationIndex++;
            }
            if (item.content) {
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
      }
    }

    // Lưu vào cache kết quả đã dịch
    cache.set(cacheKey, { data, timestamp: Date.now() });

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
