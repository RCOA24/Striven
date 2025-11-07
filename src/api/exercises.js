// src/api/exercises.js
const API_BASE = 'https://exercisedb-api.vercel.app/api/v1';
const CORS_PROXY = 'https://corsproxy.io/?'; // or 'https://api.allorigins.win/raw?url='

const buildUrl = (endpoint) => {
  // Only use proxy in development
  if (import.meta.env.DEV) {
    return `${CORS_PROXY}${encodeURIComponent(API_BASE + endpoint)}`;
  }
  return API_BASE + endpoint;
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
    const res = await fetch(url);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'API error');

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
    return { exercises: [], hasMore: false, error: 'Failed to load exercises. Check your connection.' };
  }
};

export const getCategories = async () => {
  try {
    const url = buildUrl('/bodyparts');
    const res = await fetch(url);
    const json = await res.json();
    return ['All', ...(json.data?.map(c => c.name) || [])];
  } catch (err) {
    console.error('Categories failed:', err);
    return ['All', 'neck', 'lower arms', 'shoulders', 'cardio', 'upper arms', 'chest', 'lower legs', 'back', 'upper legs', 'waist'];
  }
};

export const fetchExerciseDetails = async (id) => {
  try {
    const url = buildUrl(`/exercises/${id}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    const json = await res.json();
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
    console.error('Details failed:', err);
    return null;
  }
};