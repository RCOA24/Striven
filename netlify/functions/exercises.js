// netlify/functions/exercises.js
// Serverless function to proxy RapidAPI ExerciseDB requests

const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48';

export const handler = async (event) => {
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

  try {
    // Parse path
    // event.path comes in as /.netlify/functions/exercises (rewritten)
    // or /api/exercises (if raw) - usually rewritten.
    
    let path = event.path;
    
    // We need to map this to the RapidAPI path.
    // If path ends with /exercises, we want /exercises
    // If path ends with /exercises/bodyPartList, we want /exercises/bodyPartList
    
    // Remove the function prefix
    const functionPrefix = '/.netlify/functions/exercises';
    const apiPrefix = '/api/exercises';
    
    let apiPath = '';
    
    if (path.startsWith(functionPrefix)) {
      apiPath = path.substring(functionPrefix.length);
    } else if (path.startsWith(apiPrefix)) {
      apiPath = path.substring(apiPrefix.length);
    }
    
    // If apiPath is empty, it means we are at the root of the resource
    // In dev, /api/exercises mapped to /exercises
    // So we should prepend /exercises
    
    const targetPath = '/exercises' + apiPath;
    
    // Construct query string
    const params = new URLSearchParams(event.queryStringParameters);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const targetUrl = `https://${RAPIDAPI_HOST}${targetPath}${queryString}`;
    
    console.log(`Proxying ${path} to ${targetUrl}`);

    let response, data;
    try {
      response = await fetch(targetUrl, {
        method: event.httpMethod,
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
          'Content-Type': 'application/json',
        },
      });
      data = await response.text();
    } catch (err) {
      console.error('Upstream fetch failed:', err);
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ error: 'Could not reach upstream API', details: err.message })
      };
    }

    // Detect HTML error page
    if (data.trim().startsWith('<')) {
      console.error('Upstream API returned HTML:', data.slice(0, 200));
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ error: 'Upstream API returned HTML (likely a 404, 502, or misconfigured proxy).', details: data.slice(0, 200) })
      };
    }
    // Try to parse as JSON
    let jsonData = null;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      console.error('Upstream API returned invalid JSON:', data.slice(0, 200));
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ error: 'Upstream API returned invalid JSON.', details: data.slice(0, 200) })
      };
    }
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': response.ok ? 'public, max-age=3600' : 'no-cache',
      },
      body: JSON.stringify(jsonData)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

export const config = {
  path: '/api/exercises/*',
};
