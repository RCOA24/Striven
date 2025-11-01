import React from 'react';

const Controls = ({ 
  isTracking, 
  isPaused, 
  onStart, 
  onPause, 
  onResume, 
  onReset 
}) => {
  return (
    <div className="flex flex-col space-y-4">
      {!isTracking ? (
        <button
          onClick={onStart}
          className="bg-primary hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
        >
          🚶 Start Tracking
        </button>
      ) : (
        <>
          {isPaused ? (
            <button
              onClick={onResume}
              className="bg-secondary hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
            >
              ▶️ Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
            >
              ⏸️ Pause
            </button>
          )}
        </>
      )}
      
      <button
        onClick={onReset}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
      >
        🔄 Reset
      </button>
    </div>
  );
};

export default Controls;
