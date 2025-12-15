import React, { useState } from 'react';
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
  const [expanded, setExpanded] = useState(() => items.map(() => false));
  const toggleExpand = (idx) => {
    setExpanded(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center pointer-events-none p-2 xs:p-3 sm:p-4 pt-4 pb-24 sm:pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={onReset} />
      <div className="relative bg-zinc-900/98 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 w-full sm:max-w-xl md:max-w-2xl max-h-[calc(100vh-8rem)] sm:max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden">
        <div className="flex justify-between items-start p-3 xs:p-4 pb-2 flex-shrink-0 border-b border-white/5 gap-2">
          <div className="flex-1 pr-1 min-w-0">
            <h2 className="text-sm xs:text-base sm:text-lg font-bold text-white capitalize tracking-tight leading-tight truncate">
              {items.length > 1 ? `${items.length} items detected` : result.name}
            </h2>
            {!result.isUnknown && (
              <div className="flex items-center space-x-1.5 mt-1">
                <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <span className="text-emerald-500 text-[10px] xs:text-xs font-bold tracking-wide uppercase truncate">Successfully Logged</span>
              </div>
            )}
          </div>
          <button onClick={onReset} className="p-1 xs:p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95 flex items-center gap-1 xs:gap-2 px-2 xs:px-2.5 border border-white/5 flex-shrink-0">
            <RefreshCw className="w-3 h-3 xs:w-3.5 h-3.5 text-white" />
            <span className="text-[10px] xs:text-xs font-bold text-white hidden sm:inline">Next</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 xs:px-4 py-2 xs:py-3 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">

        {result.isUnknown ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-200 text-sm">
              We identified this as <strong>{result.name}</strong>, but exact nutrition data is unavailable.
            </p>
          </div>
        ) : (
          <>
            {result.summary && (
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-[12px] text-zinc-300 leading-relaxed">{result.summary}</p>
              </div>
            )}
            {((result.confidence || 0) < 0.6 || result.isUnknown) && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <p className="text-[11px] text-yellow-200">Tip: Try another angle with better lighting, keep items separated, and avoid reflections for higher accuracy.</p>
              </div>
            )}
            <div className="grid grid-cols-4 gap-3">
              <NutrientBox label="Kcal" value={Math.round(totals.calories || 0)} color="text-white" bg="bg-white/10" />
              <NutrientBox label="Prot" value={`${Math.round(totals.protein || 0)}g`} color="text-blue-400" bg="bg-blue-500/10" />
              <NutrientBox label="Carb" value={`${Math.round(totals.carbs || 0)}g`} color="text-yellow-400" bg="bg-yellow-500/10" />
              <NutrientBox label="Fat" value={`${Math.round(totals.fat || 0)}g`} color="text-rose-400" bg="bg-rose-500/10" />
            </div>
            <div className="h-2" />

            {(totals.sugar > 0 || totals.fiber > 0 || totals.sodium > 0) && (
              <div className="bg-black/20 rounded-xl p-3">
                {totals.sugar > 0 && <MicroNutrientRow label="Sugar" value={Math.round(totals.sugar)} unit="g" />}
                {totals.fiber > 0 && <MicroNutrientRow label="Fiber" value={Math.round(totals.fiber)} unit="g" />}
                {totals.sodium > 0 && <MicroNutrientRow label="Sodium" value={Math.round(totals.sodium)} unit="mg" />}
              </div>
            )}

            {items.length > 1 && (
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between text-sm text-white px-3 py-3"
                      onClick={() => toggleExpand(idx)}
                      aria-expanded={expanded[idx]}
                      aria-label={`Toggle details for ${item.display_name || item.name}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold capitalize truncate">{item.display_name || item.name}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                            <span>Confidence: {Math.round((item.confidence || 0) * 100)}%</span>
                            {item.verified && <span className="text-emerald-500 font-bold">✓ Verified</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-zinc-300">
                        <span aria-label="Calories">{Math.round(item.calories || 0)} kcal</span>
                        <span aria-label="Protein">{Math.round(item.protein || 0)}g P</span>
                        <span aria-label="Carbs">{Math.round(item.carbs || 0)}g C</span>
                        <span aria-label="Fat">{Math.round(item.fat || 0)}g F</span>
                        <span className="ml-2 text-zinc-400" aria-hidden>
                          {expanded[idx] ? '▾' : '▸'}
                        </span>
                      </div>
                    </button>
                    {(item.sugar > 0 || item.fiber > 0 || item.sodium > 0) && expanded[idx] && (
                      <div className="px-3 pb-3">
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          {item.sugar > 0 && (
                            <div className="px-2 py-1 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-300">Sugar: {Math.round(item.sugar)}g</div>
                          )}
                          {item.fiber > 0 && (
                            <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">Fiber: {Math.round(item.fiber)}g</div>
                          )}
                          {item.sodium > 0 && (
                            <div className="px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">Sodium: {Math.round(item.sodium)}mg</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur px-3 xs:px-4 py-1.5 xs:py-2 border-t border-white/5 flex items-center justify-between text-[7px] xs:text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-wider gap-2">
          <span className="truncate">Confidence: {Math.round((result.confidence || 0) * 100)}%</span>
          <span className="text-right max-w-[50%] xs:max-w-[55%] truncate">{result.source || (result.confidence >= 0.95 ? 'Gemini Vision' : 'OpenFoodFacts DB')}</span>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerResults;
