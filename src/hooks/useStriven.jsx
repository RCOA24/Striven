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

  // Configuration
  const STEP_LENGTH = 0.762; // Average step length in meters (2.5 feet)
  const CALORIES_PER_STEP = 0.04; // Average calories burned per step
  const SENSOR_FREQUENCY = 50; // Hz

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedActivities = localStorage.getItem('striven_activities');
        if (savedActivities) {
          setActivities(JSON.parse(savedActivities));
        }

        const savedStats = localStorage.getItem('striven_weekly_stats');
        if (savedStats) {
          setWeeklyStats(JSON.parse(savedStats));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('striven_activities', JSON.stringify(activities));
    }
  }, [activities]);

  // Save weekly stats to localStorage
  useEffect(() => {
    localStorage.setItem('striven_weekly_stats', JSON.stringify(weeklyStats));
  }, [weeklyStats]);

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
    
    // Count unique days with activities
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

    // Update weekly stats
    const newWeeklyStats = calculateWeeklyStats(updatedActivities);
    setWeeklyStats(newWeeklyStats);

    return newActivity;
  }, [activities, calculateWeeklyStats]);

  // Check sensor support
  useEffect(() => {
    const checkSensorSupport = () => {
      if ('Accelerometer' in window || 'DeviceMotionEvent' in window) {
        setSensorSupported(true);
      } else {
        setSensorSupported(false);
      }
    };

    checkSensorSupport();
  }, []);

  // Handle step detection
  const handleStep = useCallback(() => {
    setSteps(prev => {
      const newSteps = prev + 1;
      
      // Update distance (in kilometers)
      const newDistance = (newSteps * STEP_LENGTH) / 1000;
      setDistance(newDistance);
      
      // Update calories
      const newCalories = newSteps * CALORIES_PER_STEP;
      setCalories(newCalories);
      
      return newSteps;
    });
  }, []);

  // Initialize step detector
  useEffect(() => {
    if (sensorSupported && !stepDetectorRef.current) {
      stepDetectorRef.current = new StepDetector(handleStep);
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

  // Start tracking
  const startTracking = useCallback(() => {
    if (!sensorSupported || !stepDetectorRef.current) return;

    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    sessionStartRef.current = Date.now();
    pausedTimeRef.current = 0;

    // Try to use Accelerometer API (modern browsers)
    if ('Accelerometer' in window) {
      try {
        const accelerometer = new window.Accelerometer({ frequency: SENSOR_FREQUENCY });
        
        accelerometer.addEventListener('reading', () => {
          if (isTracking && !isPaused) {
            stepDetectorRef.current.processAcceleration(
              accelerometer.x,
              accelerometer.y,
              accelerometer.z
            );
          }
        });

        accelerometer.addEventListener('error', (event) => {
          console.error('Accelerometer error:', event.error.name);
          startDeviceMotion();
        });

        accelerometer.start();
        stepDetectorRef.current.accelerometer = accelerometer;
      } catch (error) {
        console.error('Accelerometer initialization error:', error);
        startDeviceMotion();
      }
    } else {
      startDeviceMotion();
    }
  }, [sensorSupported, isTracking, isPaused]);

  // DeviceMotion fallback for iOS
  const startDeviceMotion = useCallback(() => {
    const handleMotion = (event) => {
      if (!isTracking || isPaused || !stepDetectorRef.current) return;

      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        stepDetectorRef.current.processAcceleration(acc.x, acc.y, acc.z);
      }
    };

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          } else {
            console.error('Motion permission denied');
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    stepDetectorRef.current.deviceMotionHandler = handleMotion;
  }, [isTracking, isPaused]);

  // Pause tracking
  const pauseTracking = useCallback(() => {
    setIsPaused(true);
    
    if (startTimeRef.current) {
      pausedTimeRef.current += Date.now() - startTimeRef.current;
    }

    if (stepDetectorRef.current?.accelerometer) {
      stepDetectorRef.current.accelerometer.stop();
    }
    
    if (stepDetectorRef.current?.deviceMotionHandler) {
      window.removeEventListener('devicemotion', stepDetectorRef.current.deviceMotionHandler);
    }
  }, []);

  // Resume tracking
  const resumeTracking = useCallback(() => {
    setIsPaused(false);
    startTimeRef.current = Date.now();
    
    if (stepDetectorRef.current?.accelerometer) {
      stepDetectorRef.current.accelerometer.start();
    } else {
      startDeviceMotion();
    }
  }, [startDeviceMotion]);

  // Stop and save session
  const stopAndSave = useCallback(() => {
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

    // Stop sensors
    if (stepDetectorRef.current?.accelerometer) {
      stepDetectorRef.current.accelerometer.stop();
    }
    
    if (stepDetectorRef.current?.deviceMotionHandler) {
      window.removeEventListener('devicemotion', stepDetectorRef.current.deviceMotionHandler);
    }

    // Reset tracking state
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
  }, [steps, distance, calories, activeTime, saveActivity]);

  // Reset without saving
  const reset = useCallback(() => {
    setIsTracking(false);
    setIsPaused(false);
    setSteps(0);
    setDistance(0);
    setCalories(0);
    setActiveTime(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    sessionStartRef.current = null;

    if (stepDetectorRef.current?.accelerometer) {
      stepDetectorRef.current.accelerometer.stop();
    }
    
    if (stepDetectorRef.current?.deviceMotionHandler) {
      window.removeEventListener('devicemotion', stepDetectorRef.current.deviceMotionHandler);
    }

    if (stepDetectorRef.current) {
      stepDetectorRef.current.reset();
    }
  }, []);

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
      
      if (stepDetectorRef.current?.accelerometer) {
        stepDetectorRef.current.accelerometer.stop();
      }
      
      if (stepDetectorRef.current?.deviceMotionHandler) {
        window.removeEventListener('devicemotion', stepDetectorRef.current.deviceMotionHandler);
      }
    };
  }, []);

  return {
    steps,
    isTracking,
    isPaused,
    distance,
    calories,
    activeTime,
    formattedTime: formatTime(activeTime),
    sensorSupported,
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