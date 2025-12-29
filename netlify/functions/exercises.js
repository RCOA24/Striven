// netlify/functions/exercises.js
// Serverless function to proxy RapidAPI ExerciseDB requests

const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48';

export default async (request, context) => {
  // Get the path after /api/exercises
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/exercises', '/exercises');
  const queryString = url.search;
  
  const targetUrl = `https://${RAPIDAPI_HOST}${path}${queryString}`;
  
  console.log(`[ExerciseDB Proxy] ${request.method} ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Cache successful responses for 1 hour
        'Cache-Control': response.ok ? 'public, max-age=3600' : 'no-cache',
      },
    });
  } catch (error) {
    console.error('[ExerciseDB Proxy] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

export const config = {
  path: '/api/exercises/*',
};
