import React from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';

const NutrientBox = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-2xl p-2 py-3 flex flex-col items-center justify-center text-center border border-white/5`}>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
    <span className="text-[9px] text-zinc-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

const ScannerResults = ({ result, onReset }) => {
  if (!result) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-12 bg-gradient-to-t from-black via-black/90 to-transparent">
      <div className="mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 mb-4 safe-bottom">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize tracking-tight leading-tight">{result.name}</h2>
            {!result.isUnknown && (
              <div className="flex items-center space-x-2 mt-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 text-xs font-bold tracking-wide uppercase">Successfully Logged</span>
              </div>
            )}
          </div>
          <button onClick={onReset} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95 flex items-center gap-2 px-4 border border-white/5">
            <RefreshCw className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white">Next Scan</span>
          </button>
        </div>

        {result.isUnknown ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
            <p className="text-yellow-200 text-sm">
              We identified this as <strong>{result.name}</strong>, but exact nutrition data is unavailable.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <NutrientBox label="Kcal" value={result.calories} color="text-white" bg="bg-white/10" />
            <NutrientBox label="Prot" value={result.protein + 'g'} color="text-blue-400" bg="bg-blue-500/10" />
            <NutrientBox label="Carb" value={result.carbs + 'g'} color="text-yellow-400" bg="bg-yellow-500/10" />
            <NutrientBox label="Fat" value={result.fat + 'g'} color="text-rose-400" bg="bg-rose-500/10" />
          </div>
        )}
        
        <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5 pt-3 uppercase tracking-wider">
          <span>AI Confidence: {Math.round(result.confidence * 100)}%</span>
          <span>Source: {result.confidence >= 0.95 ? 'Gemini Vision' : 'OpenFoodFacts DB'}</span>
        </div>
      </div>
    </div>
  );
};

export default ScannerResults;
