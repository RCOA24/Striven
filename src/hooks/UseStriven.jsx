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

  const stepDetectorRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  // Configuration
  const STEP_LENGTH = 0.762; // Average step length in meters (2.5 feet)
  const CALORIES_PER_STEP = 0.04; // Average calories burned per step
  const SENSOR_FREQUENCY = 50; // Hz

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
      
      // Optional: Set activity mode
      // stepDetectorRef.current.setActivityMode('walking');
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
          // Fallback to DeviceMotion
          startDeviceMotion();
        });

        accelerometer.start();
        
        // Store reference for cleanup
        stepDetectorRef.current.accelerometer = accelerometer;
      } catch (error) {
        console.error('Accelerometer initialization error:', error);
        startDeviceMotion();
      }
    } else {
      // Fallback to DeviceMotion API (iOS and older browsers)
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

    // Request permission on iOS 13+
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

    // Store reference for cleanup
    stepDetectorRef.current.deviceMotionHandler = handleMotion;
  }, [isTracking, isPaused]);

  // Pause tracking
  const pauseTracking = useCallback(() => {
    setIsPaused(true);
    
    if (startTimeRef.current) {
      pausedTimeRef.current += Date.now() - startTimeRef.current;
    }

    // Stop sensors
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
    
    // Restart sensors
    if (stepDetectorRef.current?.accelerometer) {
      stepDetectorRef.current.accelerometer.start();
    } else {
      startDeviceMotion();
    }
  }, [startDeviceMotion]);

  // Reset everything
  const reset = useCallback(() => {
    setIsTracking(false);
    setIsPaused(false);
    setSteps(0);
    setDistance(0);
    setCalories(0);
    setActiveTime(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;

    // Stop sensors
    if (stepDetectorRef.current?.accelerometer) {
      stepDetectorRef.current.accelerometer.stop();
    }
    
    if (stepDetectorRef.current?.deviceMotionHandler) {
      window.removeEventListener('devicemotion', stepDetectorRef.current.deviceMotionHandler);
    }

    // Reset step detector
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
    startTracking,
    pauseTracking,
    resumeTracking,
    reset,
  };
};

export default useStriven;