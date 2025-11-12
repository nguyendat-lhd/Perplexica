import { searchSearxng } from '@/lib/searxng';

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

export const GET = async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;

    const mode: 'normal' | 'preview' =
      (params.get('mode') as 'normal' | 'preview') || 'normal';
    const topic: Topic = (params.get('topic') as Topic) || 'tech';

    const selectedTopic = websitesForTopic[topic];

    let data: any[] = [];

    if (mode === 'normal') {
      const seenUrls = new Set();

      const searchPromises = selectedTopic.links.flatMap((link) =>
        selectedTopic.query.map(async (query) => {
          try {
            const result = await searchSearxng(`site:${link} ${query}`, {
              engines: ['bing news'],
              pageno: 1,
              language: 'en',
            });
            return result.results || [];
          } catch (error) {
            console.error(`Error searching for ${query} on ${link}:`, error);
            return [];
          }
        }),
      );

      data = (await Promise.allSettled(searchPromises))
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        .filter((item) => {
          const url = item?.url?.toLowerCase().trim();
          if (!url || seenUrls.has(url)) return false;
          seenUrls.add(url);
          return true;
        })
        .sort(() => Math.random() - 0.5);
    } else {
      try {
        const result = await searchSearxng(
          `site:${selectedTopic.links[Math.floor(Math.random() * selectedTopic.links.length)]} ${selectedTopic.query[Math.floor(Math.random() * selectedTopic.query.length)]}`,
          {
            engines: ['bing news'],
            pageno: 1,
            language: 'en',
          },
        );
        data = result.results || [];
      } catch (error: any) {
        console.error('Error in preview mode:', error);
        // Log more details about the error
        if (error.response) {
          console.error(`SearXNG error status: ${error.response.status}, message: ${error.message}`);
        }
        // Return empty array instead of crashing
        data = [];
      }
    }

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
