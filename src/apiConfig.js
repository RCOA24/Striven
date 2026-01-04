import { Capacitor } from '@capacitor/core';

/**
 * Helper to get the base URL for API calls.
 * 
 * - Native (Android/iOS): Returns the production Netlify URL.
 * - Web (Browser): Returns an empty string to use relative paths (proxies).
 */
export const getBackendUrl = () => {
  if (Capacitor.isNativePlatform()) {
    // TODO: Replace with your actual Netlify site URL
    return 'https://striven.netlify.app/';
  }
  return '';
};
