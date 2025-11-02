// src/hooks/useStriven.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import StepDetector from '../utils/StepDetector';
import { 
  addActivity, 
  getWeeklyStats, 
  updateWeeklyStats,
  db
} from '../utils/db';

const useStriven = () => {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sensorSupported, setSensorSupported] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    totalSteps: 0,
    totalDistance: 0,
    totalCalories: 0,
    totalDuration: 0,
    days: []
  });

  const stepDetectorRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const pausedTimeRef = useRef(0);

  // Constants for calculations
  const STEP_LENGTH_KM = 0.000762; // Average step length in km
  const CALORIES_PER_STEP = 0.04; // Average calories per step

  // Real-time activities using useLiveQuery - automatically updates when database changes!
  const activities = useLiveQuery(
    () => db.activities.orderBy('date').reverse().limit(50).toArray(),
    []
  ) || [];

  // Format time helper
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load activities manually (for force refresh if needed)
  const loadActivities = useCallback(async () => {
    try {
      // useLiveQuery handles this automatically, but we keep this for compatibility
      await db.activities.toArray();
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }, []);

  // Load weekly stats from Dexie.js
  const loadWeeklyStats = useCallback(async () => {
    try {
      // Get last 7 days of activities
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const recentActivities = activities.filter(activity => 
        new Date(activity.date) >= sevenDaysAgo
      );

      // Calculate daily stats for the week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const dayActivities = recentActivities.filter(activity => {
          const activityDate = new Date(activity.date);
          return activityDate.toDateString() === date.toDateString();
        });

        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          steps: dayActivities.reduce((sum, a) => sum + (a.steps || 0), 0),
          distance: dayActivities.reduce((sum, a) => sum + (a.distance || 0), 0),
          calories: dayActivities.reduce((sum, a) => sum + (a.calories || 0), 0),
          date: date.toISOString(),
          hasActivity: dayActivities.length > 0
        };
      });

      // Calculate active days (days with at least one activity)
      const activeDays = days.filter(d => d.hasActivity).length;

      const weekStats = {
        totalSteps: days.reduce((sum, d) => sum + d.steps, 0),
        totalDistance: days.reduce((sum, d) => sum + d.distance, 0),
        totalCalories: days.reduce((sum, d) => sum + d.calories, 0),
        totalDuration: recentActivities.reduce((sum, a) => sum + (a.duration || 0), 0),
        activeDays: activeDays,
        days
      };

      setWeeklyStats(weekStats);
      console.log('Weekly stats loaded:', weekStats);
    } catch (error) {
      console.error('Failed to load weekly stats:', error);
    }
  }, [activities]);

  // Update weekly stats when activities change
  useEffect(() => {
    if (activities.length > 0) {
      loadWeeklyStats();
    }
  }, [activities, loadWeeklyStats]);

  // Check sensor support
  useEffect(() => {
    const checkSensor = async () => {
      try {
        if ('Accelerometer' in window) {
          const sensor = new window.Accelerometer({ frequency: 60 });
          sensor.start();
          sensor.stop();
          setSensorSupported(true);
        } else if (window.DeviceMotionEvent) {
          setSensorSupported(true);
        } else {
          setSensorSupported(false);
        }
      } catch (error) {
        // Still might work with DeviceMotion
        if (window.DeviceMotionEvent) {
          setSensorSupported(true);
        } else {
          setSensorSupported(false);
        }
      }
    };

    checkSensor();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTracking, isPaused]);

  // Update metrics when steps change
  useEffect(() => {
    setDistance(steps * STEP_LENGTH_KM);
    setCalories(steps * CALORIES_PER_STEP);
  }, [steps]);

  const startTracking = useCallback(async () => {
    try {
      if (!stepDetectorRef.current) {
        // Create step detector with callback that increments steps
        stepDetectorRef.current = new StepDetector((stepCount = 1) => {
          setSteps(prev => prev + stepCount);
        });
      }

      await stepDetectorRef.current.start();
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setIsTracking(true);
      setIsPaused(false);
      console.log('Tracking started successfully');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      alert('Failed to start step tracking. Please check sensor permissions.');
    }
  }, []);

  const pauseTracking = useCallback(() => {
    if (stepDetectorRef.current) {
      stepDetectorRef.current.stop();
    }
    
    // Track paused time
    pausedTimeRef.current += Date.now() - startTimeRef.current - duration * 1000;
    
    setIsPaused(true);
    console.log('Tracking paused');
  }, [duration]);

  const resumeTracking = useCallback(async () => {
    try {
      if (stepDetectorRef.current) {
        await stepDetectorRef.current.start();
      }
      
      // Resume timer from where it was paused
      startTimeRef.current = Date.now();
      
      setIsPaused(false);
      console.log('Tracking resumed');
    } catch (error) {
      console.error('Failed to resume tracking:', error);
    }
  }, []);

  const reset = useCallback(() => {
    if (stepDetectorRef.current) {
      stepDetectorRef.current.stop();
      stepDetectorRef.current.reset();
    }
    setSteps(0);
    setDistance(0);
    setCalories(0);
    setDuration(0);
    setIsTracking(false);
    setIsPaused(false);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    console.log('Tracking reset');
  }, []);

  const stopAndSave = useCallback(async () => {
    try {
      if (stepDetectorRef.current) {
        stepDetectorRef.current.stop();
      }

      // Only save if there are steps
      if (steps === 0) {
        console.log('No steps to save');
        reset();
        return null;
      }

      // Save activity to Dexie.js
      const activity = {
        steps,
        distance: parseFloat(distance.toFixed(2)),
        calories: Math.round(calories),
        duration,
        date: new Date().toISOString()
      };

      const activityId = await addActivity(activity);
      console.log('Activity saved with ID:', activityId);
      
      // useLiveQuery will automatically update the activities list!

      // Update weekly stats
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const weekStart = startOfWeek.toISOString();

      const currentWeekStats = await getWeeklyStats(weekStart);
      const newWeekStats = {
        totalSteps: (currentWeekStats?.totalSteps || 0) + steps,
        totalDistance: (currentWeekStats?.totalDistance || 0) + distance,
        totalCalories: (currentWeekStats?.totalCalories || 0) + calories,
        totalDuration: (currentWeekStats?.totalDuration || 0) + duration
      };

      await updateWeeklyStats(weekStart, newWeekStats);

      // Reset state
      setSteps(0);
      setDistance(0);
      setCalories(0);
      setDuration(0);
      setIsTracking(false);
      setIsPaused(false);
      startTimeRef.current = null;
      pausedTimeRef.current = 0;

      return activity;
    } catch (error) {
      console.error('Failed to save activity:', error);
      throw error;
    }
  }, [steps, distance, calories, duration, reset]);

  return {
    steps,
    isTracking,
    isPaused,
    distance,
    calories,
    duration,
    formattedTime: formatTime(duration),
    sensorSupported,
    activities,
    weeklyStats,
    startTracking,
    pauseTracking,
    resumeTracking,
    reset,
    stopAndSave,
    refreshActivities: loadActivities,
  };
};

export default useStriven;