import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Geolocation } from '@capacitor/geolocation';
import StepDetector from '../utils/StepDetector';
import { 
  addActivity, 
  getWeeklyStats, 
  updateWeeklyStats,
  db
} from '../utils/db';

// Helper: Calculate distance between two coordinates in km (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const useStrivenTracker = () => {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sensorSupported, setSensorSupported] = useState(true);
  const [locationError, setLocationError] = useState(null);
  
  // Location State
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const watchIdRef = useRef(null);
  const lastGpsPositionRef = useRef(null);
  const usingBrowserWatchRef = useRef(false);
  
  const isNativeCapacitor = useCallback(() => {
    return typeof window !== 'undefined' &&
      window.Capacitor?.getPlatform &&
      window.Capacitor.getPlatform() !== 'web';
  }, []);

  const handlePosition = useCallback(({ latitude, longitude }) => {
    const point = [latitude, longitude];
    if (lastGpsPositionRef.current) {
      const dist = calculateDistance(
        lastGpsPositionRef.current[0], lastGpsPositionRef.current[1],
        latitude, longitude
      );
      if (dist > 0.01) {
        setDistance(prev => prev + dist);
        lastGpsPositionRef.current = point;
        setRoute(prev => [...prev, point]);
      }
    } else {
      lastGpsPositionRef.current = point;
      setRoute(prev => [...prev, point]);
    }
    setCurrentLocation(point);
  }, []);

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

  const STEP_LENGTH_KM = 0.000762;
  const CALORIES_PER_STEP = 0.04;

  const activities = useLiveQuery(
    () => db.activities.orderBy('date').reverse().limit(50).toArray(),
    []
  ) || [];

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadActivities = useCallback(async () => {
    try {
      await db.activities.toArray();
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }, []);

  const loadWeeklyStats = useCallback(async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const recentActivities = activities.filter(activity => 
        new Date(activity.date) >= sevenDaysAgo
      );

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
    } catch (error) {
      console.error('Failed to load weekly stats:', error);
    }
  }, [activities]);

  useEffect(() => {
    if (activities.length > 0) {
      loadWeeklyStats();
    }
  }, [activities, loadWeeklyStats]);

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
        if (window.DeviceMotionEvent) {
          setSensorSupported(true);
        } else {
          setSensorSupported(false);
        }
      }
    };
    checkSensor();
  }, []);

  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking, isPaused]);

  useEffect(() => {
    if (route.length === 0) {
      setDistance(steps * STEP_LENGTH_KM);
    }
    setCalories(steps * CALORIES_PER_STEP);
  }, [steps, route.length]);

  const startBrowserWatch = useCallback(async () => {
    if (!navigator.geolocation) throw new Error('Geolocation API not supported');
    if (!window.isSecureContext) throw new Error('Geolocation requires HTTPS/localhost');

    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(() => resolve(), (err) => reject(err), { enableHighAccuracy: true, timeout: 8000 });
    });

    usingBrowserWatchRef.current = true;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => handlePosition(position.coords),
      (err) => {
        console.warn('Browser geolocation watch error:', err);
        setLocationError(err.message || 'Location error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
  }, [handlePosition]);

  const clearGeoWatch = useCallback(async () => {
    try {
      if (watchIdRef.current !== null) {
        if (usingBrowserWatchRef.current) {
          navigator.geolocation?.clearWatch(watchIdRef.current);
        } else if (isNativeCapacitor()) {
          await Geolocation.clearWatch({ id: watchIdRef.current });
        }
      }
    } catch (e) {
      console.warn('Clear watch failed:', e);
    }
    watchIdRef.current = null;
    usingBrowserWatchRef.current = false;
  }, [isNativeCapacitor]);

  const startNativeWatch = useCallback(async () => {
    if (!isNativeCapacitor()) throw new Error('Native geolocation not available');
    const permissionStatus = await Geolocation.checkPermissions();
    if (permissionStatus.location !== 'granted') await Geolocation.requestPermissions();

    await clearGeoWatch();
    usingBrowserWatchRef.current = false;
    watchIdRef.current = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
      (position, err) => {
        if (err) {
          console.warn('Capacitor location error:', err);
          setLocationError(err.message || 'Location error');
          return;
        }
        if (position?.coords) handlePosition(position.coords);
      }
    );
  }, [clearGeoWatch, handlePosition, isNativeCapacitor]);

  const startTracking = useCallback(async () => {
    try {
      setLocationError(null);
      if (!stepDetectorRef.current) {
        stepDetectorRef.current = new StepDetector((stepCount = 1) => {
          setSteps(prev => prev + stepCount);
        });
      }
      await stepDetectorRef.current.start();

      if (isNativeCapacitor()) {
        await startNativeWatch().catch(async (capErr) => {
          console.warn('Capacitor geolocation unavailable, falling back to browser API:', capErr);
          await startBrowserWatch().catch((browserErr) => {
            console.error('Browser geolocation failed:', browserErr);
            setLocationError(browserErr.message || 'Unable to access location');
          });
        });
      } else {
        await startBrowserWatch().catch((browserErr) => {
          console.error('Browser geolocation failed:', browserErr);
          setLocationError(browserErr.message || 'Unable to access location');
        });
      }

      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setIsTracking(true);
      setIsPaused(false);
      console.log('Tracking started successfully');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      alert('Failed to start step tracking. Please check sensor permissions.');
    }
  }, [isNativeCapacitor, startNativeWatch, startBrowserWatch]);

  const pauseTracking = useCallback(async () => {
    if (stepDetectorRef.current) {
      stepDetectorRef.current.stop();
    }
    await clearGeoWatch();
    pausedTimeRef.current += Date.now() - startTimeRef.current - duration * 1000;
    setIsPaused(true);
    console.log('Tracking paused');
  }, [clearGeoWatch, duration]);

  const resumeTracking = useCallback(async () => {
    try {
      if (stepDetectorRef.current) await stepDetectorRef.current.start();

      if (isNativeCapacitor()) {
        await startNativeWatch().catch((capErr) => {
          console.warn('Capacitor geolocation resume failed, fallback to browser:', capErr);
          return startBrowserWatch();
        });
      } else {
        await startBrowserWatch();
      }

      startTimeRef.current = Date.now();
      setIsPaused(false);
      console.log('Tracking resumed');
    } catch (error) {
      console.error('Failed to resume tracking:', error);
    }
  }, [isNativeCapacitor, startNativeWatch, startBrowserWatch]);

  const reset = useCallback(async () => {
    if (stepDetectorRef.current) {
      stepDetectorRef.current.stop();
      stepDetectorRef.current.reset();
    }
    await clearGeoWatch();
    setRoute([]);
    setCurrentLocation(null);
    lastGpsPositionRef.current = null;

    setSteps(0);
    setDistance(0);
    setCalories(0);
    setDuration(0);
    setIsTracking(false);
    setIsPaused(false);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    console.log('Tracking reset');
  }, [clearGeoWatch]);

  const stopAndSave = useCallback(async () => {
    try {
      if (stepDetectorRef.current) {
        stepDetectorRef.current.stop();
      }
      await clearGeoWatch();

      if (steps === 0) {
        console.log('No steps to save');
        reset();
        return null;
      }

      let startLoc = null;
      let endLoc = null;

      if (route && route.length > 0) {
        try {
           const getAddress = async (lat, lng) => {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`);
              const data = await res.json();
              const addr = data.address;
              return addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || "";
           };
           
           const [s, e] = await Promise.all([
             getAddress(route[0][0], route[0][1]),
             getAddress(route[route.length-1][0], route[route.length-1][1])
           ]);
           
           startLoc = s;
           endLoc = e;
        } catch (error) {
          console.warn("Failed to fetch location names:", error);
        }
      }

      const activity = {
        steps,
        distance: parseFloat(distance.toFixed(2)),
        calories: Math.round(calories),
        duration,
        date: new Date().toISOString(),
        route: route, 
        hasGPS: route && route.length > 0,
        startLocation: startLoc,
        endLocation: endLoc
      };

      const activityId = await addActivity(activity);
      console.log('Activity saved with ID:', activityId);
      
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

      setSteps(0);
      setDistance(0);
      setCalories(0);
      setDuration(0);
      setIsTracking(false);
      setIsPaused(false);
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
      setRoute([]); 
      setCurrentLocation(null); 
      lastGpsPositionRef.current = null;

      return activity;
    } catch (error) {
      console.error('Failed to save activity:', error);
      throw error;
    }
  }, [steps, distance, calories, duration, reset, route, clearGeoWatch]);

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
    currentLocation,
    route,
    locationError,
    startTracking,
    pauseTracking,
    resumeTracking,
    reset,
    stopAndSave,
    refreshActivities: loadActivities,
  };
};

export default useStrivenTracker;
