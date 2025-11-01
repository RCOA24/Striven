import { useState, useEffect, useRef } from 'react';

const useStriven = () => {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sensorSupported, setSensorSupported] = useState(true);

  const lastY = useRef(0);
  const lastTimestamp = useRef(0);
  const stepThreshold = 1.2;
  const stepCooldown = 250;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'DeviceMotionEvent' in window || 'Accelerometer' in window;
      setSensorSupported(supported);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        setActiveTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  useEffect(() => {
    const strideLength = 0.762;
    const distanceKm = (steps * strideLength) / 1000;
    setDistance(distanceKm);
    setCalories(steps * 0.04);
  }, [steps]);

  useEffect(() => {
    if (!isTracking || isPaused) return;

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || !acc.y) return;

      const currentTimestamp = Date.now();
      if (currentTimestamp - lastTimestamp.current < stepCooldown) return;

      const deltaY = Math.abs(acc.y - lastY.current);

      if (deltaY > stepThreshold) {
        setSteps(prev => prev + 1);
        lastTimestamp.current = currentTimestamp;
      }

      lastY.current = acc.y;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isTracking, isPaused]);

  const startTracking = () => {
    setIsTracking(true);
    setIsPaused(false);
  };

  const pauseTracking = () => setIsPaused(true);
  const resumeTracking = () => setIsPaused(false);

  const reset = () => {
    setSteps(0);
    setDistance(0);
    setCalories(0);
    setActiveTime(0);
    setIsTracking(false);
    setIsPaused(false);
  };

  const formattedTime = `${Math.floor(activeTime / 3600)}:${String(Math.floor((activeTime % 3600) / 60)).padStart(2, '0')}:${String(activeTime % 60).padStart(2, '0')}`;

  return {
    steps,
    isTracking,
    isPaused,
    distance,
    calories,
    formattedTime,
    sensorSupported,
    startTracking,
    pauseTracking,
    resumeTracking,
    reset,
  };
};

export default useStriven;