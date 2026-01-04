import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle, Check, Save } from 'lucide-react';

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

const ScannerResults = ({ result, onReset, onSave }) => {
  const initialItems = useMemo(() => {
    if (!result) return [];
    return result.items || [result];
  }, [result]);

  const [selectedIndices, setSelectedIndices] = useState([]);

  // Reset selection when result changes
  useEffect(() => {
    if (result) {
        const items = result.items || [result];
        setSelectedIndices(items.map((_, i) => i));
    }
  }, [result]);

  const toggleItem = (index) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const selectedItems = useMemo(() => 
    initialItems.filter((_, i) => selectedIndices.includes(i)), 
  [initialItems, selectedIndices]);

  const totals = useMemo(() => {
    return selectedItems.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
      sugar: acc.sugar + (item.sugar || 0),
      fiber: acc.fiber + (item.fiber || 0),
      sodium: acc.sodium + (item.sodium || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0 });
  }, [selectedItems]);

  const handleSave = (e) => {
    e.stopPropagation();
    if (onSave && selectedItems.length > 0) {
        onSave(selectedItems);
    }
  };

  // Guard: don't render if result is null/undefined
  // Must be AFTER hooks to prevent "Rendered fewer hooks than expected" error
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center pointer-events-none p-2 xs:p-3 sm:p-4 pt-4 pb-24 sm:pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={onReset} />
      <div className="relative bg-zinc-900/98 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 w-full max-w-2xl max-h-[calc(100vh-8rem)] sm:max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden">
        <div className="flex justify-between items-start p-3 xs:p-4 pb-2 flex-shrink-0 border-b border-white/5 gap-2">
          <div className="flex-1 pr-1 min-w-0">
            <h2 className="text-sm xs:text-base sm:text-lg font-bold text-white capitalize tracking-tight leading-tight truncate">
              {selectedItems.length > 0 ? `${selectedItems.length} items selected` : 'No items selected'}
            </h2>
            {!result.isUnknown && (
              <div className="flex items-center space-x-1.5 mt-1">
                <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <span className="text-emerald-500 text-[10px] xs:text-xs font-bold tracking-wide uppercase truncate">Ready to Log</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onReset} className="p-2 text-zinc-400 hover:text-white transition-colors">
                <span className="text-xs font-medium">Cancel</span>
            </button>
            {!result.isUnknown && (
                <button 
                    onClick={handleSave} 
                    disabled={selectedItems.length === 0}
                    className="p-1.5 xs:p-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors active:scale-95 flex items-center gap-1 xs:gap-2 px-3 xs:px-4 shadow-lg shadow-emerald-500/20"
                >
                    <Save className="w-3 h-3 xs:w-4 xs:h-4 text-white" />
                    <span className="text-[10px] xs:text-xs font-bold text-white">Save Log</span>
                </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 xs:px-4 py-2 xs:py-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">

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

            {initialItems.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-2">
                {initialItems.map((item, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div 
                        key={idx} 
                        onClick={() => toggleItem(idx)}
                        className={`flex items-center justify-between text-sm text-white rounded-xl px-3 py-2 border transition-all cursor-pointer active:scale-[0.98] ${
                            isSelected 
                                ? 'bg-emerald-500/10 border-emerald-500/30' 
                                : 'bg-black/40 border-white/5 opacity-60'
                        }`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-500'
                            }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold capitalize truncate">{item.display_name || item.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-zinc-500">Confidence: {Math.round((item.confidence || 0) * 100)}%</span>
                                    {item.verified && <span className="text-[10px] text-emerald-500 font-bold">✓ Verified</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-zinc-300 flex-shrink-0 ml-2">
                            <span>{Math.round(item.calories || 0)} kcal</span>
                        </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        
        <div className="flex items-center justify-between text-[7px] xs:text-[8px] sm:text-[9px] text-zinc-500 border-t border-white/5 px-3 xs:px-4 py-1.5 xs:py-2 uppercase tracking-wider flex-shrink-0 gap-2">
          <span className="truncate">Confidence: {Math.round((result.confidence || 0) * 100)}%</span>
          <span className="text-right max-w-[50%] xs:max-w-[55%] truncate">{result.source || (result.confidence >= 0.95 ? 'Gemini Vision' : 'OpenFoodFacts DB')}</span>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerResults;