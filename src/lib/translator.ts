/**
 * Multiple translation providers
 * Fallback chain: Google Translate > MyMemory > No translation
 */

interface TranslationResult {
  translatedText: string;
  originalText: string;
}

/**
 * Google Translate (proxy miễn phí, không cần API key)
 */
async function translateGoogle(
  text: string,
  targetLang: string = 'vi',
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    // Sử dụng proxy miễn phí không cần API key
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }

    return text;
  } catch (error) {
    console.error('Google Translate error:', error);
    return text;
  }
}

/**
 * MyMemory Translation API (backup)
 */
async function translateMyMemory(
  text: string,
  targetLang: string = 'vi',
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    const encodedText = encodeURIComponent(text.substring(0, 500));
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('MyMemory API error:', response.statusText);
      return text;
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    return text;
  } catch (error) {
    console.error('MyMemory error:', error);
    return text;
  }
}

/**
 * Main translation function with fallback
 */
async function translateSingle(
  text: string,
  targetLang: string = 'vi',
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Thử Google Translate trước
  try {
    const result = await translateGoogle(text, targetLang);
    if (result && result !== text) {
      return result;
    }
  } catch (error) {
    console.warn('Google Translate failed, trying MyMemory...');
  }

  // Fallback sang MyMemory
  try {
    const result = await translateMyMemory(text, targetLang);
    return result;
  } catch (error) {
    console.error('All translation methods failed');
    return text;
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
    await new Promise((resolve) => setTimeout(resolve, 200));
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

    // Dịch tuần tự với delay ngắn hơn vì Google Translate ổn định hơn
    const batchResults: string[] = [];
    for (const text of batch) {
      const translated = await translateSingle(text, targetLang);
      batchResults.push(translated);
      // Delay ngắn hơn vì Google Translate tốt hơn
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    results.push(...batchResults);

    // Delay giữa các batch
    if (i + batchSize < texts.length) {
      console.log(`⏳ Đang đợi trước khi dịch batch tiếp theo...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results;
}
