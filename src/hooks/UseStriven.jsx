import { useState, useEffect, useRef } from 'react';
import StepDetector from './utils/stepDetection';

const useStriven = () => {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [activeTime, setActiveTime] = useState(0);
  const [sensorSupported, setSensorSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const stepDetectorRef = useRef(null);
  const sensorRef = useRef(null);
  const intervalRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const lastPauseTimeRef = useRef(null);

  // Initialize step detector
  useEffect(() => {
    stepDetectorRef.current = new StepDetector(() => {
      if (isTracking && !isPaused) {
        setSteps(prev => prev + 1);
      }
    });
  }, [isTracking, isPaused]);

  // Check sensor support
  useEffect(() => {
    const checkSupport = async () => {
      if (!('Accelerometer' in window) && !('DeviceMotionEvent' in window)) {
        setSensorSupported(false);
        return;
      }

      // For iOS 13+ devices, check if permission is needed
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          setPermissionGranted(permission === 'granted');
        } catch (error) {
          console.error('Permission error:', error);
          setPermissionGranted(false);
        }
      } else {
        setPermissionGranted(true);
      }
    };

    checkSupport();
  }, []);

  // Request permission (for iOS)
  const requestPermission = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        setPermissionGranted(permission === 'granted');
        return permission === 'granted';
      } catch (error) {
        console.error('Permission denied:', error);
        return false;
      }
    }
    return true;
  };

  // Start tracking
  const startTracking = async () => {
    if (!sensorSupported) {
      alert('Motion sensors are not supported on this device.');
      return;
    }

    // Request permission if needed
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) {
        alert('Motion sensor permission is required.');
        return;
      }
    }

    setIsTracking(true);
    setIsPaused(false);
    setStartTime(Date.now());
    pausedTimeRef.current = 0;

    // Try Generic Sensor API first
    if ('Accelerometer' in window) {
      try {
        sensorRef.current = new Accelerometer({ frequency: 60 });
        
        sensorRef.current.addEventListener('reading', () => {
          stepDetectorRef.current?.processAcceleration(
            sensorRef.current.x,
            sensorRef.current.y,
            sensorRef.current.z
          );
        });

        sensorRef.current.addEventListener('error', (event) => {
          console.error('Sensor error:', event.error);
        });

        sensorRef.current.start();
      } catch (error) {
        console.error('Accelerometer error:', error);
        fallbackToDeviceMotion();
      }
    } else {
      fallbackToDeviceMotion();
    }

    // Start active time counter
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setActiveTime(Date.now() - startTime - pausedTimeRef.current);
      }
    }, 1000);
  };

  // Fallback to DeviceMotionEvent
  const fallbackToDeviceMotion = () => {
    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        stepDetectorRef.current?.processAcceleration(acc.x, acc.y, acc.z);
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    sensorRef.current = { stop: () => window.removeEventListener('devicemotion', handleMotion) };
  };

  // Pause tracking
  const pauseTracking = () => {
    setIsPaused(true);
    lastPauseTimeRef.current = Date.now();
  };

  // Resume tracking
  const resumeTracking = () => {
    if (lastPauseTimeRef.current) {
      pausedTimeRef.current += Date.now() - lastPauseTimeRef.current;
    }
    setIsPaused(false);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    setIsPaused(false);
    
    if (sensorRef.current) {
      sensorRef.current.stop();
      sensorRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Reset all data
  const reset = () => {
    stopTracking();
    setSteps(0);
    setActiveTime(0);
    setStartTime(null);
    pausedTimeRef.current = 0;
    stepDetectorRef.current?.reset();
  };

  // Calculate metrics
  const calculateDistance = (steps, strideLength = 0.762) => {
    // Default stride length is ~2.5 feet (0.762 meters)
    return (steps * strideLength / 1000).toFixed(2); // in kilometers
  };

  const calculateCalories = (steps, weight = 70) => {
    // Rough estimate: 0.04 calories per step per kg of body weight
    return (steps * 0.04 * weight / 70).toFixed(0);
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    steps,
    isTracking,
    isPaused,
    activeTime,
    sensorSupported,
    permissionGranted,
    distance: calculateDistance(steps),
    calories: calculateCalories(steps),
    formattedTime: formatTime(activeTime),
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    reset,
  };
};

export default useStriven;
