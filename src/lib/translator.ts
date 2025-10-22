/**
 * Dịch văn bản sang tiếng Việt sử dụng MyMemory Translation API
 * API miễn phí, không cần key, giới hạn 500 requests/day
 */

interface TranslationResult {
  translatedText: string;
  originalText: string;
}

/**
 * Dịch một văn bản đơn
 */
async function translateSingle(
  text: string,
  targetLang: string = 'vi',
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    // Encode text để tránh lỗi URL
    const encodedText = encodeURIComponent(text.substring(0, 500)); // MyMemory giới hạn 500 ký tự

    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Translation API error:', response.statusText);
      return text; // Trả về text gốc nếu có lỗi
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Trả về text gốc nếu có lỗi
  }
}

/**
 * Dịch nhiều văn bản cùng lúc (batch)
 * Dịch tuần tự để tránh rate limit
 */
export async function translateTexts(
  texts: string[],
  targetLang: string = 'vi',
): Promise<string[]> {
  const results: string[] = [];

  for (const text of texts) {
    const translated = await translateSingle(text, targetLang);
    results.push(translated);

    // Delay nhỏ giữa các request để tránh rate limit
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Dịch với batch nhỏ hơn để tối ưu
 */
export async function translateTextsInBatches(
  texts: string[],
  batchSize: number = 5,
  targetLang: string = 'vi',
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => translateSingle(text, targetLang)),
    );
    results.push(...batchResults);

    // Delay giữa các batch
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

