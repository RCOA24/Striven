import React from 'react';
import useStriven from './hooks/UseStriven';
import StepCounter from './components/StepCounter';
import MetricsDisplay from './components/MetricsDisplay';
import Controls from './components/Controls';
import useStriven from './hooks/UseStriven';

function App() {
  const {
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
  } = useStriven();

  if (!sensorSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-dark mb-4">Sensor Not Supported</h1>
          <p className="text-gray-600">
            Your device doesn't support motion sensors required for step tracking.
            Please try on a mobile device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🚶 Pedometer</h1>
          <p className="text-white/80">Track your steps, stay healthy</p>
        </div>

        <StepCounter steps={steps} />
        <MetricsDisplay 
          distance={distance}
          calories={calories}
          formattedTime={formattedTime}
        />
        <Controls
          isTracking={isTracking}
          isPaused={isPaused}
          onStart={startTracking}
          onPause={pauseTracking}
          onResume={resumeTracking}
          onReset={reset}
        />

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            {isTracking && !isPaused && '🟢 Tracking active'}
            {isTracking && isPaused && '🟡 Paused'}
            {!isTracking && '⚪ Not tracking'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
