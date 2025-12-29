// netlify/functions/exercisedb-image.js
// Serverless function to proxy RapidAPI ExerciseDB Image requests

const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48';

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    };
  }

  const { queryStringParameters } = event;
  
  // Get query parameters (exerciseId and resolution)
  const exerciseId = queryStringParameters.exerciseId;
  const resolution = queryStringParameters.resolution || '360';
  
  if (!exerciseId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'exerciseId is required' })
    };
  }
  
  const targetUrl = `https://${RAPIDAPI_HOST}/image?exerciseId=${exerciseId}&resolution=${resolution}`;
  
  console.log(`[ExerciseDB Image Proxy] ${event.httpMethod} ${targetUrl}`);

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
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: ''
      };
    }

    // Stream the image response
    const imageBuffer = await response.arrayBuffer();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=2592000, immutable', // 30 days
      },
      body: Buffer.from(imageBuffer).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('[ExerciseDB Image Proxy] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
