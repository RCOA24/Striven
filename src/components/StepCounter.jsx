import React from 'react';
import { Footprints, Target } from 'lucide-react';

const StepCounter = ({ steps }) => {
  const goal = 10000;
  const percentage = Math.min((steps / goal) * 100, 100);
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-80 h-80 mx-auto mb-10">
      <svg className="transform -rotate-90 w-full h-full filter drop-shadow-2xl" viewBox="0 0 320 320">
        <circle
          cx="160"
          cy="160"
          r={radius + 10}
          stroke="rgba(34, 197, 94, 0.1)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="160"
          cy="160"
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="20"
          fill="none"
        />
        <circle
          cx="160"
          cy="160"
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="20"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-full mb-3 shadow-lg">
          <Footprints className="w-12 h-12 text-white" />
        </div>
        <div className="text-6xl font-bold text-white mb-2 tracking-tight">
          {steps.toLocaleString()}
        </div>
        <div className="text-lg text-white/80 font-medium mb-1">steps</div>
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5">
          <Target className="w-4 h-4 text-green-400" />
          <span className="text-sm text-white/70 font-medium">
            {percentage.toFixed(0)}% Complete
          </span>
        </div>
      </div>
    </div>
  );
};

export default StepCounter;