// src/api/exercises.js
/**
 * ExerciseDB API Client with Enterprise-Grade Reliability
 * Features: Retry logic, circuit breaker, fallback proxies, caching, health checks
 * + PERSISTENT localStorage CACHE (for PWA / mobile app)
 */

const API_BASE = 'https://exercisedb-api.vercel.app/api/v1';

// Multiple CORS proxies for redundancy
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors.proxy.workers.dev/?'
];

// Persistent cache key (bump version on schema changes)
const CACHE_VERSION = 'v1';
const PERSISTED_KEY = `exercisedb_cache_${CACHE_VERSION}`;

// Configuration
const CONFIG = {
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  timeout: {
    default: 15000,
    healthCheck: 5000
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    halfOpenRequests: 1
  },
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    persist: true // ← NEW: enable localStorage
  }
};

// State management
class ApiState {
  constructor() {
    this.currentProxyIndex = 0;
    this.proxyHealth = new Map();
    this.failureCount = 0;
    this.circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = null;
    this.cache = new Map();
    this.cacheTimestamps = new Map();

    // Load persisted cache on startup
    if (CONFIG.cache.persist) this.loadPersistedCache();
  }

  // ── PERSISTENCE ───────────────────────────────────────────────
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
      console.log(`Persisted cache loaded: ${this.cache.size} items`);
    } catch (e) {
      console.warn('Failed to load persisted cache', e);
    }
  }

  persistCache() {
    if (!CONFIG.cache.persist) return;
    try {
      const data = Object.fromEntries(this.cache);
      const timestamps = Object.fromEntries(this.cacheTimestamps);
      localStorage.setItem(PERSISTED_KEY, JSON.stringify({ data, timestamps }));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage full – trimming cache');
        this.trimCache();
      } else {
        console.error('Failed to persist cache', e);
      }
    }
  }

  trimCache() {
    while (this.cache.size > Math.floor(CONFIG.cache.maxSize * 0.7)) {
      const first = this.cache.keys().next().value;
      this.cache.delete(first);
      this.cacheTimestamps.delete(first);
    }
    this.persistCache();
  }

  clearPersistedCache() {
    localStorage.removeItem(PERSISTED_KEY);
    this.clearCache();
    console.log('Persisted cache cleared');
  }

  // ── PROXY & CIRCUIT BREAKER (unchanged) ───────────────────────
  rotateProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % CORS_PROXIES.length;
    console.log(`Rotated to proxy ${this.currentProxyIndex + 1}/${CORS_PROXIES.length}`);
  }

  getCurrentProxy() {
    return CORS_PROXIES[this.currentProxyIndex];
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= CONFIG.circuitBreaker.failureThreshold) {
      this.openCircuit();
    }
  }

  recordSuccess() {
    this.failureCount = Math.max(0, this.failureCount - 1);
    if (this.circuitState === 'HALF_OPEN') {
      this.closeCircuit();
    }
  }

  openCircuit() {
    this.circuitState = 'OPEN';
    console.warn('Circuit breaker OPEN - API calls suspended');
    
    setTimeout(() => {
      this.circuitState = 'HALF_OPEN';
      console.log('Circuit breaker HALF_OPEN - testing connection');
    }, CONFIG.circuitBreaker.resetTimeout);
  }

  closeCircuit() {
    this.circuitState = 'CLOSED';
    this.failureCount = 0;
    console.log('Circuit breaker CLOSED - normal operation');
  }

  isCircuitOpen() {
    return this.circuitState === 'OPEN';
  }

  // ── CACHE (now persistent) ───────────────────────────────────
  setCache(key, value) {
    if (this.cache.size >= CONFIG.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.cacheTimestamps.delete(firstKey);
    }
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
    this.persistCache(); // ← auto-save
  }

  getCache(key) {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp || Date.now() - timestamp > CONFIG.cache.ttl) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      this.persistCache();
      return null;
    }
    return this.cache.get(key);
  }

  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    if (CONFIG.cache.persist) localStorage.removeItem(PERSISTED_KEY);
  }
}

const apiState = new ApiState();

/**
 * Build URL with current proxy or direct
 */
const buildUrl = (endpoint) => {
  if (import.meta.env.DEV) {
    const proxy = apiState.getCurrentProxy();
    return `${proxy}${encodeURIComponent(API_BASE + endpoint)}`;
  }
  return API_BASE + endpoint;
};

/**
 * Health check for API availability
 */
export const checkApiHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout.healthCheck);

    const url = buildUrl('/bodyparts');
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);
    
    const isHealthy = res.ok;
    console.log(`Health check: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
    
    return isHealthy;
  } catch (error) {
    console.log('Health check: Failed', error.message);
    return false;
  }
};

/**
 * Fetch with timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = CONFIG.timeout.default) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Smart retry with exponential backoff and proxy rotation
 */
const fetchWithRetry = async (url, options = {}, attempt = 0) => {
  if (apiState.isCircuitOpen()) {
    throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
  }

  try {
    const res = await fetchWithTimeout(url, options);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    apiState.recordSuccess();
    return res;

  } catch (error) {
    const isLastAttempt = attempt >= CONFIG.retry.maxAttempts - 1;
    const isAborted = error.name === 'AbortError';
    const isNetworkError = error.message.includes('fetch') || error.message.includes('network');

    console.warn(
      `Request failed (${attempt + 1}/${CONFIG.retry.maxAttempts}):`,
      error.message
    );

    if (import.meta.env.DEV && (isNetworkError || isAborted)) {
      apiState.rotateProxy();
      const endpoint = url.split(encodeURIComponent(API_BASE))[1];
      if (endpoint) {
        const decodedEndpoint = decodeURIComponent(endpoint);
        url = buildUrl(decodedEndpoint);
      }
    }

    if (isLastAttempt) {
      apiState.recordFailure();
      throw error;
    }

    const delay = Math.min(
      CONFIG.retry.initialDelay * Math.pow(CONFIG.retry.backoffMultiplier, attempt),
      CONFIG.retry.maxDelay
    );

    console.log(`Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));

    return fetchWithRetry(url, options, attempt + 1);
  }
};

/**
 * Parse and validate API response
 */
const parseApiResponse = async (res) => {
  const contentType = res.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Invalid response format - expected JSON');
  }

  const json = await res.json();
  
  if (!json.success) {
    throw new Error(json.message || 'API returned unsuccessful response');
  }

  return json;
};

/**
 * Generate cache key from request parameters
 */
const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

/**
 * Fetch exercises with caching and retry logic
 */
export const fetchExercises = async (page = 0, options = {}) => {
  const {
    bodyPart = null,
    search = '',
    muscles = null,
    equipment = null,
    limit = 25,
    sortBy = 'name',
    sortOrder = 'asc',
    useCache = true
  } = options;

  const cacheKey = getCacheKey('exercises', { page, bodyPart, search, muscles, equipment, limit, sortBy, sortOrder });
  
  if (useCache) {
    const cached = apiState.getCache(cacheKey);
    if (cached) {
      console.log('Returning cached exercises (persistent)');
      return cached;
    }
  }

  try {
    let endpoint = '/exercises';
    const params = new URLSearchParams({
      offset: (page * limit).toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(muscles && { muscles }),
      ...(equipment && { equipment }),
      ...(bodyPart && { bodyParts: bodyPart }),
      sortBy,
      sortOrder
    });

    if (bodyPart && !search && !muscles && !equipment) {
      endpoint = `/bodyparts/${encodeURIComponent(bodyPart)}/exercises`;
    }

    const url = buildUrl(`${endpoint}?${params.toString()}`);
    console.log('Fetching exercises:', { page, bodyPart, search });

    const res = await fetchWithRetry(url);
    const json = await parseApiResponse(res);

    const allExercises = json.data || [];

    const result = {
      exercises: allExercises.map(ex => ({
        id: ex.exerciseId || ex.id,
        name: ex.name,
        description: ex.instructions?.join(' ') || 'No instructions available.',
        category: ex.bodyParts?.[0] || 'General',
        muscles: ex.targetMuscles?.join(', ') || 'Multiple',
        musclesSecondary: ex.secondaryMuscles?.join(', ') || null,
        equipment: ex.equipments?.join(', ') || 'Bodyweight',
        previewImage: ex.gifUrl || ex.image || '/placeholder-exercise.jpg',
        images: ex.images?.map(img => ({ image: img })) || [{ image: ex.gifUrl }],
        videos: ex.videos?.map(vid => ({ video: vid })) || [],
        hasVideo: !!ex.videos?.length,
        aliases: ex.aliases || []
      })),
      hasMore: allExercises.length === limit,
      total: json.metadata?.totalExercises || (bodyPart ? undefined : 1300),
      cached: false
    };

    apiState.setCache(cacheKey, { ...result, cached: true });
    console.log('Exercises loaded successfully');

    return result;

  } catch (error) {
    console.error('ExerciseDB API Error:', error);
    
    let errorMessage = 'Failed to load exercises. ';
    let errorType = 'unknown';

    if (error.message.includes('Circuit breaker')) {
      errorMessage += 'Service temporarily unavailable. Please try again in a moment.';
      errorType = 'circuit_breaker';
    } else if (error.name === 'AbortError') {
      errorMessage += 'Request timed out. Check your internet connection.';
      errorType = 'timeout';
    } else if (error.message.includes('HTTP 429')) {
      errorMessage += 'Too many requests. Please wait a moment.';
      errorType = 'rate_limit';
    } else if (error.message.includes('HTTP 5')) {
      errorMessage += 'Server error. Please try again later.';
      errorType = 'server_error';
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      errorMessage += 'Network error. Check your connection.';
      errorType = 'network_error';
    } else {
      errorMessage += 'Please try again.';
    }

    return { 
      exercises: [], 
      hasMore: false, 
      error: errorMessage,
      errorType,
      retryable: true,
      circuitOpen: apiState.isCircuitOpen()
    };
  }
};

/**
 * Get exercise categories with fallback
 */
export const getCategories = async (useCache = true) => {
  const cacheKey = 'categories';

  if (useCache) {
    const cached = apiState.getCache(cacheKey);
    if (cached) {
      console.log('Returning cached categories (persistent)');
      return cached;
    }
  }

  try {
    const url = buildUrl('/bodyparts');
    console.log('Fetching categories');

    const res = await fetchWithRetry(url);
    const json = await parseApiResponse(res);
    
    const categories = ['All', ...(json.data?.map(c => c.name) || [])];
    
    apiState.setCache(cacheKey, categories);
    console.log('Categories loaded successfully');
    
    return categories;

  } catch (err) {
    console.error('Categories fetch failed:', err);
    
    const fallback = [
      'All', 'back', 'cardio', 'chest', 'lower arms', 'lower legs',
      'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
    ];
    
    console.log('Using fallback categories');
    return fallback;
  }
};

/**
 * Fetch single exercise details
 */
export const fetchExerciseDetails = async (id, useCache = true) => {
  const cacheKey = `exercise:${id}`;

  if (useCache) {
    const cached = apiState.getCache(cacheKey);
    if (cached) {
      console.log('Returning cached exercise details (persistent)');
      return cached;
    }
  }

  try {
    const url = buildUrl(`/exercises/${id}`);
    console.log('Fetching exercise details:', id);

    const res = await fetchWithRetry(url);
    const json = await parseApiResponse(res);
    
    const ex = json.data;
    const details = {
      id: ex.exerciseId || ex.id,
      name: ex.name,
      description: ex.instructions?.join(' ') || '',
      category: ex.bodyParts?.[0] || 'General',
      muscles: ex.targetMuscles?.join(', ') || 'Multiple',
      musclesSecondary: ex.secondaryMuscles?.join(', ') || null,
      equipment: ex.equipments?.join(', ') || 'Bodyweight',
      images: ex.images?.map(img => ({ image: img })) || [{ image: ex.gifUrl }],
      videos: ex.videos?.map(vid => ({ video: vid })) || [],
      previewImage: ex.gifUrl || ex.image,
      aliases: ex.aliases || [],
      license: 'CC0'
    };

    apiState.setCache(cacheKey, details);
    console.log('Exercise details loaded successfully');

    return details;

  } catch (err) {
    console.error('Exercise details fetch failed:', err);
    return null;
  }
};

/**
 * Utility: Clear all caches (in-memory + persisted)
 */
export const clearCache = () => {
  apiState.clearPersistedCache();
  console.log('Cache cleared (including localStorage)');
};

/**
 * Utility: Get API status
 */
export const getApiStatus = () => {
  return {
    circuitState: apiState.circuitState,
    failureCount: apiState.failureCount,
    currentProxy: apiState.getCurrentProxy(),
    cacheSize: apiState.cache.size,
    isHealthy: !apiState.isCircuitOpen(),
    persistedCache: CONFIG.cache.persist,
    storageKey: PERSISTED_KEY
  };
};

/**
 * Utility: Force circuit reset (use with caution)
 */
export const resetCircuit = () => {
  apiState.closeCircuit();
  console.log('Circuit breaker manually reset');
};

// Export configuration for customization
export { CONFIG, apiState };