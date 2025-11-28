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
  exerciseLogs: '++id, exerciseId, date, set, weight, reps, oneRm'
}).upgrade(() => {
  console.log('Upgraded to v3: Added exerciseLogs for PRs & weight tracking');
});

// Version 4: FOOD LOGS
db.version(4).stores({
  activities: '++id, date, steps, distance, calories, duration, timestamp',
  weeklyStats: '++id, weekStart, totalSteps, totalDistance, totalCalories, totalDuration',
  settings: '++id, key, value',
  goals: '++id, type, target, current, date, completed',
  favorites: '++id, exerciseId, name, muscles, equipment, category, gifUrl, addedAt',
  todayWorkout: '++id, exerciseId, name, sets, reps, weight, rest, notes, order, addedAt',
  workoutPlans: '++id, name, days, createdAt, isActive',
  exerciseLogs: '++id, exerciseId, date, set, weight, reps, oneRm',
  foodLogs: '++id, name, calories, protein, carbs, fat, timestamp'
}).upgrade(() => {
  console.log('Upgraded to v4: Added foodLogs');
});

// Version 5: NUTRITION PROFILE
db.version(5).stores({
  activities: '++id, date, steps, distance, calories, duration, timestamp',
  weeklyStats: '++id, weekStart, totalSteps, totalDistance, totalCalories, totalDuration',
  settings: '++id, key, value',
  goals: '++id, type, target, current, date, completed',
  favorites: '++id, exerciseId, name, muscles, equipment, category, gifUrl, addedAt',
  todayWorkout: '++id, exerciseId, name, sets, reps, weight, rest, notes, order, addedAt',
  workoutPlans: '++id, name, days, createdAt, isActive',
  exerciseLogs: '++id, exerciseId, date, set, weight, reps, oneRm',
  foodLogs: '++id, name, calories, protein, carbs, fat, timestamp',
  nutritionProfile: '++id, targetCalories, protein, fats, carbs, updatedAt'
}).upgrade(() => {
  console.log('Upgraded to v5: Added nutritionProfile');
});

// Version 6: WATER LOGS & MICRONUTRIENTS
db.version(6).stores({
  activities: '++id, date, steps, distance, calories, duration, timestamp',
  weeklyStats: '++id, weekStart, totalSteps, totalDistance, totalCalories, totalDuration',
  settings: '++id, key, value',
  goals: '++id, type, target, current, date, completed',
  favorites: '++id, exerciseId, name, muscles, equipment, category, gifUrl, addedAt',
  todayWorkout: '++id, exerciseId, name, sets, reps, weight, rest, notes, order, addedAt',
  workoutPlans: '++id, name, days, createdAt, isActive',
  exerciseLogs: '++id, exerciseId, date, set, weight, reps, oneRm',
  foodLogs: '++id, name, calories, protein, carbs, fat, sugar, fiber, sodium, timestamp', // Added micronutrients
  nutritionProfile: '++id, targetCalories, protein, fats, carbs, updatedAt',
  waterLogs: '++id, amount, timestamp' // NEW TABLE
}).upgrade(() => {
  console.log('Upgraded to v6: Added waterLogs & micronutrients');
});

/* ==================================================================
   WATER LOGS
================================================================== */
export const saveWaterLog = async (amount) => {
  try {
    return await db.waterLogs.add({
      amount, // in ml
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to save water log:', error);
    throw error;
  }
};

export const getWaterLogs = async () => {
  try {
    return await db.waterLogs.orderBy('timestamp').reverse().toArray();
  } catch (error) {
    console.error('Failed to get water logs:', error);
    return [];
  }
};

/* ==================================================================
   NUTRITION PROFILE
================================================================== */
export const saveNutritionProfile = async (profile) => {
  try {
    // We only keep one active profile, so clear old ones
    await db.nutritionProfile.clear(); 
    return await db.nutritionProfile.add({
      ...profile,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Failed to save nutrition profile:', error);
    throw error;
  }
};

export const getNutritionProfile = async () => {
  try {
    return await db.nutritionProfile.orderBy('updatedAt').reverse().first();
  } catch (error) {
    console.error('Failed to get nutrition profile:', error);
    return null;
  }
};

/* ==================================================================
   FOOD LOGS
================================================================== */
export const saveFoodLog = async (food) => {
  try {
    return await db.foodLogs.add({
      ...food,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to save food log:', error);
    throw error;
  }
};

export const getFoodLogs = async () => {
  try {
    return await db.foodLogs.orderBy('timestamp').reverse().toArray();
  } catch (error) {
    console.error('Failed to get food logs:', error);
    return [];
  }
};

export const deleteFoodLog = async (id) => {
  try {
    await db.foodLogs.delete(id);
  } catch (error) {
    console.error('Failed to delete food log:', error);
    throw error;
  }
};

/* ==================================================================
   FAVORITES
================================================================== */
export const addToFavorites = async (exercise) => {
  const exerciseId = exercise.exerciseId || exercise.id;
  const exists = await db.favorites.where('exerciseId').equals(exerciseId).first();
  if (exists) throw new Error('Already saved');

  const id = await db.favorites.add({
    exerciseId: exerciseId,
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
  const actualId = typeof exerciseId === 'object' ? (exerciseId.exerciseId || exerciseId.id) : exerciseId;
  await db.favorites.where('exerciseId').equals(actualId).delete();
  notifyChange();
};

export const toggleFavorite = async (exercise) => {
  const exerciseId = exercise.exerciseId || exercise.id;
  const exists = await db.favorites.where('exerciseId').equals(exerciseId).first();
  if (exists) {
    await removeFromFavorites(exerciseId);
    return false;
  } else {
    await addToFavorites(exercise);
    return true;
  }
};

export const isFavorite = async (exerciseId) => {
  const actualId = typeof exerciseId === 'object' ? (exerciseId.exerciseId || exerciseId.id) : exerciseId;
  return await db.favorites.where('exerciseId').equals(actualId).count() > 0;
};

export const getFavorites = async () => {
  return await db.favorites.orderBy('addedAt').reverse().toArray();
};

/* ==================================================================
   TODAY'S WORKOUT
================================================================== */
export const addToTodayWorkout = async (exercise, custom = {}) => {
  const exists = await db.todayWorkout.where('exerciseId').equals(exercise.id).first();
  if (exists) throw new Error('Already in today\'s workout');

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
  // First, deactivate all existing plans
  await db.workoutPlans.toCollection().modify({ isActive: 0 });
  
  // Create new plan and set it as active
  const id = await db.workoutPlans.add({
    name,
    days,
    createdAt: Date.now(),
    isActive: 1 // Set new plan as active
  });
  
  notifyChange();
  return id;
};

export const getWorkoutPlans = async () => {
  return await db.workoutPlans.orderBy('createdAt').reverse().toArray();
};

export const getActivePlan = async () => {
  return await db.workoutPlans.where('isActive').equals(1).first();
};

export const setActivePlan = async (id) => {
  await db.workoutPlans.toCollection().modify({ isActive: 0 });
  if (id) await db.workoutPlans.update(id, { isActive: 1 });
  notifyChange();
};

export const deleteWorkoutPlan = async (id) => {
  await db.workoutPlans.delete(id);
  notifyChange();
};

/**
 * UPDATE WORKOUT PLAN - NEW FUNCTION
 * Updates an existing workout plan with new data
 */
export const updateWorkoutPlan = async (planId, updatedData) => {
  try {
    const existingPlan = await db.workoutPlans.get(planId);
    if (!existingPlan) {
      throw new Error('Plan not found');
    }
    
    // Update the plan while preserving important fields
    await db.workoutPlans.update(planId, {
      name: updatedData.name,
      days: updatedData.days,
      updatedAt: Date.now(),
      // Preserve these fields
      createdAt: existingPlan.createdAt,
      isActive: existingPlan.isActive
    });
    
    notifyChange();
    console.log('Plan updated successfully:', planId);
  } catch (error) {
    console.error('Error updating workout plan:', error);
    throw error;
  }
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

export const getExercisePR = async (exerciseId) => {
  try {
    const logs = await db.exerciseLogs
      .where('exerciseId')
      .equals(exerciseId)
      .toArray();
    
    if (logs.length === 0) return null;
    
    // Find highest 1RM
    const maxLog = logs.reduce((max, log) => 
      log.oneRm > max.oneRm ? log : max
    );
    
    return {
      weight: maxLog.weight,
      reps: maxLog.reps,
      oneRm: maxLog.oneRm,
      date: maxLog.date
    };
  } catch (error) {
    console.error('Failed to get PR:', error);
    return null;
  }
};

export const getAllExerciseHistory = async () => {
  try {
    const logs = await db.exerciseLogs.toArray();
    
    // Group by exerciseId and find PR for each
    const history = {};
    
    for (const log of logs) {
      if (!history[log.exerciseId]) {
        history[log.exerciseId] = {
          logs: [],
          pr: 0
        };
      }
      
      history[log.exerciseId].logs.push(log);
      
      if (log.oneRm > history[log.exerciseId].pr) {
        history[log.exerciseId].pr = log.oneRm;
      }
    }
    
    return history;
  } catch (error) {
    console.error('Failed to get all exercise history:', error);
    return {};
  }
};

export const clearExercisePR = async (exerciseId) => {
  try {
    await db.exerciseLogs
      .where('exerciseId')
      .equals(exerciseId)
      .delete();
    
    notifyChange();
    console.log(`Cleared all logs for exercise: ${exerciseId}`);
  } catch (error) {
    console.error('Failed to clear exercise PR:', error);
    throw error;
  }
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
      workoutPlans: await db.workoutPlans.toArray(), // Includes rest day info in days array
      exerciseLogs: await db.exerciseLogs.toArray(),
      // NEW: Include Food & Nutrition Data
      foodLogs: await db.foodLogs.toArray(),
      nutritionProfile: await db.nutritionProfile.toArray(),
      waterLogs: await db.waterLogs.toArray(), // NEW
      exportDate: new Date().toISOString(),
      appVersion: '3.2' // Bumped version
    };
    return data;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

export const importData = async (data) => {
  try {
    // Clear existing data first (except settings to preserve user preferences)
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        if (table.name !== 'settings') {
          await table.clear();
        }
      }
    });

    // Import new data using bulkAdd instead of bulkPut
    // This works better with auto-increment primary keys
    const tx = db.transaction('rw', 
      db.activities, 
      db.weeklyStats, 
      db.settings, 
      db.goals, 
      db.favorites, 
      db.todayWorkout, 
      db.workoutPlans, 
      db.exerciseLogs,
      db.foodLogs,
      db.nutritionProfile,
      db.waterLogs, // NEW
      async () => {
        if (data.activities?.length) {
          // Remove id field to let auto-increment handle it
          const activities = data.activities.map(({ id, ...rest }) => rest);
          await db.activities.bulkAdd(activities);
        }
        if (data.weeklyStats?.length) {
          const stats = data.weeklyStats.map(({ id, ...rest }) => rest);
          await db.weeklyStats.bulkAdd(stats);
        }
        if (data.settings?.length) {
          // For settings, use bulkPut to update/merge with existing
          await db.settings.bulkPut(data.settings);
        }
        if (data.goals?.length) {
          const goals = data.goals.map(({ id, ...rest }) => rest);
          await db.goals.bulkAdd(goals);
        }
        if (data.favorites?.length) {
          const favorites = data.favorites.map(({ id, ...rest }) => rest);
          await db.favorites.bulkAdd(favorites);
        }
        if (data.todayWorkout?.length) {
          const workout = data.todayWorkout.map(({ id, ...rest }) => rest);
          await db.todayWorkout.bulkAdd(workout);
        }
        if (data.workoutPlans?.length) {
          const plans = data.workoutPlans.map(({ id, ...rest }) => rest);
          await db.workoutPlans.bulkAdd(plans);
        }
        if (data.exerciseLogs?.length) {
          const logs = data.exerciseLogs.map(({ id, ...rest }) => rest);
          await db.exerciseLogs.bulkAdd(logs);
        }
        // NEW: Import Food & Nutrition
        if (data.foodLogs?.length) {
          const logs = data.foodLogs.map(({ id, ...rest }) => rest);
          await db.foodLogs.bulkAdd(logs);
        }
        if (data.nutritionProfile?.length) {
          const profiles = data.nutritionProfile.map(({ id, ...rest }) => rest);
          await db.nutritionProfile.bulkAdd(profiles);
        }
        if (data.waterLogs?.length) {
          const logs = data.waterLogs.map(({ id, ...rest }) => rest);
          await db.waterLogs.bulkAdd(logs);
        }
      }
    );
    await tx;
    notifyChange();
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