// src/api/exercises.js
const API_BASE = 'https://wger.de/api/v2';
const LANGUAGE_ID = 2; // English (1=German, 2=English, etc.)

// Cache for lookup data (muscles, equipment, categories)
const cache = {
  muscles: null,
  equipment: null,
  categories: null
};

// Initialize lookup data
const initializeLookups = async () => {
  if (cache.muscles && cache.equipment && cache.categories) return;

  try {
    const [musclesRes, equipmentRes, categoriesRes] = await Promise.all([
      fetch(`${API_BASE}/muscle/?format=json`),
      fetch(`${API_BASE}/equipment/?format=json`),
      fetch(`${API_BASE}/exercisecategory/?format=json`)
    ]);

    const [muscles, equipment, categories] = await Promise.all([
      musclesRes.json(),
      equipmentRes.json(),
      categoriesRes.json()
    ]);

    cache.muscles = muscles.results.reduce((acc, m) => {
      acc[m.id] = m.name;
      return acc;
    }, {});

    cache.equipment = equipment.results.reduce((acc, e) => {
      acc[e.id] = e.name;
      return acc;
    }, {});

    cache.categories = categories.results.reduce((acc, c) => {
      acc[c.id] = c.name;
      return acc;
    }, {});
  } catch (error) {
    console.error('Failed to initialize lookups:', error);
  }
};

// Fetch exercise info (uses exerciseinfo endpoint for better data)
export const fetchExerciseDetails = async (exerciseId) => {
  try {
    await initializeLookups();

    const [infoRes, imagesRes, videosRes] = await Promise.all([
      fetch(`${API_BASE}/exerciseinfo/${exerciseId}/?format=json`),
      fetch(`${API_BASE}/exerciseimage/?exercise=${exerciseId}&format=json`),
      fetch(`${API_BASE}/video/?exercise=${exerciseId}&format=json`)
    ]);

    const [info, images, videos] = await Promise.all([
      infoRes.json(),
      imagesRes.json(),
      videosRes.json()
    ]);

    return {
      id: info.id,
      name: info.name,
      description: info.description || 'No description available.',
      category: cache.categories[info.category] || 'General',
      muscles: info.muscles?.map(id => cache.muscles[id]).filter(Boolean).join(', ') || 'Multiple',
      musclesSecondary: info.muscles_secondary?.map(id => cache.muscles[id]).filter(Boolean).join(', ') || '',
      equipment: info.equipment?.map(id => cache.equipment[id]).filter(Boolean).join(', ') || 'Bodyweight',
      images: images.results?.map(img => ({
        id: img.id,
        image: img.image,
        isMain: img.is_main,
        license: img.license,
        authorHistory: img.author_history
      })) || [],
      videos: videos.results?.map(vid => ({
        id: vid.id,
        video: vid.video,
        size: vid.size,
        duration: vid.duration,
        width: vid.width,
        height: vid.height,
        codec: vid.codec,
        license: vid.license
      })) || [],
      variations: info.variations || [],
      aliases: info.aliases || [],
      license: info.license?.short_name || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to fetch exercise details:', error);
    return null;
  }
};

// Fetch paginated exercises with filters
export const fetchExercises = async (page = 0, options = {}) => {
  try {
    await initializeLookups();

    const {
      category = null,
      equipment = null,
      muscles = null,
      language = LANGUAGE_ID,
      limit = 20
    } = options;

    // Build query parameters
    const params = new URLSearchParams({
      format: 'json',
      limit: limit.toString(),
      offset: (page * limit).toString(),
      language: language.toString()
    });

    if (category && category !== 'All') {
      const categoryId = Object.entries(cache.categories).find(
        ([_, name]) => name === category
      )?.[0];
      if (categoryId) params.append('category', categoryId);
    }

    if (equipment) params.append('equipment', equipment);
    if (muscles) params.append('muscles', muscles);

    const response = await fetch(`${API_BASE}/exerciseinfo/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch');

    const data = await response.json();
    
    const exercises = data.results.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: cache.categories[ex.category] || 'General',
      equipment: ex.equipment?.map(id => cache.equipment[id]).filter(Boolean).join(', ') || 'Bodyweight',
      muscles: ex.muscles?.map(id => cache.muscles[id]).filter(Boolean).join(', ') || 'Multiple',
      // Images are embedded in exerciseinfo
      previewImage: ex.images?.[0]?.image || null,
      hasVideo: ex.videos && ex.videos.length > 0
    }));

    return {
      exercises,
      hasMore: !!data.next,
      total: data.count,
      error: null
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      exercises: page === 0 ? FALLBACK_EXERCISES : [],
      hasMore: false,
      error: 'Failed to fetch exercises. Using fallback data.',
      total: 0
    };
  }
};

// Get all available categories
export const getCategories = async () => {
  await initializeLookups();
  return ['All', ...Object.values(cache.categories)];
};

// Get all available equipment
export const getEquipment = async () => {
  await initializeLookups();
  return Object.entries(cache.equipment).map(([id, name]) => ({
    id: parseInt(id),
    name
  }));
};

// Get all muscles
export const getMuscles = async () => {
  await initializeLookups();
  return Object.entries(cache.muscles).map(([id, name]) => ({
    id: parseInt(id),
    name
  }));
};

// Search exercises by name
export const searchExercises = async (query, language = LANGUAGE_ID) => {
  try {
    await initializeLookups();

    const response = await fetch(
      `${API_BASE}/exerciseinfo/?format=json&language=${language}&limit=50`
    );
    
    if (!response.ok) throw new Error('Failed to search');

    const data = await response.json();
    
    // Filter locally (API doesn't have direct search endpoint)
    const filtered = data.results.filter(ex =>
      ex.name.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: cache.categories[ex.category] || 'General',
      equipment: ex.equipment?.map(id => cache.equipment[id]).filter(Boolean).join(', ') || 'Bodyweight',
      muscles: ex.muscles?.map(id => cache.muscles[id]).filter(Boolean).join(', ') || 'Multiple',
      previewImage: ex.images?.[0]?.image || null
    }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

// Fallback data for offline/error scenarios
const FALLBACK_EXERCISES = [
  {
    id: 345,
    name: 'Incline Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
    muscles: 'Pectoralis major',
    previewImage: 'https://wger.de/media/exercise-images/345/Incline-bench-press-1.png',
    hasVideo: false
  },
  {
    id: 227,
    name: 'Front Squats',
    category: 'Legs',
    equipment: 'Barbell',
    muscles: 'Quadriceps',
    previewImage: 'https://wger.de/media/exercise-images/227/Front-squat-1.png',
    hasVideo: false
  },
  {
    id: 80,
    name: 'Dumbbell Flies',
    category: 'Chest',
    equipment: 'Dumbbell',
    muscles: 'Pectoralis major',
    previewImage: 'https://wger.de/media/exercise-images/80/Dumbbell-Bench-Press-1.png',
    hasVideo: false
  }
];

export default {
  fetchExercises,
  fetchExerciseDetails,
  getCategories,
  getEquipment,
  getMuscles,
  searchExercises
};