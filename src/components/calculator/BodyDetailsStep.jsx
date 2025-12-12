import React from 'react';
import { 
  CalendarDays, 
  Check, 
  Ruler, 
  Weight, 
  RefreshCw, 
  PlayCircle, 
  AlertCircle 
} from 'lucide-react';

// Reusable Row Component with ENHANCED ICONS
const InputRow = ({ icon: Icon, colorClass, borderClass, textClass, label, value, name, onChange, unit, placeholder }) => (
  <div className="flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900 transition-colors group cursor-pointer border-b last:border-0 border-zinc-800/50">
    <div className="flex items-center gap-4">
      {/* Icon Container - Now more visible with borders and stronger background */}
      <div className={`w-10 h-10 rounded-xl ${colorClass} ${borderClass} border flex items-center justify-center shadow-sm`}>
        <Icon className={`w-5 h-5 ${textClass}`} strokeWidth={2.5} />
      </div>
      <span className="font-semibold text-zinc-200 text-lg">{label}</span>
    </div>
    
    <div className="flex items-center gap-2">
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode="decimal"
        className="w-24 bg-transparent text-right text-xl font-bold text-white placeholder-zinc-700 focus:outline-none focus:placeholder-transparent selection:bg-emerald-500/30"
      />
      <span className="text-zinc-500 font-medium text-sm w-8">{unit}</span>
    </div>
  </div>
);

const BodyDetailsStep = ({ 
  formData, 
  onChange, 
  onNext, 
  hasExistingProfile, 
  onResume, 
  onRecalculate, 
  validationError 
}) => {
  
  const isComplete = formData.gender && formData.age && formData.height && formData.weight;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 fade-in flex flex-col h-full max-w-md mx-auto w-full">
      
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Body Details</h2>
        <p className="text-zinc-400 text-sm">We use these stats to build your plan.</p>
      </div>

      {/* Validation Error Toast */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 flex items-center gap-3 animate-pulse">
          <AlertCircle size={20} className="text-red-500" />
          <span className="text-sm font-medium">{validationError}</span>
        </div>
      )}

      {/* Existing Profile Card */}
      {hasExistingProfile && (
        <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-sm font-medium">Unfinished setup found</span>
              <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md">Auto-saved</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onResume}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
              >
                <PlayCircle size={18} /> Resume
              </button>
              <button
                onClick={onRecalculate}
                className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw size={18} /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Content */}
      <div className="space-y-6">
        
        {/* Gender Selection */}
        <div className="grid grid-cols-2 gap-4">
          {['male', 'female'].map((g) => {
            const isSelected = formData.gender === g;
            return (
              <button
                key={g}
                onClick={() => onChange({ target: { name: 'gender', value: g } })}
                className={`
                  relative h-40 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 group
                  ${isSelected 
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'}
                `}
              >
                <span className="text-5xl filter drop-shadow-lg transition-transform duration-300 group-hover:scale-110 group-active:scale-90">
                  {g === 'male' ? '👨' : '👩'}
                </span>
                <span className={`font-bold capitalize tracking-wide ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {g}
                </span>
                
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-black rounded-full p-1 shadow-lg animate-in zoom-in duration-300">
                    <Check size={14} strokeWidth={4} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Input Group - High Visibility Icons */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          
          <InputRow 
            icon={CalendarDays} 
            colorClass="bg-orange-500/15" 
            borderClass="border-orange-500/20"
            textClass="text-orange-500"
            label="Age" 
            name="age" 
            value={formData.age} 
            onChange={onChange} 
            placeholder="25" 
            unit="yrs" 
          />
          
          <InputRow 
            icon={Ruler} 
            colorClass="bg-blue-500/15" 
            borderClass="border-blue-500/20"
            textClass="text-blue-500"
            label="Height" 
            name="height" 
            value={formData.height} 
            onChange={onChange} 
            placeholder="175" 
            unit="cm" 
          />
          
          <InputRow 
            icon={Weight} 
            colorClass="bg-purple-500/15" 
            borderClass="border-purple-500/20"
            textClass="text-purple-500"
            label="Weight" 
            name="weight" 
            value={formData.weight} 
            onChange={onChange} 
            placeholder="70" 
            unit="kg" 
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 mt-auto pb-6">
        <button
          onClick={onNext}
          disabled={!isComplete}
          className={`
            w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2
            ${isComplete 
              ? 'bg-emerald-500 text-zinc-900 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] active:scale-[0.98] translate-y-0' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}
          `}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BodyDetailsStep;