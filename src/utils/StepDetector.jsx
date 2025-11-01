class StepDetector {
  constructor(onStep, threshold = 12) {
    this.onStep = onStep;
    this.threshold = threshold;
    this.lastStepTime = 0;
    this.stepTimeout = 250; // Minimum time between steps in ms (faster for running)
    this.maxStepTimeout = 2000; // Maximum time between steps (slower for walking)
    this.accelerationHistory = [];
    this.maxHistoryLength = 10;
    
    // Advanced filtering
    this.baselineAcceleration = 9.81; // Earth's gravity
    this.peakThreshold = this.threshold;
    this.valleyThreshold = -this.threshold;
    
    // Step validation
    this.lastMagnitudes = [];
    this.isWalking = false;
    this.consecutivePeaks = 0;
    
    // Calibration
    this.calibrationSamples = [];
    this.isCalibrated = false;
    this.calibrationCount = 0;
    this.maxCalibrationSamples = 50;
    
    // FIXED: Add idle tracking
    this.lastProcessTime = 0;
  }

  // Auto-calibration for device-specific sensitivity
  calibrate(x, y, z) {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    this.calibrationSamples.push(magnitude);
    this.calibrationCount++;

    if (this.calibrationCount >= this.maxCalibrationSamples) {
      const avg = this.calibrationSamples.reduce((a, b) => a + b, 0) / this.calibrationSamples.length;
      const variance = this.calibrationSamples.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.calibrationSamples.length;
      const stdDev = Math.sqrt(variance);
      
      // Adjust threshold based on device characteristics
      this.baselineAcceleration = avg;
      this.threshold = Math.max(1.5, stdDev * 2);
      this.isCalibrated = true;
      
      console.log('StepDetector calibrated:', { baseline: avg.toFixed(2), threshold: this.threshold.toFixed(2) });
    }
  }

  // Apply low-pass filter to reduce noise
  lowPassFilter(current, previous, alpha = 0.8) {
    return previous + alpha * (current - previous);
  }

  // FIXED: Detect if motion pattern matches walking/running - more lenient
  isValidStepPattern() {
    if (this.accelerationHistory.length < 5) return true; // Allow if not enough history yet
    
    const recent = this.accelerationHistory.slice(-5);
    const variations = [];
    
    for (let i = 1; i < recent.length; i++) {
      variations.push(Math.abs(recent[i] - recent[i - 1]));
    }
    
    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
    
    // Valid steps have consistent variation (not random noise or no movement)
    // Made more lenient: 0.3 (was 0.5) to 10 (was 8)
    return avgVariation > 0.3 && avgVariation < 10;
  }

  processAcceleration(x, y, z) {
    const now = Date.now();
    
    // FIXED: Clear history if device was idle (no processing for a while)
    if (this.lastProcessTime > 0 && now - this.lastProcessTime > this.maxStepTimeout) {
      console.log('Idle period detected, clearing acceleration history for fresh detection');
      this.accelerationHistory = [];
    }
    this.lastProcessTime = now;
    
    // Auto-calibrate on first samples
    if (!this.isCalibrated && this.calibrationCount < this.maxCalibrationSamples) {
      this.calibrate(x, y, z);
      return;
    }

    // Calculate magnitude (total acceleration)
    const rawMagnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Remove gravity baseline to get motion component
    const magnitude = Math.abs(rawMagnitude - this.baselineAcceleration);
    
    // Apply low-pass filter if we have previous data
    const filteredMagnitude = this.accelerationHistory.length > 0
      ? this.lowPassFilter(magnitude, this.accelerationHistory[this.accelerationHistory.length - 1])
      : magnitude;

    // Add to history
    this.accelerationHistory.push(filteredMagnitude);
    if (this.accelerationHistory.length > this.maxHistoryLength) {
      this.accelerationHistory.shift();
    }

    // Need at least 4 data points to detect a step
    if (this.accelerationHistory.length < 4) return;

    // Get recent values for peak detection
    const len = this.accelerationHistory.length;
    const current = this.accelerationHistory[len - 1];
    const previous = this.accelerationHistory[len - 2];
    const beforePrevious = this.accelerationHistory[len - 3];
    const beforeBeforePrevious = this.accelerationHistory[len - 4];

    // Detect peak (step) - previous value is higher than surrounding values
    const isPeak = previous > current && 
                   previous > beforePrevious && 
                   previous > beforeBeforePrevious &&
                   previous > this.threshold;

    if (isPeak) {
      const timeSinceLastStep = now - this.lastStepTime;
      
      // FIXED: More lenient timing for first step or after idle
      const isFirstStep = this.lastStepTime === 0;
      const isAfterIdle = !this.isWalking;
      
      // Validate timing (not too fast, not too slow)
      const isValidTiming = timeSinceLastStep > this.stepTimeout && 
                           (timeSinceLastStep < this.maxStepTimeout || isFirstStep || isAfterIdle);
      
      // Validate motion pattern
      const isValidPattern = this.isValidStepPattern();
      
      if (isValidTiming && isValidPattern) {
        this.lastStepTime = now;
        this.consecutivePeaks++;
        this.isWalking = true;
        this.onStep();
        console.log(`Step detected! Mag: ${previous.toFixed(2)}, TimeSince: ${timeSinceLastStep}ms, Walking: ${this.isWalking}`);
      } else {
        // Debug why step was rejected
        if (!isValidTiming) {
          console.log(`Step rejected: timing (${timeSinceLastStep}ms)`);
        }
        if (!isValidPattern) {
          console.log(`Step rejected: pattern validation failed`);
        }
      }
    }

    // Reset walking state if no steps for a while
    if (now - this.lastStepTime > this.maxStepTimeout && this.isWalking) {
      console.log('Walking state reset due to inactivity');
      this.isWalking = false;
      this.consecutivePeaks = 0;
      // FIXED: Don't clear history here - it's cleared at start of processAcceleration
    }
  }

  // Adjust sensitivity for different activities
  setActivityMode(mode) {
    switch (mode) {
      case 'walking':
        this.threshold = 1.5;
        this.stepTimeout = 400;
        this.maxStepTimeout = 2000;
        break;
      case 'running':
        this.threshold = 2.5;
        this.stepTimeout = 200;
        this.maxStepTimeout = 1000;
        break;
      case 'hiking':
        this.threshold = 2.0;
        this.stepTimeout = 500;
        this.maxStepTimeout = 3000;
        break;
      default:
        this.threshold = 1.8;
        this.stepTimeout = 250;
        this.maxStepTimeout = 2000;
    }
    
  }

  // Get current detection statistics
  getStats() {
    return {
      isCalibrated: this.isCalibrated,
      threshold: this.threshold.toFixed(2),
      baseline: this.baselineAcceleration.toFixed(2),
      isWalking: this.isWalking,
      consecutivePeaks: this.consecutivePeaks,
      historyLength: this.accelerationHistory.length
    };
  }

  reset() {
    this.accelerationHistory = [];
    this.lastStepTime = 0;
    this.consecutivePeaks = 0;
    this.isWalking = false;
    this.lastProcessTime = 0;
    // Keep calibration data
  }

  fullReset() {
    this.reset();
    this.calibrationSamples = [];
    this.isCalibrated = false;
    this.calibrationCount = 0;
    this.baselineAcceleration = 9.81;
  }
}

export default StepDetector;