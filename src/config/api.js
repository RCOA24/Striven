import { Capacitor } from '@capacitor/core';

// TODO: Replace 'https://YOUR_NETLIFY_SITE_NAME.netlify.app' with your actual Netlify site URL
// Example: const PRODUCTION_URL = 'https://striven-fitness.netlify.app';
const PRODUCTION_URL = 'https://striven.netlify.app/';

/**
 * Helper to construct API URLs based on the platform.
 * 
 * - Native (Android/iOS): Returns absolute URL pointing to production Netlify Functions.
 * - Web: Returns relative URL to allow local development proxies to work.
 * 
 * @param {string} endpoint - The relative path (e.g., '/.netlify/functions/analyze-food')
 * @returns {string} - The full or relative URL to fetch
 */
export const getApiUrl = (endpoint) => {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (Capacitor.isNativePlatform()) {
    // Remove double slashes if present in concatenation
    const baseUrl = PRODUCTION_URL.replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }
  
  // For web/development, use relative path
  return path;
};
