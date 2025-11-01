class StepDetector {
    constructor(onStep, threshold = 15){
        this.onStep = onStep;
        this.threshold = threshold;
        this.lastStepTime = 0;
        this.stepTimeout = 300; // Minimum time between steps in ms
        this.accelerationHistory = [];
        this.maxHistoryLength = 5;
    }


processAcceleration(x, y, z) {
// Calculate the magnitude of the acceleration
const magnitude = Math.sqrt(x * x + y * y + z * z);

//Add to history
this.accelerationHistory.push(magnitude);
if (this.accelerationHistory.length > this.maxHistoryLength) {
    this.accelerationHistory.shift();
}

//Need at least 3 data points to detect a step
if (this.accelerationHistory.length < 3) return;

//Detect peak (step)

const current = this.accelerationHistory[this.accelerationHistory.length - 1];
const previous = this.accelerationHistory[this.accelerationHistory.length - 2];
const beforePrevious = this.accelerationHistory[this.accelerationHistory.length - 3];

// Check if current is a peak and exceeds threshold
if (previous > beforePrevious && previous > current && previous > this.threshold) {
    const now = Date.now();
    if (now - this.lastSteptime > this.stepTimeout) {
        this.lastStepTime = now;
        this.onStep();
    }
}
}

reset(){
    this.accelerationHistory = [];
    this.lastStepTime = 0;  
}
}

export default StepDetector;