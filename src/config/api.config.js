// src/config/api.config.js
/**
 * Centralized API Configuration
 * 
 * ARCHITECTURE:
 * - Uses relative paths (/api/exercises) instead of absolute URLs
 * - Development: Vite proxy forwards to RapidAPI ExerciseDB
 * - Production: Netlify serverless function handles the proxy
 * 
 * This bypasses CORS because the browser sees same-origin requests.
 */

// ExerciseDB API (RapidAPI) - Proxied through /api/exercises
export const EXERCISEDB_BASE_URL = '/api/exercises';

// HuggingFace API - Proxied through /api/hf
export const HUGGINGFACE_BASE_URL = '/api/hf';

// RapidAPI Configuration (for reference, actual key is in env/serverless function)
export const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';

// API Endpoints for ExerciseDB (RapidAPI version)
export const EXERCISE_ENDPOINTS = {
  exercises: EXERCISEDB_BASE_URL,
  exerciseById: (id) => EXERCISEDB_BASE_URL + '/exercise/' + id,
  bodyPartList: EXERCISEDB_BASE_URL + '/bodyPartList',
  targetList: EXERCISEDB_BASE_URL + '/targetList',
  equipmentList: EXERCISEDB_BASE_URL + '/equipmentList',
  bodyPartExercises: (bodyPart) => EXERCISEDB_BASE_URL + '/bodyPart/' + encodeURIComponent(bodyPart),
  targetExercises: (target) => EXERCISEDB_BASE_URL + '/target/' + encodeURIComponent(target),
  equipmentExercises: (equipment) => EXERCISEDB_BASE_URL + '/equipment/' + encodeURIComponent(equipment),
  searchByName: (name) => EXERCISEDB_BASE_URL + '/name/' + encodeURIComponent(name),
};

// Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

// Cache configuration  
export const CACHE_CONFIG = {
  ttl: 60 * 60 * 1000,
  maxSize: 500,
  persist: true,
  version: 'v5-rapidapi',
};

// Timeout configuration
export const TIMEOUT_CONFIG = {
  default: 15000,
  long: 30000,
};

export default {
  EXERCISEDB_BASE_URL,
  HUGGINGFACE_BASE_URL,
  RAPIDAPI_HOST,
  EXERCISE_ENDPOINTS,
  RETRY_CONFIG,
  CACHE_CONFIG,
  TIMEOUT_CONFIG,
};
