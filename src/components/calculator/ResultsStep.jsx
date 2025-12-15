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
  if (!result) return null;

  const totals = result.totals || result;
  const items = result.items || [result];

  return (
    // FIX 1: Increased Z-Index to z-50 to ensure it sits ON TOP of your bottom navigation bar.
    // FIX 2: Added 'safe-area-inset-bottom' support via pb-safe (if using tailwind-css-safe-area) or standard padding.
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center pointer-events-none pb-0 sm:pb-4">
      
      {/* Background Overlay */}
      <div className="bg-black/60 absolute inset-0 pointer-events-auto backdrop-blur-sm transition-opacity" onClick={onReset} />

      {/* Modal Container */}
      {/* FIX 3: Reduced max-h to 75vh to ensure it fits comfortably on screen without getting cut by browser bars */}
      <div className="relative mx-4 mb-4 sm:mb-4 bg-zinc-900/98 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 w-[calc(100%-2rem)] max-w-lg max-h-[75vh] flex flex-col pointer-events-auto overflow-hidden">
        
        {/* Header - Fixed at top of modal */}
        <div className="flex justify-between items-start p-5 pb-3 flex-shrink-0 border-b border-white/5 bg-zinc-900/50 z-10">
          <div className="flex-1 pr-2">
            <h2 className="text-lg sm:text-xl font-bold text-white capitalize tracking-tight leading-tight">
              {items.length > 1 ? `${items.length} items detected` : result.name}
            </h2>
            {!result.isUnknown && (
              <div className="flex items-center space-x-2 mt-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 text-xs font-bold tracking-wide uppercase">Successfully Logged</span>
              </div>
            )}
          </div>
          <button onClick={onReset} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95 flex items-center gap-2 px-3 border border-white/5 flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white hidden sm:inline">Next Scan</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        {/* FIX 4: Added 'pb-10' (bottom padding) to ensure the last item isn't flush with the container edge when scrolling */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">

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
                  <div key={idx} className="flex items-center justify-between text-sm text-white bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                    <div className="flex flex-col">
                      <span className="font-semibold capitalize">{item.display_name || item.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-500">Confidence: {Math.round((item.confidence || 0) * 100)}%</span>
                        {item.verified && <span className="text-[10px] text-emerald-500 font-bold">✓ Verified</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-300">
                      <span>{Math.round(item.calories || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Footer info inside scroll area */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5 pt-4 mt-2 uppercase tracking-wider">
          <span>AI Confidence: {Math.round((result.confidence || 0) * 100)}%</span>
          <span>Source: {result.source || (result.confidence >= 0.95 ? 'Gemini Vision' : 'OpenFoodFacts')}</span>
        </div>
        
        {/* Spacer for bottom breathing room */}
        <div className="h-4 w-full" />
        
        </div>
      </div>
    </div>
  );
};

export default ScannerResults;