// Test endpoint to verify timeout configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(req: Request) {
  const url = new URL(req.url);
  const delay = parseInt(url.searchParams.get('delay') || '40', 10);
  
  console.log(`[TEST-TIMEOUT] Starting ${delay}s delay...`);
  const startTime = Date.now();
  
  // Wait for specified seconds
  await new Promise(resolve => setTimeout(resolve, delay * 1000));
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  return Response.json({
    success: true,
    message: `Completed after ${elapsed} seconds`,
    requestedDelay: delay,
    actualDelay: elapsed,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  return GET(req);
}

