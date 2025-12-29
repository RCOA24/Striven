// src/api/exercises.js

/**
 * ExerciseDB API Client (RapidAPI Version)
 * Uses RapidAPI ExerciseDB for higher rate limits
 * Architecture: Uses relative /api paths - proxied via Vite (dev) or Netlify serverless (prod)
 */

// ✅ RELATIVE PATH - Proxied to RapidAPI ExerciseDB
const API_BASE = '/api/exercises';

// ✅ DEFINE YOUR FALLBACK HERE (Ensure this file exists in your 'public' folder)
const FALLBACK_GIF = '/fallback-exercise.gif';

// ✅ USER FRIENDLY ERROR MESSAGE
export const FREE_TIER_MSG = "The free tier usage limit for the exercise database has been reached. This is a limitation of the free plan. Access will reset soon.";

/**
 * ✅ CRITICAL FIX: Robust URL Cleaner
 * 1. Prevents double-encoding (decodes first)
 * 2. Encodes spaces to %20
 * 3. Manually encodes parentheses '(' and ')' which breaks static file servers
 */
const cleanUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  let cleaned = url.trim();

  // 1. Filter out bad data
  if (cleaned.length < 5 || cleaned === 'null' || cleaned === 'undefined') return null;

  // 2. Ensure HTTPS (Fixes mixed content errors)
  if (cleaned.startsWith('http://')) {
    cleaned = cleaned.replace('http://', 'https://');
  } else if (cleaned.startsWith('//')) {
    cleaned = `https:${cleaned}`;
  }

  try {
    // 3. Decode first to prevent double encoding (e.g. %20 -> %2520)
    cleaned = decodeURIComponent(cleaned);

    // 4. Encode URI (Handles spaces, standard special chars)
    cleaned = encodeURI(cleaned);

    // 5. ✅ MANUAL FIX: Encode Parentheses (encodeURI skips these, but servers hate them)
    cleaned = cleaned.replace(/\(/g, '%28').replace(/\)/g, '%29');

    return cleaned;
  } catch (e) {
    console.warn('URL cleaning failed:', e);
    return cleaned;
  }
};

// Configuration
const CONFIG = {
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2
  },
  timeout: {
    default: 15000,
  },
  cache: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days cache (Aggressive caching for free tier)
    maxSize: 500,
    persist: true 
  },
  rateLimit: {
    minInterval: 100, // RapidAPI has better rate limits
  }
};

const CACHE_VERSION = 'v6-rapidapi'; // Bumped to invalidate old cache with bad image URLs
const PERSISTED_KEY = `exercisedb_cache_${CACHE_VERSION}`;

// State management
class ApiState {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    if (CONFIG.cache.persist) this.loadPersistedCache();
  }

  loadPersistedCache() {
    try {
      const raw = localStorage.getItem(PERSISTED_KEY);
      if (!raw) return;
      const { data, timestamps } = JSON.parse(raw);
      const now = Date.now();
      for (const [key, value] of Object.entries(data)) {
        const ts = timestamps[key];
        if (ts && now - ts < CONFIG.cache.ttl) {
          this.cache.set(key, value);
          this.cacheTimestamps.set(key, ts);
        }
      }
      console.log(`Loaded ${this.cache.size} cached items`);
    } catch (e) {
      console.warn('Cache load failed:', e);
    }
  }

  persistCache() {
    if (!CONFIG.cache.persist) return;
    try {
      const data = Object.fromEntries(this.cache);
      const timestamps = Object.fromEntries(this.cacheTimestamps);
      localStorage.setItem(PERSISTED_KEY, JSON.stringify({ data, timestamps }));
    } catch (e) {
      if (e.name === 'QuotaExceededError') this.cache.clear();
    }
  }

  setCache(key, value) {
    if (this.cache.size >= CONFIG.cache.maxSize) {
      const first = this.cache.keys().next().value;
      this.cache.delete(first);
      this.cacheTimestamps.delete(first);
    }
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
    this.persistCache();
  }

  getCache(key) {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp || Date.now() - timestamp > CONFIG.cache.ttl) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }
  
  clearPersistedCache() {
    localStorage.removeItem(PERSISTED_KEY);
    this.cache.clear();
    this.cacheTimestamps.clear();
    console.log('Cache cleared');
  }
}

const apiState = new ApiState();
const buildUrl = (endpoint) => `${API_BASE}${endpoint}`;

const fetchWithTimeout = async (url, options = {}, timeout = CONFIG.timeout.default) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// ✅ RATE LIMIT BOTTLENECK
let lastRequestTime = 0;

const throttleRequest = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < CONFIG.rateLimit.minInterval) {
    await new Promise(r => setTimeout(r, CONFIG.rateLimit.minInterval - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

// ✅ ENHANCED RETRY with error handling
const fetchWithRetry = async (url, options = {}, attempt = 0) => {
  await throttleRequest();
  
  try {
    const res = await fetchWithTimeout(url, options);
    
    // Handle rate limiting (429)
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * Math.pow(2, attempt);
      console.warn(`Rate limited (429). Waiting ${delay}ms. Retry ${attempt + 1}/${CONFIG.retry.maxAttempts}`);
      
      if (attempt >= CONFIG.retry.maxAttempts - 1) {
        throw new Error(FREE_TIER_MSG);
      }
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, attempt + 1);
    }
    
    // Handle forbidden (403)
    if (res.status === 403) {
      throw new Error(FREE_TIER_MSG);
    }
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Request timed out');
    if (error.message.includes('forbidden') || error.message.includes('Rate limited')) throw error;
    
    if (attempt >= CONFIG.retry.maxAttempts - 1) throw error;
    const delay = CONFIG.retry.initialDelay * Math.pow(CONFIG.retry.backoffMultiplier, attempt);
    console.warn(`Retry ${attempt + 1}/${CONFIG.retry.maxAttempts} after ${delay}ms:`, error.message);
    await new Promise(r => setTimeout(r, delay));
    return fetchWithRetry(url, options, attempt + 1);
  }
};

const getCacheKey = (prefix, params) => `${prefix}:${JSON.stringify(params)}`;

/**
 * ✅ Build GIF URL for RapidAPI ExerciseDB
 * The image endpoint requires: exerciseId, resolution, and API key
 * Format: /api/exercisedb-image?exerciseId={id}&resolution={res}
 * (proxied through Vite/Netlify which adds the API key)
 */
const buildGifUrl = (exerciseId) => {
  if (!exerciseId) return FALLBACK_GIF;
  // Use 360 resolution (available on PRO plan, falls back to 180 on BASIC)
  return `/api/exercisedb-image?exerciseId=${exerciseId}&resolution=360`;
};

/**
 * ✅ Transform RapidAPI exercise data to our app's format
 */
const transformExercise = (ex) => {
  // Build GIF URL using the image endpoint
  const gifUrl = buildGifUrl(ex.id);
  const previewImage = gifUrl || FALLBACK_GIF;

  return {
    id: ex.id,
    exerciseId: ex.id,
    name: ex.name || 'Unknown Exercise',
    description: ex.instructions?.join(' ') || 'No instructions available.',
    category: ex.bodyPart || 'General',
    bodyPart: ex.bodyPart,
    muscles: ex.target || 'Multiple',
    target: ex.target,
    musclesSecondary: ex.secondaryMuscles?.join(', ') || null,
    secondaryMuscles: ex.secondaryMuscles || [],
    equipment: ex.equipment || 'Bodyweight',
    previewImage: previewImage,
    gifUrl: gifUrl,
    images: [{ image: previewImage }],
    instructions: ex.instructions || [],
    hasVideo: false,
    videos: []
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PUBLIC API FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch exercises with pagination and filters
 * RapidAPI Endpoints:
 * - /exercises?limit=X&offset=Y (all exercises)
 * - /exercises/bodyPart/{bodyPart}?limit=X&offset=Y
 * - /exercises/target/{target}?limit=X&offset=Y
 * - /exercises/equipment/{equipment}?limit=X&offset=Y
 * - /exercises/name/{name}?limit=X&offset=Y (search)
 */
export const fetchExercises = async (page = 0, options = {}) => {
  const {
    bodyPart = null,
    search = '',
    muscles = null,
    equipment = null,
    limit = 10,
    useCache = true
  } = options;

  const offset = page * limit;
  const cacheKey = getCacheKey('exercises', { page, bodyPart, search, muscles, equipment, limit });

  if (useCache) {
    const cached = apiState.getCache(cacheKey);
    if (cached) {
      console.log('✅ Cache hit:', cacheKey);
      return cached;
    }
  }

  try {
    let endpoint;
    
    // Determine endpoint based on filters
    if (search && search.trim()) {
      // Search by name
      endpoint = `/name/${encodeURIComponent(search.trim().toLowerCase())}`;
    } else if (bodyPart && bodyPart !== 'All') {
      // Filter by body part
      endpoint = `/bodyPart/${encodeURIComponent(bodyPart.toLowerCase())}`;
    } else if (muscles) {
      // Filter by target muscle
      endpoint = `/target/${encodeURIComponent(muscles.toLowerCase())}`;
    } else if (equipment) {
      // Filter by equipment
      endpoint = `/equipment/${encodeURIComponent(equipment.toLowerCase())}`;
    } else {
      // All exercises
      endpoint = '';
    }

    const url = buildUrl(`${endpoint}?limit=${limit}&offset=${offset}`);
    console.log(`📡 Fetching: ${url}`);

    const res = await fetchWithRetry(url);
    const data = await res.json();
    
    // RapidAPI returns array directly, not wrapped in { data: [] }
    const allExercises = Array.isArray(data) ? data : (data.data || []);

    const result = {
      exercises: allExercises.map(transformExercise),
      hasMore: allExercises.length === limit,
      total: 1300, // RapidAPI doesn't return total, estimate
      cached: false
    };

    apiState.setCache(cacheKey, { ...result, cached: true });
    return result;

  } catch (error) {
    console.error('❌ API Error:', error);
    return { 
      exercises: [], 
      hasMore: false, 
      error: error.message || 'Failed to load exercises',
      retryable: true 
    };
  }
};

/**
 * Fetch single exercise details by ID
 * RapidAPI Endpoint: /exercises/exercise/{id}
 */
export const fetchExerciseDetails = async (id, useCache = true) => {
  const cacheKey = `exercise:${id}`;
  
  if (useCache) {
    const cached = apiState.getCache(cacheKey);
    if (cached) {
      console.log('✅ Cache hit:', cacheKey);
      return cached;
    }
  }

  try {
    const url = buildUrl(`/exercise/${id}`);
    console.log(`📡 Fetching details: ${url}`);
    
    const res = await fetchWithRetry(url);
    const ex = await res.json();

    const details = transformExercise(ex);
    apiState.setCache(cacheKey, details);
    return details;

  } catch (err) {
    console.error('❌ Details Error:', err);
    return null;
  }
};

/**
 * Get body part categories
 * RapidAPI Endpoint: /exercises/bodyPartList
 */
export const getCategories = async () => {
  const cacheKey = 'bodyparts';
  const cached = apiState.getCache(cacheKey);
  if (cached) return cached;
  
  try {
    const url = buildUrl('/bodyPartList');
    console.log(`📡 Fetching categories: ${url}`);
    
    const res = await fetchWithRetry(url);
    const data = await res.json();
    
    // RapidAPI returns array of strings directly
    const bodyParts = Array.isArray(data) ? data : [];
    const cats = ['All', ...bodyParts];
    
    apiState.setCache(cacheKey, cats);
    return cats;
  } catch (e) {
    console.error('❌ Categories Error:', e);
    // Fallback categories
    return ['All', 'back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'];
  }
};

/**
 * Get target muscles list
 * RapidAPI Endpoint: /exercises/targetList
 */
export const getTargetMuscles = async () => {
  const cacheKey = 'targets';
  const cached = apiState.getCache(cacheKey);
  if (cached) return cached;
  
  try {
    const url = buildUrl('/targetList');
    const res = await fetchWithRetry(url);
    const data = await res.json();
    
    const targets = Array.isArray(data) ? data : [];
    apiState.setCache(cacheKey, targets);
    return targets;
  } catch (e) {
    console.error('❌ Targets Error:', e);
    return [];
  }
};

/**
 * Get equipment list
 * RapidAPI Endpoint: /exercises/equipmentList
 */
export const getEquipmentList = async () => {
  const cacheKey = 'equipment';
  const cached = apiState.getCache(cacheKey);
  if (cached) return cached;
  
  try {
    const url = buildUrl('/equipmentList');
    const res = await fetchWithRetry(url);
    const data = await res.json();
    
    const equipment = Array.isArray(data) ? data : [];
    apiState.setCache(cacheKey, equipment);
    return equipment;
  } catch (e) {
    console.error('❌ Equipment Error:', e);
    return [];
  }
};

export const clearCache = () => apiState.clearPersistedCache();
export { CONFIG, apiState };