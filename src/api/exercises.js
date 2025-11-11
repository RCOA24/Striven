// src/api/exercises.js
const API_BASE = 'https://exercisedb-api.vercel.app/api/v1';
const CORS_PROXY = 'https://corsproxy.io/?';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

const buildUrl = (endpoint) => {
  if (import.meta.env.DEV) {
    return `${CORS_PROXY}${encodeURIComponent(API_BASE + endpoint)}`;
  }
  return API_BASE + endpoint;
};

/**
 * Retry helper with exponential backoff
 */
const fetchWithRetry = async (url, options = {}, retryCount = 0) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return res;
  } catch (error) {
    // Don't retry on abort or if max retries reached
    if (error.name === 'AbortError' || retryCount >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
      RETRY_CONFIG.maxDelay
    );

    console.warn(
      `Request failed (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries + 1}). ` +
      `Retrying in ${delay}ms...`,
      error.message
    );

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry the request
    return fetchWithRetry(url, options, retryCount + 1);
  }
};

/**
 * Parse API response with error handling
 */
const parseApiResponse = async (res) => {
  const json = await res.json();
  
  if (!json.success) {
    throw new Error(json.message || 'API returned unsuccessful response');
  }

  return json;
};

export const fetchExercises = async (page = 0, options = {}) => {
  try {
    const {
      bodyPart = null,
      search = '',
      muscles = null,
      equipment = null,
      limit = 25,
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

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
    const res = await fetchWithRetry(url);
    const json = await parseApiResponse(res);

    const allExercises = json.data || [];

    return {
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
      total: json.metadata?.totalExercises || (bodyPart ? undefined : 1300)
    };
  } catch (error) {
    console.error('ExerciseDB API Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to load exercises. ';
    if (error.name === 'AbortError') {
      errorMessage += 'Request timed out. Please check your connection.';
    } else if (error.message.includes('HTTP')) {
      errorMessage += 'Server error. Please try again later.';
    } else {
      errorMessage += 'Please check your connection and try again.';
    }

    return { 
      exercises: [], 
      hasMore: false, 
      error: errorMessage,
      retryable: true
    };
  }
};

export const getCategories = async () => {
  try {
    const url = buildUrl('/bodyparts');
    const res = await fetchWithRetry(url);
    const json = await parseApiResponse(res);
    
    return ['All', ...(json.data?.map(c => c.name) || [])];
  } catch (err) {
    console.error('Categories fetch failed:', err);
    
    // Return fallback categories
    return [
      'All', 'neck', 'lower arms', 'shoulders', 'cardio', 
      'upper arms', 'chest', 'lower legs', 'back', 'upper legs', 'waist'
    ];
  }
};

export const fetchExerciseDetails = async (id) => {
  try {
    const url = buildUrl(`/exercises/${id}`);
    const res = await fetchWithRetry(url);
    const json = await parseApiResponse(res);
    
    const ex = json.data;
    return {
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
  } catch (err) {
    console.error('Exercise details fetch failed:', err);
    return null;
  }
};

// Optional: Export retry config for customization
export const setRetryConfig = (config) => {
  Object.assign(RETRY_CONFIG, config);
};