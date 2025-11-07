// src/utils/db.js
import Dexie from "dexie";

export const db = new Dexie("StrivenDB");

// Version 1: Original schema
db.version(1).stores({
  activities: '++id, date, steps, distance, calories, duration, timestamp',
  weeklyStats: '++id, weekStart, totalSteps, totalDistance, totalCalories, totalDuration',
  settings: '++id, key, value',
  goals: '++id, type, target, current, date, completed'
});

// Version 2: Workout features
db.version(2).stores({
  activities: '++id, date, steps, distance, calories, duration, timestamp',
  weeklyStats: '++id, weekStart, totalSteps, totalDistance, totalCalories, totalDuration',
  settings: '++id, key, value',
  goals: '++id, type, target, current, date, completed',
  favorites: '++id, exerciseId, name, muscles, equipment, category, gifUrl, addedAt',
  todayWorkout: '++id, exerciseId, name, sets, reps, weight, rest, notes, order, addedAt',
  workoutPlans: '++id, name, days, createdAt, isActive'
}).upgrade(() => {
  console.log('Upgraded to v2: Added workout features');
});

// Version 3: ADD WEIGHT LOGS + PR TRACKING
db.version(3).stores({
  activities: '++id, date, steps, distance, calories, duration, timestamp',
  weeklyStats: '++id, weekStart, totalSteps, totalDistance, totalCalories, totalDuration',
  settings: '++id, key, value',
  goals: '++id, type, target, current, date, completed',
  favorites: '++id, exerciseId, name, muscles, equipment, category, gifUrl, addedAt',
  todayWorkout: '++id, exerciseId, name, sets, reps, weight, rest, notes, order, addedAt',
  workoutPlans: '++id, name, days, createdAt, isActive',
  exerciseLogs: '++id, exerciseId, date, set, weight, reps, oneRm' // NEW TABLE
}).upgrade(() => {
  console.log('Upgraded to v3: Added exerciseLogs for PRs & weight tracking');
});

/* ==================================================================
   FAVORITES
================================================================== */
export const addToFavorites = async (exercise) => {
  const exists = await db.favorites.where('exerciseId').equals(exercise.id).first();
  if (exists) throw new Error('Already saved');

  const id = await db.favorites.add({
    exerciseId: exercise.id,
    name: exercise.name,
    muscles: exercise.muscles,
    musclesSecondary: exercise.musclesSecondary || null,
    equipment: exercise.equipment,
    category: exercise.category,
    gifUrl: exercise.previewImage || exercise.gifUrl,
    addedAt: Date.now()
  });
  notifyChange();
  return id;
};

const notifyChange = () => {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('striven:data-changed'));
    }
  } catch {
    // ignore
  }
};

export const removeFromFavorites = async (exerciseId) => {
  await db.favorites.where('exerciseId').equals(exerciseId).delete();
  notifyChange();
};

export const toggleFavorite = async (exercise) => {
  const exists = await db.favorites.where('exerciseId').equals(exercise.id).first();
  if (exists) {
    await removeFromFavorites(exercise.id);
    return false;
  } else {
    await addToFavorites(exercise);
    return true;
  }
};

export const isFavorite = async (exerciseId) => {
  return await db.favorites.where('exerciseId').equals(exerciseId).count() > 0;
};

export const getFavorites = async () => {
  return await db.favorites.orderBy('addedAt').reverse().toArray();
};

/* ==================================================================
   TODAY'S WORKOUT
================================================================== */
export const addToTodayWorkout = async (exercise, custom = {}) => {
  const exists = await db.todayWorkout.where('exerciseId').equals(exercise.id).first();
  if (exists) throw new Error('Already in today’s workout');

  const order = await db.todayWorkout.count();

  const id = await db.todayWorkout.add({
    exerciseId: exercise.id,
    name: exercise.name,
    muscles: exercise.muscles,
    equipment: exercise.equipment,
    category: exercise.category,
    gifUrl: exercise.previewImage || exercise.gifUrl,
    sets: custom.sets || 3,
    reps: custom.reps || '8-12',
    weight: custom.weight || 0,
    rest: custom.rest || 90,
    notes: custom.notes || '',
    order,
    addedAt: Date.now()
  });
  notifyChange();
  return id;
};

export const getTodayWorkout = async () => {
  return await db.todayWorkout.orderBy('order').toArray();
};

export const updateTodayExercise = async (id, updates) => {
  await db.todayWorkout.update(id, updates);
};

export const reorderTodayWorkout = async (newOrder) => {
  const tx = db.transaction('rw', db.todayWorkout, async () => {
    for (let i = 0; i < newOrder.length; i++) {
      await db.todayWorkout.update(newOrder[i], { order: i });
    }
  });
  await tx;
  notifyChange();
};

export const removeFromToday = async (id) => {
  await db.todayWorkout.delete(id);
  notifyChange();
};

export const clearTodayWorkout = async () => {
  await db.todayWorkout.clear();
  notifyChange();
};

/* ==================================================================
   WORKOUT PLANS
================================================================== */
export const saveWorkoutPlan = async (name, days) => {
  const id = await db.workoutPlans.add({
    name,
    days,
    createdAt: Date.now(),
    isActive: false
  });
  notifyChange();
  return id;
};

export const getWorkoutPlans = async () => {
  return await db.workoutPlans.orderBy('createdAt').reverse().toArray();
};

export const getActivePlan = async () => {
  return await db.workoutPlans.where('isActive').equals(1).first(); // ← FIXED: 1 instead of true
};

export const setActivePlan = async (id) => {
  await db.workoutPlans.toCollection().modify({ isActive: 0 }); // ← FIXED: 0 instead of false
  if (id) await db.workoutPlans.update(id, { isActive: 1 });     // ← FIXED: 1 instead of true
  notifyChange();
};

export const deleteWorkoutPlan = async (id) => {
  await db.workoutPlans.delete(id);
  notifyChange();
};

/* ==================================================================
   NEW: WEIGHT LOGS & PR TRACKING
================================================================== */
export const saveSetLog = async (exerciseId, log) => {
  return await db.exerciseLogs.add({
    exerciseId,
    date: log.date || new Date().toISOString().split('T')[0],
    set: log.set,
    weight: log.weight,
    reps: log.reps,
    oneRm: log.oneRm || log.weight * (1 + log.reps / 30)
  });
};

export const getExerciseHistory = async (exerciseId) => {
  const logs = await db.exerciseLogs
    .where('exerciseId')
    .equals(exerciseId)
    .sortBy('date');

  return { logs };
};

/* ==================================================================
   ORIGINAL FUNCTIONS (100% unchanged)
================================================================== */
export const addActivity = async (activity) => {
  try {
    const id = await db.activities.add({
      ...activity,
      timestamp: Date.now(),
      date: new Date().toISOString()
    });
    return id;
  } catch (error) {
    console.error('Failed to add activity:', error);
    throw error;
  }
};

export const getActivities = async (limit = 50) => {
  try {
    return await db.activities.orderBy('timestamp').reverse().limit(limit).toArray();
  } catch (error) {
    console.error('Failed to get activities:', error);
    return [];
  }
};

export const getActivitiesByDateRange = async (startDate, endDate) => {
  try {
    return await db.activities
      .where('timestamp')
      .between(startDate.getTime(), endDate.getTime(), true, true)
      .toArray();
  } catch (error) {
    console.error('Failed to get activities by date range:', error);
    return [];
  }
};

export const deleteActivity = async (id) => {
  try {
    await db.activities.delete(id);
  } catch (error) {
    console.error('Failed to delete activity:', error);
    throw error;
  }
};

export const clearAllActivities = async () => {
  try {
    await db.activities.clear();
  } catch (error) {
    console.error('Failed to clear activities:', error);
    throw error;
  }
};

export const updateWeeklyStats = async (weekStart, stats) => {
  try {
    const existing = await db.weeklyStats.where('weekStart').equals(weekStart).first();
    if (existing) {
      await db.weeklyStats.update(existing.id, stats);
    } else {
      await db.weeklyStats.add({ weekStart, ...stats });
    }
  } catch (error) {
    console.error('Failed to update weekly stats:', error);
    throw error;
  }
};

export const getWeeklyStats = async (weekStart) => {
  try {
    return await db.weeklyStats.where('weekStart').equals(weekStart).first();
  } catch (error) {
    console.error('Failed to get weekly stats:', error);
    return null;
  }
};

export const getAllWeeklyStats = async () => {
  try {
    return await db.weeklyStats.orderBy('weekStart').reverse().toArray();
  } catch (error) {
    console.error('Failed to get all weekly stats:', error);
    return [];
  }
};

export const getSetting = async (key) => {
  try {
    const setting = await db.settings.where('key').equals(key).first();
    return setting ? setting.value : null;
  } catch (error) {
    console.error('Failed to get setting:', error);
    return null;
  }
};

export const setSetting = async (key, value) => {
  try {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) {
      await db.settings.update(existing.id, { value });
    } else {
      await db.settings.add({ key, value });
    }
  } catch (error) {
    console.error('Failed to set setting:', error);
    throw error;
  }
};

export const addGoal = async (goal) => {
  try {
    return await db.goals.add({
      ...goal,
      date: new Date().toISOString(),
      completed: false
    });
  } catch (error) {
    console.error('Failed to add goal:', error);
    throw error;
  }
};

export const getGoals = async () => {
  try {
    return await db.goals.toArray();
  } catch (error) {
    console.error('Failed to get goals:', error);
    return [];
  }
};

export const updateGoal = async (id, updates) => {
  try {
    await db.goals.update(id, updates);
  } catch (error) {
    console.error('Failed to update goal:', error);
    throw error;
  }
};

export const deleteGoal = async (id) => {
  try {
    await db.goals.delete(id);
  } catch (error) {
    console.error('Failed to delete goal:', error);
    throw error;
  }
};

export const getTotalStats = async () => {
  try {
    const activities = await db.activities.toArray();
    return {
      totalSteps: activities.reduce((sum, a) => sum + (a.steps || 0), 0),
      totalDistance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
      totalCalories: activities.reduce((sum, a) => sum + (a.calories || 0), 0),
      totalDuration: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
      totalActivities: activities.length
    };
  } catch (error) {
    console.error('Failed to get total stats:', error);
    return { totalSteps: 0, totalDistance: 0, totalCalories: 0, totalDuration: 0, totalActivities: 0 };
  }
};

/* ==================================================================
   EXPORT / IMPORT
================================================================== */
export const exportData = async () => {
  try {
    const data = {
      activities: await db.activities.toArray(),
      weeklyStats: await db.weeklyStats.toArray(),
      settings: await db.settings.toArray(),
      goals: await db.goals.toArray(),
      favorites: await db.favorites.toArray(),
      todayWorkout: await db.todayWorkout.toArray(),
      workoutPlans: await db.workoutPlans.toArray(),
      exerciseLogs: await db.exerciseLogs.toArray(),
      exportDate: new Date().toISOString(),
      appVersion: '3.0'
    };
    return data;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

export const importData = async (data) => {
  try {
    const tx = db.transaction('rw', db.tableNames, async () => {
      if (data.activities) await db.activities.bulkPut(data.activities);
      if (data.weeklyStats) await db.weeklyStats.bulkPut(data.weeklyStats);
      if (data.settings) await db.settings.bulkPut(data.settings);
      if (data.goals) await db.goals.bulkPut(data.goals);
      if (data.favorites) await db.favorites.bulkPut(data.favorites);
      if (data.todayWorkout) await db.todayWorkout.bulkPut(data.todayWorkout);
      if (data.workoutPlans) await db.workoutPlans.bulkPut(data.workoutPlans);
      if (data.exerciseLogs) await db.exerciseLogs.bulkPut(data.exerciseLogs);
    });
    await tx;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
};

export const clearAllData = async () => {
  try {
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        if (table.name !== 'settings') await table.clear();
      }
    });
  } catch (error) {
    console.error('Clear all failed:', error);
    throw error;
  }
};

export default db;