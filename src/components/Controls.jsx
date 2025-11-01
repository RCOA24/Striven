import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const ControlButton = ({ onClick, children, variant = 'primary', icon: Icon }) => {
  const variants = {
    primary: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50",
    secondary: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/20 hover:border-white/30",
    danger: "bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-100 backdrop-blur-xl border border-red-400/30 hover:border-red-400/50"
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 rounded-2xl font-semibold text-base transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95 ${variants[variant]}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{children}</span>
    </button>
  );
};

const Controls = ({ 
  isTracking, 
  isPaused, 
  onStart, 
  onPause, 
  onResume, 
  onReset 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {!isTracking ? (
        <ControlButton onClick={onStart} variant="primary" icon={Play}>
          Start Tracking
        </ControlButton>
      ) : isPaused ? (
        <>
          <ControlButton onClick={onResume} variant="primary" icon={Play}>
            Resume
          </ControlButton>
          <ControlButton onClick={onReset} variant="danger" icon={RotateCcw}>
            Reset
          </ControlButton>
        </>
      ) : (
        <>
          <ControlButton onClick={onPause} variant="secondary" icon={Pause}>
            Pause
          </ControlButton>
          <ControlButton onClick={onReset} variant="danger" icon={RotateCcw}>
            Reset
          </ControlButton>
        </>
      )}
    </div>
  );
};

export default Controls;