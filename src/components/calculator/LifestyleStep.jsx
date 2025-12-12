import React from 'react';
import { 
  Flame, 
  Target, 
  Dumbbell, 
  Armchair, 
  Footprints, 
  Bike, 
  Zap, 
  Trophy,
  Activity
} from 'lucide-react';
import CheckCircle from './CheckCircle';

const activityOptions = [
  { value: "1.2", label: "Sedentary", desc: "Desk job, little to no exercise", icon: Armchair },
  { value: "1.375", label: "Light Activity", desc: "Light exercise 1-3 days/week", icon: Footprints },
  { value: "1.55", label: "Moderate", desc: "Moderate exercise 3-5 days/week", icon: Bike },
  { value: "1.725", label: "Very Active", desc: "Heavy exercise 6-7 days/week", icon: Zap },
  { value: "1.9", label: "Athlete", desc: "Physical job or 2x training/day", icon: Trophy },
];

const goalOptions = [
  { id: 'cut', label: 'Lose Fat', sub: 'Deficit', icon: Flame, color: 'orange' },
  { id: 'maintain', label: 'Maintain', sub: 'Balance', icon: Target, color: 'blue' },
  { id: 'bulk', label: 'Build Muscle', sub: 'Surplus', icon: Dumbbell, color: 'purple' }
];

const LifestyleStep = ({ formData, onActivitySelect, onGoalSelect, onCalculate }) => {
  
  const isReady = formData.activity && formData.goal;

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 fade-in flex flex-col h-full max-w-md mx-auto w-full pb-4">
      
      {/* Header */}
      <div className="text-center pt-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Lifestyle & Goals</h2>
        <p className="text-zinc-400 text-sm mt-1">Tailoring the math to your daily life.</p>
      </div>

      {/* 1. Activity Level Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Activity Level</span>
        </div>

        <div className="space-y-3">
          {activityOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = formData.activity === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => onActivitySelect(opt.value)}
                className={`
                  w-full p-4 rounded-2xl text-left transition-all duration-200 border-2 group relative overflow-hidden
                  ${isSelected 
                    ? 'bg-zinc-900 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.1)]' 
                    : 'bg-zinc-900/40 border-transparent hover:bg-zinc-900 hover:border-zinc-800'}
                `}
              >
                <div className="relative z-10 flex items-center justify-between gap-4">
                  {/* Icon Box */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0
                    ${isSelected ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200'}
                  `}>
                    <Icon size={22} strokeWidth={2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-lg leading-tight mb-1 ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-zinc-500 truncate group-hover:text-zinc-400 transition-colors">
                      {opt.desc}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <CheckCircle 
                      checked={isSelected} 
                      size={24} 
                      color="emerald"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Goal Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Your Goal</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {goalOptions.map((goal) => {
            const Icon = goal.icon;
            const isSelected = formData.goal === goal.id;
            
            // Define colors for Active vs Inactive states
            // Active: Background is Tinted/Dark, Border is Colored, Text is White
            // Icon Circle: White BG with Colored Icon (High Visibility)
            
            const colorConfig = {
              orange: {
                border: 'border-orange-500',
                bg: 'bg-orange-500/10',
                text: 'text-orange-500', // For the icon inside the white circle
                shadow: 'shadow-orange-500/20'
              },
              blue: {
                border: 'border-blue-500',
                bg: 'bg-blue-500/10',
                text: 'text-blue-500',
                shadow: 'shadow-blue-500/20'
              },
              purple: {
                border: 'border-purple-500',
                bg: 'bg-purple-500/10',
                text: 'text-purple-500',
                shadow: 'shadow-purple-500/20'
              },
            }[goal.color];

            return (
              <button
                key={goal.id}
                onClick={() => onGoalSelect(goal.id)}
                className={`
                  relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 group
                  ${isSelected 
                    ? `${colorConfig.border} ${colorConfig.bg} shadow-lg ${colorConfig.shadow}` 
                    : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700'}
                `}
              >
                {/* Icon Container - Crucial Fix for Visibility */}
                <div className={`
                  p-3 rounded-full transition-all duration-300 shadow-sm
                  ${isSelected 
                    ? `bg-white ${colorConfig.text} scale-110 shadow-lg` // Active: White BG + Colored Icon
                    : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-700'} // Inactive: Dark BG + Gray Icon
                `}>
                  <Icon size={22} strokeWidth={2.5} />
                </div>
                
                <div className="text-center">
                  <span className={`block text-sm font-bold transition-colors ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                    {goal.label}
                  </span>
                  <span className={`block text-[10px] uppercase font-bold mt-1 transition-opacity ${isSelected ? 'opacity-80 text-white' : 'opacity-40 text-zinc-500'}`}>
                    {goal.sub}
                  </span>
                </div>
                
                {isSelected && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${colorConfig.text.replace('text-', 'bg-')} animate-pulse`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calculate Button */}
      <div className="pt-4 mt-auto">
        <button
          onClick={onCalculate}
          disabled={!isReady}
          className={`
            w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2
            ${isReady 
              ? 'bg-emerald-500 text-zinc-900 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-[0.98]' 
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'}
          `}
        >
          Calculate Plan
        </button>
      </div>
    </div>
  );
};

export default LifestyleStep;