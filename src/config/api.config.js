// src/config/api.config.js

/**
 * Centralized API Configuration
 * 
 * This file manages API base URLs using environment variables.
 * 
 * PRODUCTION (Netlify):
 * - Uses relative path '/api' which triggers Netlify proxy
 * - Proxy forwards to https://exercisedb-api.vercel.app/api
 * - This bypasses CORS since requests appear to come from same origin
 * 
 * LOCAL DEVELOPMENT:
 * - Can use '/api' if you set up a local proxy (e.g., Vite proxy)
 * - Or use direct URL 'https://exercisedb-api.vercel.app/api' if API has CORS configured
 * 
 * Environment Variable: VITE_API_BASE_URL
 */

export const API_CONFIG = {
  // Base URL for ExerciseDB API
  // Defaults to '/api' which works with Netlify proxy in production
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // API version
  version: 'v1',
  
  // Full base URL with version
  get fullBaseURL() {
    return `${this.baseURL}/${this.version}`;
  },
  
  // Timeout configuration
  timeout: 10000,
  
  // Retry configuration
  retry: {
    maxAttempts: 2,
    initialDelay: 1000,
    backoffMultiplier: 2
  },
  
  // Cache configuration
  cache: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 200,
    persist: true
  }
};

/**
 * Get the API base URL
 * @returns {string} The base URL for API requests
 */
export const getApiBaseUrl = () => API_CONFIG.fullBaseURL;

/**
 * Build a full API URL
 * @param {string} endpoint - The endpoint path (e.g., '/exercises')
 * @returns {string} The full URL
 */
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.fullBaseURL}${cleanEndpoint}`;
};

export default API_CONFIG;
