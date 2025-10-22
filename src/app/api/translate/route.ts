import { translateTextsInBatches } from '@/lib/translator';

export const POST = async (req: Request) => {
  try {
    const { texts, targetLanguage = 'vi' } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return Response.json(
        { message: 'Texts array is required' },
        { status: 400 },
      );
    }

    // Dịch sử dụng MyMemory Translation API
    const translations = await translateTextsInBatches(texts, 5, targetLanguage);

    return Response.json(
      {
        translations,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(`An error occurred in translate route: ${err}`);
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

