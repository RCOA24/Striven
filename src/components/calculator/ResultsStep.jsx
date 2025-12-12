import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Dumbbell, 
  Wheat, 
  Droplets, 
  Activity, 
  TrendingUp, 
  Check, 
  RotateCcw,
  BrainCircuit,
  AlertTriangle 
} from 'lucide-react';
import MacroCard from './MacroCard'; 
import BMIIndicator from './BMIIndicator'; 
import { assessHealthRisks } from '../../utils/healthAssessment';

const WarningItem = ({ type, message }) => {
  const styles = {
    critical: 'bg-red-500/10 border-red-500/20 text-red-200 icon-red-500',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-200 icon-amber-500',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-200 icon-blue-500',
  };
  const activeStyle = styles[type] || styles.info;

  return (
    <div className={`p-3 rounded-xl border flex gap-3 items-start ${activeStyle}`}>
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
      <span className="text-xs font-medium leading-relaxed">{message}</span>
    </div>
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
  
  const critical = warnings.filter(w => w.level === 'critical');
  const regular = warnings.filter(w => w.level === 'warning');
  const infos = warnings.filter(w => w.level === 'info');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-6">
      
      {/* 1. Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/80 to-teal-900/80 opacity-90" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 blur-3xl rounded-full" />
        
        <div className="relative z-10 p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-orange-300 fill-orange-300" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Daily Target</span>
          </div>
          
          <div className="flex items-baseline justify-center gap-2 mb-3">
            <h2 className="text-7xl font-bold text-white tracking-tighter drop-shadow-sm">
              {result.target}
            </h2>
            <div className="flex flex-col items-start">
              <span className="text-xl font-medium text-emerald-100/80">kcal</span>
              <span className="text-xs text-emerald-100/50 uppercase font-bold tracking-wider">Per Day</span>
            </div>
          </div>
          
          <p className="text-emerald-50 text-sm font-medium opacity-80">
            Optimized for <strong>{formData.goal.replace('-', ' ')}</strong> 
          </p>
        </div>
      </div>

      {/* 2. BMI Indicator */}
      <BMIIndicator height={formData.height} weight={formData.weight} />

      {/* 3. Macros Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-bold text-white">Macronutrients</h3>
          <span className="text-xs text-zinc-500">Balanced approach</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Protein" value={result.macros.protein} unit="g" color="blue" icon={<Dumbbell />} />
          <MacroCard label="Carbs" value={result.macros.carbs} unit="g" color="orange" icon={<Wheat />} />
          <MacroCard label="Fats" value={result.macros.fats} unit="g" color="purple" icon={<Droplets />} />
          <MacroCard label="Water" value={result.water} unit="ml" color="emerald" icon={<Droplets />} />
        </div>
      </div>

      {/* 4. AI & Health Analysis */}
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-1 overflow-hidden">
        <div className="p-4 flex items-center gap-3 border-b border-zinc-800/50">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <BrainCircuit size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">Smart Analysis</h4>
            <p className="text-xs text-zinc-500">Health checks & AI Tips</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {(critical.length > 0 || regular.length > 0 || infos.length > 0) && (
            <div className="space-y-2">
              {critical.map((w, i) => <WarningItem key={`c-${i}`} type="critical" message={w.message} />)}
              {regular.map((w, i) => <WarningItem key={`r-${i}`} type="warning" message={w.message} />)}
              {infos.map((w, i) => <WarningItem key={`i-${i}`} type="info" message={w.message} />)}
            </div>
          )}

          <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 relative">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-3 animate-pulse">
                <Sparkles className="w-6 h-6 text-emerald-500/50" />
                <p className="text-xs text-zinc-500">Consulting AI nutritionist...</p>
              </div>
            ) : aiError ? (
              <div className="text-center py-2">
                <p className="text-xs text-red-400 mb-2">{aiError}</p>
                <button onClick={onRefreshTips} className="text-xs underline text-zinc-500">Try Again</button>
              </div>
            ) : aiTips ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Top Strategy</span>
                </div>
                <ul className="space-y-2.5">
                  {aiTips.split(/\n/).filter(line => line.trim().length > 0).slice(0, 3).map((line, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-zinc-300 leading-relaxed">
                      <span className="text-emerald-500 mt-1.5">•</span>
                      <span>{line.replace(/^[-•\s]+/, '')}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                   <button onClick={onRefreshTips} className="text-[10px] text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors">
                     <RotateCcw size={10} /> Refresh Tips
                   </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onRefreshTips}
                className="w-full py-6 flex flex-col items-center gap-2 hover:bg-zinc-900 rounded-lg transition-colors group"
              >
                <div className="p-3 rounded-full bg-emerald-500/10 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Generate Personalized Tips</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. BMR & TDEE */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="text-zinc-500 mb-1 flex items-center gap-1.5">
            <Activity size={12} />
            <span className="text-xs font-bold uppercase tracking-wider">BMR</span>
          </div>
          <span className="text-xl font-bold text-white">{result.bmr}</span>
          <span className="text-[10px] text-zinc-600 mt-1">Calories at rest</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="text-zinc-500 mb-1 flex items-center gap-1.5">
            <TrendingUp size={12} />
            <span className="text-xs font-bold uppercase tracking-wider">TDEE</span>
          </div>
          <span className="text-xl font-bold text-white">{result.tdee}</span>
          <span className="text-[10px] text-zinc-600 mt-1">Maintenance level</span>
        </div>
      </div>

      {/* 6. Primary & Secondary Actions */}
      <div className="pt-4 space-y-3">
        <button
          onClick={onSaveAndTrack}
          className="w-full bg-white hover:bg-zinc-100 text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" strokeWidth={3} />
          Save Plan
        </button>

        {/* UPDATED RECALCULATE BUTTON */}
        <button
          onClick={onReset}
          className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-base py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Recalculate</span>
        </button>
      </div>
    </div>
  );
};

export default ResultsStep;