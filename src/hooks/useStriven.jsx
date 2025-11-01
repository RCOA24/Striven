import { useState, useEffect, useRef, useCallback } from 'react';
import StepDetector from '../utils/StepDetector';

const useStriven = () => {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sensorSupported, setSensorSupported] = useState(false);
  const [sensorError, setSensorError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({
    totalSteps: 0,
    totalDistance: 0,
    totalCalories: 0,
    activeDays: 0
  });

  const stepDetectorRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const sessionStartRef = useRef(null);
  const accelerometerRef = useRef(null);
  const motionHandlerRef = useRef(null);
  
  // Use refs for state that needs to be accessed in event handlers
  const isTrackingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Configuration
  const STEP_LENGTH = 0.762;
  const CALORIES_PER_STEP = 0.04;
  const SENSOR_FREQUENCY = 50;

  // Sync refs with state
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Load data on mount (use state instead of localStorage)
  useEffect(() => {
    const loadData = () => {
      try {
        // Initialize with empty data - localStorage not used
        setActivities([]);
        setWeeklyStats({
          totalSteps: 0,
          totalDistance: 0,
          totalCalories: 0,
          activeDays: 0
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Calculate weekly stats from activities
  const calculateWeeklyStats = useCallback((activityList) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyActivities = activityList.filter(activity => 
      new Date(activity.timestamp) >= oneWeekAgo
    );

    const totalSteps = weeklyActivities.reduce((sum, a) => sum + a.steps, 0);
    const totalDistance = weeklyActivities.reduce((sum, a) => sum + a.distance, 0);
    const totalCalories = weeklyActivities.reduce((sum, a) => sum + a.calories, 0);
    
    const uniqueDays = new Set(
      weeklyActivities.map(a => new Date(a.timestamp).toDateString())
    );

    return {
      totalSteps,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalCalories: Math.round(totalCalories),
      activeDays: uniqueDays.size
    };
  }, []);

  // Save completed session
  const saveActivity = useCallback((sessionData) => {
    const newActivity = {
      id: Date.now(),
      timestamp: sessionStartRef.current || Date.now(),
      date: new Date(sessionStartRef.current || Date.now()).toLocaleString(),
      steps: sessionData.steps,
      distance: parseFloat(sessionData.distance.toFixed(2)),
      calories: Math.round(sessionData.calories),
      duration: sessionData.duration,
      type: 'walking'
    };

    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);

    const newWeeklyStats = calculateWeeklyStats(updatedActivities);
    setWeeklyStats(newWeeklyStats);

    return newActivity;
  }, [activities, calculateWeeklyStats]);

  // Check sensor support
  useEffect(() => {
    const checkSensorSupport = async () => {
      setSensorError(null);
      
      // Check for Accelerometer API
      if ('Accelerometer' in window) {
        try {
          // Try to query permissions
          if ('permissions' in navigator) {
            const result = await navigator.permissions.query({ name: 'accelerometer' });
            console.log('Accelerometer permission:', result.state);
          }
          setSensorSupported(true);
          console.log('Accelerometer API supported');
          return;
        } catch (error) {
          console.log('Accelerometer permission check failed:', error);
        }
      }
      
      // Check for DeviceMotion
      if ('DeviceMotionEvent' in window) {
        setSensorSupported(true);
        console.log('DeviceMotion API supported');
        return;
      }
      
      setSensorSupported(false);
      setSensorError('Motion sensors not supported on this device');
      console.error('No motion sensor APIs available');
    };

    checkSensorSupport();
  }, []);

  // Handle step detection
  const handleStep = useCallback(() => {
    setSteps(prev => {
      const newSteps = prev + 1;
      
      const newDistance = (newSteps * STEP_LENGTH) / 1000;
      setDistance(newDistance);
      
      const newCalories = newSteps * CALORIES_PER_STEP;
      setCalories(newCalories);
      
      return newSteps;
    });
  }, []);

  // Initialize step detector
  useEffect(() => {
    if (sensorSupported && !stepDetectorRef.current) {
      stepDetectorRef.current = new StepDetector(handleStep);
      console.log('StepDetector initialized');
    }
  }, [sensorSupported, handleStep]);

  // Timer for active time tracking
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
          setActiveTime(Math.floor(elapsed / 1000));
        }
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

  // Request motion permissions (especially for iOS)
  const requestMotionPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceMotionEvent.requestPermission();
        if (permissionState !== 'granted') {
          throw new Error('Motion permission denied');
        }
        console.log('Motion permission granted');
        return true;
      } catch (error) {
        console.error('Motion permission error:', error);
        setSensorError('Motion permission denied. Please allow motion access in your browser settings.');
        return false;
      }
    }
    return true; // No permission needed on non-iOS devices
  }, []);

  // Start tracking with Accelerometer API
  const startAccelerometer = useCallback(() => {
    try {
      const accelerometer = new window.Accelerometer({ frequency: SENSOR_FREQUENCY });
      
      accelerometer.addEventListener('reading', () => {
        // Use refs to get current state
        if (isTrackingRef.current && !isPausedRef.current && stepDetectorRef.current) {
          stepDetectorRef.current.processAcceleration(
            accelerometer.x,
            accelerometer.y,
            accelerometer.z
          );
        }
      });

      accelerometer.addEventListener('error', (event) => {
        console.error('Accelerometer error:', event.error);
        setSensorError(`Accelerometer error: ${event.error.message}`);
        // Try DeviceMotion fallback
        startDeviceMotion();
      });

      accelerometer.start();
      accelerometerRef.current = accelerometer;
      console.log('Accelerometer started');
      return true;
    } catch (error) {
      console.error('Accelerometer initialization error:', error);
      setSensorError(`Accelerometer failed: ${error.message}`);
      return false;
    }
  }, []);

  // DeviceMotion fallback
  const startDeviceMotion = useCallback(() => {
    const handleMotion = (event) => {
      // Use refs to get current state
      if (!isTrackingRef.current || isPausedRef.current || !stepDetectorRef.current) {
        return;
      }

      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        stepDetectorRef.current.processAcceleration(acc.x, acc.y, acc.z);
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    motionHandlerRef.current = handleMotion;
    console.log('DeviceMotion listener added');
  }, []);

  // Stop all sensors
  const stopAllSensors = useCallback(() => {
    if (accelerometerRef.current) {
      try {
        accelerometerRef.current.stop();
        console.log('Accelerometer stopped');
      } catch (error) {
        console.error('Error stopping accelerometer:', error);
      }
      accelerometerRef.current = null;
    }
    
    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
      console.log('DeviceMotion listener removed');
      motionHandlerRef.current = null;
    }
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!sensorSupported || !stepDetectorRef.current) {
      setSensorError('Sensors not supported or not initialized');
      return;
    }

    setSensorError(null);
    console.log('Starting tracking...');

    // Request permission first (important for iOS)
    const hasPermission = await requestMotionPermission();
    if (!hasPermission) {
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    sessionStartRef.current = Date.now();
    pausedTimeRef.current = 0;

    // Try Accelerometer API first
    if ('Accelerometer' in window) {
      const started = startAccelerometer();
      if (!started) {
        // Fallback to DeviceMotion
        startDeviceMotion();
      }
    } else {
      // Use DeviceMotion directly
      startDeviceMotion();
    }

    console.log('Tracking started');
  }, [sensorSupported, requestMotionPermission, startAccelerometer, startDeviceMotion]);

  // Pause tracking
  const pauseTracking = useCallback(() => {
    console.log('Pausing tracking...');
    setIsPaused(true);
    
    if (startTimeRef.current) {
      pausedTimeRef.current += Date.now() - startTimeRef.current;
    }

    stopAllSensors();
  }, [stopAllSensors]);

  // Resume tracking
  const resumeTracking = useCallback(async () => {
    console.log('Resuming tracking...');
    setIsPaused(false);
    startTimeRef.current = Date.now();
    
    // Restart sensors
    if ('Accelerometer' in window) {
      const started = startAccelerometer();
      if (!started) {
        startDeviceMotion();
      }
    } else {
      startDeviceMotion();
    }
  }, [startAccelerometer, startDeviceMotion]);

  // Stop and save session
  const stopAndSave = useCallback(() => {
    console.log('Stopping and saving session...');
    
    if (steps > 0) {
      const sessionData = {
        steps,
        distance,
        calories,
        duration: formatTime(activeTime)
      };
      
      const savedActivity = saveActivity(sessionData);
      console.log('Activity saved:', savedActivity);
    }

    stopAllSensors();

    setIsTracking(false);
    setIsPaused(false);
    setSteps(0);
    setDistance(0);
    setCalories(0);
    setActiveTime(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    sessionStartRef.current = null;

    if (stepDetectorRef.current) {
      stepDetectorRef.current.reset();
    }
  }, [steps, distance, calories, activeTime, saveActivity, stopAllSensors]);

  // Reset without saving
  const reset = useCallback(() => {
    console.log('Resetting...');
    
    stopAllSensors();

    setIsTracking(false);
    setIsPaused(false);
    setSteps(0);
    setDistance(0);
    setCalories(0);
    setActiveTime(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    sessionStartRef.current = null;

    if (stepDetectorRef.current) {
      stepDetectorRef.current.reset();
    }
  }, [stopAllSensors]);

  // Format active time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      stopAllSensors();
    };
  }, [stopAllSensors]);

  return {
    steps,
    isTracking,
    isPaused,
    distance,
    calories,
    activeTime,
    formattedTime: formatTime(activeTime),
    sensorSupported,
    sensorError,
    activities,
    weeklyStats,
    startTracking,
    pauseTracking,
    resumeTracking,
    reset,
    stopAndSave,
  };
};

export default useStriven;