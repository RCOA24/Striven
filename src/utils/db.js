// src/utils/db.js
import Dexie from "dexie";

export const db = new Dexie("StrivenDB");

db.version(1).stores({
//Activities table to store user workout sessions 
  activities: '++id, date, steps, distance, calories, duration, timestamp',

  //Weekly Stats table - aggregated statistics
  weeklyStats: '++id, weekStart, totalSteps, totalDistance, totalCalories, totalDuration',

  settings: '++id, key, value',
  
  goals: '++id, type, target, current, date, completed'
});

//Helper functions for common DB operations

//Activities
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
    return await db.activities
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('Failed to get activities:', error);
    return [];
  }
};

export const getActivitiesByDateRange = async (startDate, endDate) => {
  try {
    return await db.activities
      .where('timestamp')
      .between(startDate.getTime(), endDate.getTime())
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

// Weekly Stats
export const updateWeeklyStats = async (weekStart, stats) => {
  try {
    const existing = await db.weeklyStats
      .where('weekStart')
      .equals(weekStart)
      .first();

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
    return await db.weeklyStats
      .where('weekStart')
      .equals(weekStart)
      .first();
  } catch (error) {
    console.error('Failed to get weekly stats:', error);
    return null;
  }
};

export const getAllWeeklyStats = async () => {
  try {
    return await db.weeklyStats
      .orderBy('weekStart')
      .reverse()
      .toArray();
  } catch (error) {
    console.error('Failed to get all weekly stats:', error);
    return [];
  }
};

// Settings
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

// Goals
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

// Utility functions
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
    return {
      totalSteps: 0,
      totalDistance: 0,
      totalCalories: 0,
      totalDuration: 0,
      totalActivities: 0
    };
  }
};

export const exportData = async () => {
  try {
    const activities = await db.activities.toArray();
    const weeklyStats = await db.weeklyStats.toArray();
    const settings = await db.settings.toArray();
    const goals = await db.goals.toArray();
    
    return {
      activities,
      weeklyStats,
      settings,
      goals,
      exportDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
};

export const importData = async (data) => {
  try {
    if (data.activities) {
      await db.activities.bulkAdd(data.activities);
    }
    if (data.weeklyStats) {
      await db.weeklyStats.bulkAdd(data.weeklyStats);
    }
    if (data.settings) {
      await db.settings.bulkAdd(data.settings);
    }
    if (data.goals) {
      await db.goals.bulkAdd(data.goals);
    }
  } catch (error) {
    console.error('Failed to import data:', error);
    throw error;
  }
};

export const clearAllData = async () => {
  try {
    await db.activities.clear();
    await db.weeklyStats.clear();
    await db.goals.clear();
    // Keep settings intact
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw error;
  }
};

export default db;