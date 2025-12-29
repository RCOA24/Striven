// src/api/exercises.js

/**
 * ExerciseDB API Client
 * Fixes: Broken GIFs with special characters (parentheses, spaces), Retry logic, Caching
 * Uses centralized API configuration with environment variables
 */

import { getApiBaseUrl } from '../config/api.config.js';

const API_BASE = getApiBaseUrl();

// ✅ DEFINE YOUR FALLBACK HERE (Ensure this file exists in your 'public' folder)
const FALLBACK_GIF = '/fallback-exercise.gif';

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
    // Fixes: "assisted standing triceps extension (with towel)..."
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
    maxAttempts: 2, // Reduced to prevent UI hanging on bad links
    initialDelay: 1000,
    backoffMultiplier: 2
  },
  timeout: {
    default: 10000,
  },
  cache: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 200,
    persist: true 
  }
};

const CACHE_VERSION = 'v4'; // Bumped version for new encoding logic
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
    } catch (e) {}
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

const fetchWithRetry = async (url, options = {}, attempt = 0) => {
  try {
    const res = await fetchWithTimeout(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (error) {
    if (attempt >= CONFIG.retry.maxAttempts - 1) throw error;
    const delay = CONFIG.retry.initialDelay * Math.pow(CONFIG.retry.backoffMultiplier, attempt);
    await new Promise(r => setTimeout(r, delay));
    return fetchWithRetry(url, options, attempt + 1);
  }
};

const parseApiResponse = async (res) => {
  const json = await res.json();
  if (!json.success && json.message) throw new Error(json.message);
  return json;
};

const getCacheKey = (prefix, params) => `${prefix}:${JSON.stringify(params)}`;

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PUBLIC API FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const fetchExercises = async (page = 0, options = {}) => {
  const {
    bodyPart = null,
    search = '',
    muscles = null,
    equipment = null,
    limit = 10,
    sortBy = 'name',
    sortOrder = 'asc',
    useCache = true
  } = options;

  const cacheKey = getCacheKey('exercises', { page, bodyPart, search, muscles, equipment, limit, sortBy, sortOrder });

  if (useCache) {
    const cached = apiState.getCache(cacheKey);
    if (cached) return cached;
  }

  try {
    // 1. Construct Endpoint
    let endpoint = '/exercises';
    if (search) {
      // Use Search endpoint if querying, or Filter if complex
      endpoint = (muscles || equipment || bodyPart) ? '/exercises/filter' : '/exercises/search';
    } else if (bodyPart) {
      endpoint = `/bodyparts/${encodeURIComponent(bodyPart)}/exercises`;
    } else if (muscles) {
      endpoint = `/muscles/${encodeURIComponent(muscles)}/exercises`;
    } else if (equipment) {
       endpoint = `/equipments/${encodeURIComponent(equipment)}/exercises`;
    }

    const params = new URLSearchParams({
      offset: (page * limit).toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (endpoint.includes('/exercises') && !endpoint.includes('/bodyparts/') && !endpoint.includes('/muscles/') && !endpoint.includes('/equipments/')) {
        if (search) params.append(endpoint.includes('search') ? 'q' : 'search', search);
        if (muscles) params.append('muscles', muscles);
        if (equipment) params.append('equipment', equipment);
        if (bodyPart) params.append('bodyParts', bodyPart);
    }

    const url = buildUrl(`${endpoint}?${params.toString()}`);
    console.log(`Fetching: ${url}`);

    const res = await fetchWithRetry(url);
    const json = await parseApiResponse(res);
    const allExercises = json.data || [];

    const result = {
      exercises: allExercises.map(ex => {
        // ✅ APPLY CLEANER
        const gifUrl = cleanUrl(ex.gifUrl);
        const staticImg = cleanUrl(ex.image);
        
        // Prioritize GIF, fallback to static, fallback to local default
        const previewImage = gifUrl || staticImg || FALLBACK_GIF;

        let imagesArray = [];
        if (ex.images && Array.isArray(ex.images) && ex.images.length > 0) {
            imagesArray = ex.images.map(img => ({ image: cleanUrl(img) || FALLBACK_GIF }));
        } else {
            imagesArray = [{ image: previewImage }];
        }

        return {
          id: ex.exerciseId || ex.id,
          name: ex.name,
          description: ex.instructions?.join(' ') || 'No instructions available.',
          category: ex.bodyParts?.[0] || 'General',
          muscles: ex.targetMuscles?.join(', ') || 'Multiple',
          musclesSecondary: ex.secondaryMuscles?.join(', ') || null,
          equipment: ex.equipments?.join(', ') || 'Bodyweight',
          previewImage: previewImage,
          images: imagesArray,
          hasVideo: !!ex.videos?.length,
          videos: ex.videos || []
        };
      }),
      hasMore: allExercises.length === limit,
      total: json.metadata?.totalExercises || 1300,
      cached: false
    };

    apiState.setCache(cacheKey, { ...result, cached: true });
    return result;

  } catch (error) {
    console.error('API Error:', error);
    return { 
      exercises: [], 
      hasMore: false, 
      error: error.message || 'Failed to load exercises',
      retryable: true 
    };
  }
};

export const fetchExerciseDetails = async (id, useCache = true) => {
  const cacheKey = `exercise:${id}`;
  if (useCache) {
    const cached = apiState.getCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const url = buildUrl(`/exercises/${id}`);
    const res = await fetchWithRetry(url);
    const json = await parseApiResponse(res);
    const ex = json.data;

    // ✅ APPLY CLEANER
    const gifUrl = cleanUrl(ex.gifUrl);
    const staticImg = cleanUrl(ex.image);
    const previewImage = gifUrl || staticImg || FALLBACK_GIF;

    let imagesArray = [];
    if (ex.images && Array.isArray(ex.images) && ex.images.length > 0) {
        imagesArray = ex.images.map(img => ({ image: cleanUrl(img) || FALLBACK_GIF }));
    } else {
        imagesArray = [{ image: previewImage }];
    }

    const details = {
      ...ex,
      id: ex.exerciseId || ex.id,
      description: ex.instructions?.join(' ') || '',
      category: ex.bodyParts?.[0] || 'General',
      muscles: ex.targetMuscles?.join(', ') || 'Multiple',
      equipment: ex.equipments?.join(', ') || 'Bodyweight',
      previewImage: previewImage,
      images: imagesArray,
      videos: ex.videos || []
    };

    apiState.setCache(cacheKey, details);
    return details;

  } catch (err) {
    console.error('Details Error:', err);
    return null;
  }
};

export const getCategories = async () => {
  const cacheKey = 'bodyparts';
  const cached = apiState.getCache(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetchWithRetry(buildUrl('/bodyparts'));
    const json = await parseApiResponse(res);
    const cats = ['All', ...(json.data?.map(c => c.name) || [])];
    apiState.setCache(cacheKey, cats);
    return cats;
  } catch (e) {
    return ['All', 'back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'];
  }
};

export const clearCache = () => apiState.clearPersistedCache();
export { CONFIG, apiState };