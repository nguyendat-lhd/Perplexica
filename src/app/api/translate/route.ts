import { translateTextsInBatches } from '@/lib/translator';
import { NextRequest } from 'next/server';

/**
 * API để dịch text lazy load
 * Nhận array text và trả về array translated
 */
export const POST = async (req: NextRequest) => {
  let body: any = {};
  
  try {
    body = await req.json();
    const { texts, targetLang = 'vi' } = body;

    if (!texts || !Array.isArray(texts)) {
      return Response.json(
        { message: 'Invalid request: texts must be an array' },
        { status: 400 },
      );
    }

    if (texts.length === 0) {
      return Response.json({ translations: [] }, { status: 200 });
    }

    // Dịch theo batch nhỏ để tránh rate limit
    const translations = await translateTextsInBatches(texts, 3, targetLang);

    return Response.json(
      {
        translations,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error('Translation API error:', err);
    return Response.json(
      {
        message: 'Translation failed - returning original texts',
        translations: body.texts || [],
      },
      {
        status: 500,
      },
    );
  }
};
