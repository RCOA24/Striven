import React from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';

const NutrientBox = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-2xl p-2 py-3 flex flex-col items-center justify-center text-center border border-white/5`}>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
    <span className="text-[9px] text-zinc-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

const MicroNutrientRow = ({ label, value, unit }) => (
  <div className="flex justify-between items-center text-xs text-zinc-400 py-1 border-b border-white/5 last:border-0">
    <span>{label}</span>
    <span className="text-white font-medium">{value}{unit}</span>
  </div>
);

const ScannerResults = ({ result, onReset }) => {
  // Guard: don't render if result is null/undefined
  if (!result) return null;

  const totals = result.totals || result;
  const items = result.items || [result];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-12 bg-gradient-to-t from-black via-black/90 to-transparent">
      <div className="mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 mb-4 safe-bottom">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize tracking-tight leading-tight">
              {items.length > 1 ? `${items.length} items detected` : result.name}
            </h2>
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
          <>
            {result.summary && (
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 mb-3">
                <p className="text-[12px] text-zinc-300 leading-relaxed">{result.summary}</p>
              </div>
            )}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <NutrientBox label="Kcal" value={Math.round(totals.calories || 0)} color="text-white" bg="bg-white/10" />
              <NutrientBox label="Prot" value={`${Math.round(totals.protein || 0)}g`} color="text-blue-400" bg="bg-blue-500/10" />
              <NutrientBox label="Carb" value={`${Math.round(totals.carbs || 0)}g`} color="text-yellow-400" bg="bg-yellow-500/10" />
              <NutrientBox label="Fat" value={`${Math.round(totals.fat || 0)}g`} color="text-rose-400" bg="bg-rose-500/10" />
            </div>

            {(totals.sugar > 0 || totals.fiber > 0 || totals.sodium > 0) && (
              <div className="bg-black/20 rounded-xl p-3 mb-4">
                {totals.sugar > 0 && <MicroNutrientRow label="Sugar" value={Math.round(totals.sugar)} unit="g" />}
                {totals.fiber > 0 && <MicroNutrientRow label="Fiber" value={Math.round(totals.fiber)} unit="g" />}
                {totals.sodium > 0 && <MicroNutrientRow label="Sodium" value={Math.round(totals.sodium)} unit="mg" />}
              </div>
            )}

            {items.length > 1 && (
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-2 mb-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm text-white bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                    <div className="flex flex-col">
                      <span className="font-semibold capitalize">{item.display_name || item.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-500">Confidence: {Math.round((item.confidence || 0) * 100)}%</span>
                        {item.verified && <span className="text-[10px] text-emerald-500 font-bold">✓ Verified</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-300">
                      <span>{Math.round(item.calories || 0)} kcal</span>
                      <span>{Math.round(item.protein || 0)}g P</span>
                      <span>{Math.round(item.carbs || 0)}g C</span>
                      <span>{Math.round(item.fat || 0)}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5 pt-3 uppercase tracking-wider">
          <span>AI Confidence: {Math.round((result.confidence || 0) * 100)}%</span>
          <span>Source: {result.source || (result.confidence >= 0.95 ? 'Gemini Vision' : 'OpenFoodFacts DB')}</span>
        </div>
      </div>
    </div>
  );
};

export default ScannerResults;
