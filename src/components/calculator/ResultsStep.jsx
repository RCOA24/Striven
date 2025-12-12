import React from 'react';
import { 
  Flame, Sparkles, Dumbbell, Apple, Info, Droplets, 
  Activity, TrendingUp, Check, RotateCcw 
} from 'lucide-react';
import MacroCard from './MacroCard';
import BMIIndicator from './BMIIndicator';
import { assessHealthRisks } from '../../utils/healthAssessment';

const HealthWarnings = ({ warnings }) => {
  const criticalWarnings = warnings.filter(w => w.level === 'critical');
  const regularWarnings = warnings.filter(w => w.level === 'warning');
  const infoWarnings = warnings.filter(w => w.level === 'info');
  
  return (
    <>
      {criticalWarnings.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-red-600/10 border border-red-500/30">
          <p className="text-xs font-semibold text-red-300 flex items-center gap-1">
            <span>⚠️</span> Critical Health Notice
          </p>
          <ul className="list-disc list-inside text-xs text-red-200 mt-1 space-y-1">
            {criticalWarnings.map((w, i) => (<li key={i}>{w.message}</li>))}
          </ul>
        </div>
      )}
      {regularWarnings.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-amber-600/10 border border-amber-500/30">
          <p className="text-xs font-semibold text-amber-300">Health Recommendations</p>
          <ul className="list-disc list-inside text-xs text-amber-200 mt-1 space-y-1">
            {regularWarnings.map((w, i) => (<li key={i}>{w.message}</li>))}
          </ul>
        </div>
      )}
      {infoWarnings.length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20">
          <ul className="list-disc list-inside text-xs text-blue-200 space-y-0.5">
            {infoWarnings.map((w, i) => (<li key={i}>{w.message}</li>))}
          </ul>
        </div>
      )}
    </>
  );
};

const ResultsStep = ({ 
  result, 
  formData, 
  lastPayload, 
  aiTips, 
  aiLoading, 
  aiError, 
  onRefreshTips, 
  onSaveAndTrack, 
  onReset 
}) => {
  const { warnings } = lastPayload ? assessHealthRisks(lastPayload) : { warnings: [] };

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-300">
      {/* Main Result Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-emerald-600 to-emerald-800 p-8 text-center shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full mb-4">
            <Flame className="w-3 h-3 text-emerald-200" />
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Daily Target</span>
          </div>
          
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <h2 className="text-6xl font-bold text-white tracking-tighter">{result.target}</h2>
            <span className="text-xl font-medium text-emerald-200">kcal</span>
          </div>
          
          <p className="text-emerald-100 text-sm opacity-90 max-w-[200px] mx-auto">
            Based on your {formData.goal} goal and activity level.
          </p>
        </div>
      </div>

      {/* BMI Indicator */}
      <BMIIndicator height={formData.height} weight={formData.weight} />

      {/* AI Tips with Health Warnings */}
      <div className="bg-gradient-to-b from-[#121216] to-[#0c0c10] rounded-2xl border border-white/8 p-5 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Coach</p>
            <p className="text-[11px] text-zinc-500">Curated tips for your target and habits</p>
          </div>
        </div>
        
        <HealthWarnings warnings={warnings} />
        
        {aiLoading && (
          <p className="text-zinc-400 text-sm">Generating tips...</p>
        )}
        {aiError && (
          <p className="text-amber-300 text-sm">{aiError}</p>
        )}
        {!aiLoading && !aiError && aiTips && (
          <div className="space-y-3">
            <ul className="list-disc list-inside text-sm text-zinc-200 space-y-1">
              {aiTips.split(/\n|\r/).filter(Boolean).map((line, idx) => (
                <li key={idx}>{line.replace(/^[-•\s]+/, '')}</li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Powered by Gemini 2.5 Flash</span>
              <button
                onClick={onRefreshTips}
                className="text-emerald-300 underline underline-offset-4 active:opacity-70"
              >
                Refresh tips
              </button>
            </div>
          </div>
        )}
        {!aiLoading && !aiError && !aiTips && (
          <button
            onClick={onRefreshTips}
            className="w-full mt-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-emerald-300">Get Personalized Tips</span>
            </div>
          </button>
        )}
      </div>

      {/* Macros & Water Section */}
      <div>
        <h3 className="text-lg font-bold font-apple mb-4 px-1">Daily Targets</h3>
        <div className="grid grid-cols-2 gap-3">
          <MacroCard 
            label="Protein" 
            value={result.macros.protein + 'g'} 
            color="bg-blue-500" 
            icon={<Dumbbell className="w-4 h-4 text-blue-100"/>} 
          />
          <MacroCard 
            label="Carbs" 
            value={result.macros.carbs + 'g'} 
            color="bg-yellow-500" 
            icon={<Apple className="w-4 h-4 text-yellow-100"/>} 
          />
          <MacroCard 
            label="Fats" 
            value={result.macros.fats + 'g'} 
            color="bg-rose-500" 
            icon={<Info className="w-4 h-4 text-rose-100"/>} 
          />
          <MacroCard 
            label="Water" 
            value={result.water + 'ml'} 
            color="bg-cyan-500" 
            icon={<Droplets className="w-4 h-4 text-cyan-100"/>} 
          />
        </div>
      </div>

      {/* Stats Details */}
      <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-zinc-800 rounded-md">
              <Activity className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-sm font-medium text-zinc-300">BMR (Resting)</span>
          </div>
          <span className="font-bold text-white">{result.bmr}</span>
        </div>
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-zinc-800 rounded-md">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-sm font-medium text-zinc-300">TDEE (Maintenance)</span>
          </div>
          <span className="font-bold text-white">{result.tdee}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 space-y-3">
        <button
          onClick={onSaveAndTrack}
          className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl active:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Save & Start Tracking
        </button>

        <button
          onClick={onReset}
          className="w-full flex items-center justify-center space-x-2 text-zinc-500 font-medium py-3 active:opacity-70"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Recalculate</span>
        </button>
      </div>
    </div>
  );
};

export default ResultsStep;
