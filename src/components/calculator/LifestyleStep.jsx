import React from 'react';
import { Activity, Target, Flame, Dumbbell } from 'lucide-react';
import CheckCircle from './CheckCircle';

const activityOptions = [
  { value: "1.2", label: "Sedentary", desc: "Office job, little exercise" },
  { value: "1.375", label: "Light Activity", desc: "1-2 days/week" },
  { value: "1.55", label: "Moderate", desc: "3-5 days/week" },
  { value: "1.725", label: "Very Active", desc: "6-7 days/week" },
  { value: "1.9", label: "Athlete", desc: "2x training per day" },
];

const goalOptions = [
  { id: 'cut', label: 'Lose', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'maintain', label: 'Maintain', icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'bulk', label: 'Gain', icon: Dumbbell, color: 'text-purple-500', bg: 'bg-purple-500/10' }
];

const LifestyleStep = ({ formData, onActivitySelect, onGoalSelect, onCalculate }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      {/* Activity Section */}
      <div>
        <h3 className="text-lg font-bold font-apple mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          Activity Level
        </h3>
        <div className="space-y-2">
          {activityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onActivitySelect(opt.value)}
              className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${
                formData.activity === opt.value
                  ? 'bg-emerald-500/20 border-2 border-emerald-500'
                  : 'bg-[#1C1C1E] border-2 border-transparent hover:bg-zinc-800'
              }`}
            >
              <div>
                <div className={`font-medium ${formData.activity === opt.value ? 'text-emerald-400' : 'text-white'}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-zinc-500">{opt.desc}</div>
              </div>
              {formData.activity === opt.value && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Goal Section */}
      <div>
        <h3 className="text-lg font-bold font-apple mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          Your Goal
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {goalOptions.map((goal) => {
            const Icon = goal.icon;
            return (
              <button
                key={goal.id}
                onClick={() => onGoalSelect(goal.id)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  formData.goal === goal.id
                    ? `border-current ${goal.color} bg-zinc-900`
                    : 'border-transparent bg-[#1C1C1E] text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <div className={`p-2 rounded-full ${goal.bg} ${goal.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{goal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onCalculate}
        className="w-full bg-emerald-500 text-black font-bold text-lg py-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
      >
        Calculate Plan
      </button>
    </div>
  );
};

export default LifestyleStep;
