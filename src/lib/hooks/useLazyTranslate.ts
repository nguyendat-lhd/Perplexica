import { useState, useEffect, useRef } from 'react';

interface TranslationCache {
  [key: string]: {
    text: string;
    timestamp: number;
  };
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 giờ

// Lấy cache từ localStorage
const getCache = (): TranslationCache => {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem('translation-cache');
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

// Lưu cache vào localStorage
const saveCache = (cache: TranslationCache) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('translation-cache', JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to save translation cache:', e);
  }
};

// Tạo key từ text
const createKey = (text: string): string => {
  return `trans_${text.substring(0, 50)}`;
};

/**
 * Hook để lazy load translation
 * @param text - Text cần dịch
 * @param enabled - Có bật translation không
 * @returns Translated text hoặc original text nếu chưa dịch
 */
export const useLazyTranslate = (
  text: string,
  enabled: boolean = true,
): string => {
  const [translated, setTranslated] = useState<string>(text);
  const [isTranslating, setIsTranslating] = useState(false);
  const hasTranslated = useRef<string>('');

  useEffect(() => {
    // Reset nếu text thay đổi
    if (hasTranslated.current !== text) {
      hasTranslated.current = '';
    }

    if (!enabled || !text || hasTranslated.current === text) return;

    // Kiểm tra cache
    const cache = getCache();
    const key = createKey(text);
    const cached = cache[key];

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📚 Cache hit for translation:', text.substring(0, 30));
      setTranslated(cached.text);
      hasTranslated.current = text;
      return;
    }

    // Delay ngắn để lazy load
    const timer = setTimeout(async () => {
      if (hasTranslated.current === text) return;

      console.log('🌐 Translating:', text.substring(0, 30));
      setIsTranslating(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: [text],
            targetLang: 'vi',
          }),
        });

        const data = await response.json();

        if (data.translations && data.translations.length > 0) {
          const translatedText = data.translations[0];
          console.log('✅ Translated:', translatedText.substring(0, 30));
          setTranslated(translatedText);

          // Lưu vào cache
          const updatedCache = { ...getCache() };
          updatedCache[key] = {
            text: translatedText,
            timestamp: Date.now(),
          };
          saveCache(updatedCache);
        }
      } catch (error) {
        console.error('Translation error:', error);
        // Giữ nguyên text gốc
      } finally {
        setIsTranslating(false);
        hasTranslated.current = text;
      }
    }, 100); // Delay ngắn hơn: 100ms

    return () => clearTimeout(timer);
  }, [text, enabled]);

  return translated;
};

/**
 * Hook để translate multiple texts cùng lúc
 */
export const useBatchTranslate = (
  texts: string[],
  enabled: boolean = true,
): string[] => {
  const [translated, setTranslated] = useState<string[]>(texts);
  const [isTranslating, setIsTranslating] = useState(false);
  const hasTranslated = useRef(false);

  useEffect(() => {
    if (!enabled || texts.length === 0 || hasTranslated.current) return;

    // Kiểm tra cache cho tất cả texts
    const cache = getCache();
    const uncachedTexts: { index: number; text: string }[] = [];
    const results: string[] = [];

    texts.forEach((text, index) => {
      const key = createKey(text);
      const cached = cache[key];

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        results[index] = cached.text;
      } else {
        results[index] = text; // Placeholder
        uncachedTexts.push({ index, text });
      }
    });

    // Nếu tất cả đã được cache
    if (uncachedTexts.length === 0) {
      setTranslated(results);
      hasTranslated.current = true;
      return;
    }

    // Delay để lazy load
    const timer = setTimeout(async () => {
      if (hasTranslated.current) return;

      setIsTranslating(true);
      try {
        const textsToTranslate = uncachedTexts.map((item) => item.text);
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: textsToTranslate,
            targetLang: 'vi',
          }),
        });

        const data = await response.json();

        if (data.translations && data.translations.length > 0) {
          const finalResults = [...results];
          const updatedCache = { ...getCache() };

          uncachedTexts.forEach((item, i) => {
            const translatedText = data.translations[i];
            finalResults[item.index] = translatedText;

            // Lưu vào cache
            const key = createKey(item.text);
            updatedCache[key] = {
              text: translatedText,
              timestamp: Date.now(),
            };
          });

          setTranslated(finalResults);
          saveCache(updatedCache);
        }
      } catch (error) {
        console.error('Batch translation error:', error);
        // Giữ nguyên texts gốc
      } finally {
        setIsTranslating(false);
        hasTranslated.current = true;
      }
    }, 500); // Delay 500ms

    return () => clearTimeout(timer);
  }, [texts.join('|'), enabled]);

  return translated;
};

