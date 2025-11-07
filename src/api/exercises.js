// src/api/exercises.js
const API_BASE = 'https://exercisedb-api.vercel.app/api/v1';

export const fetchExercises = async (page = 0, options = {}) => {
  try {
    const {
      bodyPart = null,
      search = '',
      muscles = null,
      equipment = null,
      limit = 25, // Max allowed by API
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

    // Build advanced filter URL
    let url = `${API_BASE}/exercises`;
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
    url += `?${params.toString()}`;

    // If bodyPart filter but no advanced params, fallback to dedicated endpoint (for compatibility)
    if (bodyPart && !search && !muscles && !equipment) {
      url = `${API_BASE}/bodyparts/${encodeURIComponent(bodyPart)}/exercises?${params.toString()}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'API error');

    const allExercises = json.data || [];

    return {
      exercises: allExercises.map(ex => ({
        id: ex.exerciseId || ex.id, // Fallback for variations
        name: ex.name,
        description: ex.instructions?.join(' ') || 'No instructions available.',
        category: ex.bodyParts?.[0] || 'General',
        muscles: ex.targetMuscles?.join(', ') || 'Multiple',
        musclesSecondary: ex.secondaryMuscles?.join(', ') || null, // Bonus: Add secondary if available
        equipment: ex.equipments?.join(', ') || 'Bodyweight',
        previewImage: ex.gifUrl || ex.image || '/placeholder-exercise.jpg',
        images: ex.images?.map(img => ({ image: img })) || [{ image: ex.gifUrl }],
        videos: ex.videos?.map(vid => ({ video: vid })) || [],
        hasVideo: !!ex.videos?.length,
        aliases: ex.aliases || [] // If API supports
      })),
      hasMore: allExercises.length === limit, // Reliable check: Full page = more available
      total: json.metadata?.totalExercises || (bodyPart ? undefined : 1300) // Fallback total for "All"
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
      license: 'CC0' // Common for public APIs; adjust if needed
    };
  } catch (err) {
    console.error('Details failed:', err);
    return null;
  }
};