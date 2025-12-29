// netlify/functions/exercises.js
// Serverless function to proxy RapidAPI ExerciseDB requests

const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48';

export default async (request, context) => {
  // Get the path after /api/exercises
  const url = new URL(request.url);
  
  // Robust path handling:
  // 1. If URL is /api/exercises/foo -> /exercises/foo
  // 2. If URL is /.netlify/functions/exercises/foo -> /exercises/foo
  // 3. If URL is just /api/exercises -> /exercises
  let path = url.pathname;
  
  if (path.startsWith('/api/exercises')) {
    path = path.replace('/api/exercises', '/exercises');
  } else if (path.includes('/.netlify/functions/exercises')) {
    path = path.replace('/.netlify/functions/exercises', '/exercises');
  }
  
  // Ensure path starts with /exercises
  if (!path.startsWith('/exercises')) {
    // If replacement failed or path is weird, try to extract from end
    // This is a fallback for safety
    if (path === '/' || path === '') {
      path = '/exercises';
    } else {
      // Assume the path is already relative to root if it doesn't match known prefixes
      // But we need to be careful. Let's just default to /exercises if we're unsure
      // or append it if it looks like a subpath.
      // For now, let's trust the replace logic above covers 99% of cases.
      if (!path.startsWith('/')) path = '/' + path;
    }
  }

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
