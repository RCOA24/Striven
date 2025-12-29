// netlify/functions/exercisedb-image.js
// Serverless function to proxy RapidAPI ExerciseDB Image requests

const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48';

export default async (request, context) => {
  const url = new URL(request.url);
  
  // Get query parameters (exerciseId and resolution)
  const exerciseId = url.searchParams.get('exerciseId');
  const resolution = url.searchParams.get('resolution') || '360';
  
  if (!exerciseId) {
    return new Response(JSON.stringify({ error: 'exerciseId is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  const targetUrl = `https://${RAPIDAPI_HOST}/image?exerciseId=${exerciseId}&resolution=${resolution}`;
  
  console.log(`[ExerciseDB Image Proxy] ${request.method} ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      console.error(`[ExerciseDB Image Proxy] Error: ${response.status}`);
      return new Response(null, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Stream the image response
    const imageBuffer = await response.arrayBuffer();
    
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        // Cache images for 30 days (Crucial for free tier limits)
        'Cache-Control': 'public, max-age=2592000, immutable',
      },
    });
  } catch (error) {
    console.error('[ExerciseDB Image Proxy] Error:', error);
    return new Response(null, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

export const config = {
  path: '/api/exercisedb-image',
};
