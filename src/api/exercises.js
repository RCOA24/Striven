// src/api/exercises.js
const API_BASE = 'https://exercisedb-api.vercel.app/api/v1';

export const fetchExercises = async (page = 0, options = {}) => {
  try {
    const { bodyPart = null, limit = 25 } = options;
    let url = `${API_BASE}/exercises?offset=${page * limit}&limit=${limit}`;

    if (bodyPart && bodyPart !== 'all') {
      // Use bodyparts endpoint for filtering
      url = `${API_BASE}/bodyparts/${encodeURIComponent(bodyPart)}/exercises?offset=${page * limit}&limit=${limit}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'API error');

    const allExercises = json.data || [];

    return {
      exercises: allExercises.map(ex => ({
        id: ex.exerciseId,
        name: ex.name,
        description: ex.instructions?.join(' ') || 'No instructions available.',
        category: ex.bodyParts?.[0] || 'General',
        muscles: ex.targetMuscles?.join(', ') || 'Multiple',
        equipment: ex.equipments?.join(', ') || 'Bodyweight',
        previewImage: ex.gifUrl,
        images: [{ image: ex.gifUrl }],
        videos: [],
        hasVideo: false
      })),
      hasMore: !!json.metadata?.nextPage,
      total: json.metadata?.totalExercises || allExercises.length
    };
  } catch (error) {
    console.error('ExerciseDB API Error:', error);
    return { exercises: [], hasMore: false, error: 'Failed to load exercises. Check your connection.' };
  }
};

export const getCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/bodyparts`);
    const json = await res.json();
    return ['All', ...(json.data?.map(c => c.name) || [])];
  } catch (err) {
    console.error('Categories failed:', err);
    return ['All', 'neck', 'lower arms', 'shoulders', 'cardio', 'upper arms', 'chest', 'lower legs', 'back', 'upper legs', 'waist'];
  }
};

export const fetchExerciseDetails = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/exercises/${id}`);
    if (!res.ok) throw new Error('Not found');
    const json = await res.json();
    const ex = json.data;
    return {
      id: ex.exerciseId,
      name: ex.name,
      description: ex.instructions?.join(' ') || '',
      category: ex.bodyParts?.[0] || 'General',
      muscles: ex.targetMuscles?.join(', ') || 'Multiple',
      equipment: ex.equipments?.join(', ') || 'Bodyweight',
      images: [{ image: ex.gifUrl }],
      videos: [],
      previewImage: ex.gifUrl
    };
  } catch (err) {
    console.error('Details failed:', err);
    return null;
  }
};