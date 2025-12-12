import React, { useState, useEffect } from 'react';
import { getNutritionProfile } from '../../utils/db';
import { X, ScanLine, Utensils, Clock, Trash2, Calendar, Target, Ruler, Weight, Droplets, Plus, Minus, Info, ChevronDown, ChevronUp } from 'lucide-react';

const HistoryModal = ({ 
  isOpen, 
  onClose, 
  history, 
  groupedHistory, 
  nutritionGoal, 
  todayStats, 
  waterIntake, 
  waterTarget = 2500, // Default if not passed
  onAddWater, 
  onDelete, 
  onSetGoal 
}) => {
  const [expandedDates, setExpandedDates] = useState({});
    const [aiTips, setAiTips] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const profile = await getNutritionProfile();
                if (profile?.aiTips) setAiTips(profile.aiTips);
            } catch {}
        })();
    }, []);

  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  if (!isOpen) return null;

  const glassSize = 250;
  // Ensure at least 8 glasses for visual balance if target is low, or cap it reasonable
  const calculatedGlasses = Math.ceil(waterTarget / glassSize);
  const totalGlasses = Math.max(8, calculatedGlasses); 
  const glassesConsumed = Math.floor(waterIntake / glassSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-3xl flex flex-col shadow-2xl border border-white/10 max-h-[80vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Food & Water</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6 pb-2 space-y-4">
                                {/* AI Tips (if available) */}
                                {aiTips && (
                                    <div className="bg-gradient-to-b from-[#121216] to-[#0c0c10] rounded-2xl border border-white/8 p-4">
                                        <div className="text-xs text-zinc-500 mb-1">AI Coach</div>
                                        <ul className="list-disc list-inside text-[13px] text-zinc-200 space-y-0.5">
                                            {aiTips.split(/\n|\r/).filter(Boolean).slice(0,3).map((t, i) => (
                                                <li key={i}>{t.replace(/^[-•\s]+/, '')}</li>
                                            ))}
                                        </ul>
                                        {/* Optional: link to adjust plan if needed */}
                                    </div>
                                )}
                {/* Water Tracker - Visual Glasses */}
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-blue-500/20 rounded-full text-blue-400 flex-shrink-0">
                                <Droplets className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-white truncate">Hydration</div>
                                <div className="text-xs text-blue-300 font-medium truncate">
                                    {waterIntake} / {waterTarget} ml
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => onAddWater(-glassSize)}
                                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 active:scale-95 transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => onAddWater(glassSize)}
                                className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 active:scale-95 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {/* The Glasses Grid */}
                    <div className="flex flex-wrap gap-3 justify-center sm:justify-start mb-4">
                        {[...Array(totalGlasses)].map((_, i) => {
                            const isFilled = i < glassesConsumed;
                            return (
                                <div 
                                    key={i} 
                                    className={`relative w-8 h-10 rounded-sm border-2 transition-all duration-500 ease-out overflow-hidden ${
                                        isFilled 
                                            ? 'border-blue-400 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                                            : 'border-zinc-700 bg-zinc-800/30'
                                    }`}
                                >
                                    {/* Liquid animation */}
                                    <div 
                                        className={`absolute bottom-0 left-0 w-full bg-blue-400 transition-all duration-500 ${
                                            isFilled ? 'h-full' : 'h-0'
                                        }`} 
                                    />
                                    {/* Glass shine effect */}
                                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Explanation Text */}
                    <div className="flex items-start gap-2 text-[10px] text-blue-300/70 bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/10">
                        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <p>
                            Your daily target of <strong>{waterTarget}ml</strong> is personalized based on your weight, age, and activity level. Each glass represents {glassSize}ml.
                        </p>
                    </div>
                </div>

                {/* Daily Progress Section */}
                {nutritionGoal ? (
                <>
                    {/* User Stats Reference */}
                    <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <Ruler className="w-3 h-3" />
                        <span>{nutritionGoal.height} cm</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <Weight className="w-3 h-3" />
                        <span>{nutritionGoal.weight} kg</span>
                        </div>
                    </div>
                    <div className="text-xs text-emerald-500 font-medium uppercase tracking-wider">
                        {nutritionGoal.goal === 'cut' ? 'Weight Loss' : nutritionGoal.goal === 'bulk' ? 'Muscle Gain' : 'Maintain'}
                    </div>
                    </div>

                    {/* Calorie Progress */}
                    <div className="bg-gradient-to-r from-emerald-900/40 to-zinc-900 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 gap-2">
                        <div>
                        <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Today's Intake</div>
                        <div className="text-2xl font-bold text-white break-words">
                            {todayStats.calories} <span className="text-sm text-zinc-500 font-normal whitespace-nowrap">/ {nutritionGoal.targetCalories} kcal</span>
                        </div>
                        </div>
                        <div className="text-left sm:text-right">
                        <div className="text-xs text-zinc-500 mb-1">Remaining</div>
                        <div className="font-bold text-white">{Math.max(0, nutritionGoal.targetCalories - todayStats.calories)}</div>
                        </div>
                    </div>
                    
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (todayStats.calories / nutritionGoal.targetCalories) * 100)}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-white/5 text-[10px] text-zinc-400 uppercase tracking-wide text-center">
                        <div className="flex flex-col">
                            <span className="font-bold text-white">{todayStats.protein}g</span>
                            <span>Protein</span>
                        </div>
                        <div className="flex flex-col border-l border-white/5">
                            <span className="font-bold text-white">{todayStats.carbs}g</span>
                            <span>Carbs</span>
                        </div>
                        <div className="flex flex-col border-l border-white/5">
                            <span className="font-bold text-white">{todayStats.fat}g</span>
                            <span>Fat</span>
                        </div>
                    </div>
                    </div>
                </>
                ) : (
                <div className="py-2">
                    <button 
                    onClick={onSetGoal}
                    className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
                    >
                    <Target className="w-4 h-4" />
                    Set Calorie Goal
                    </button>
                </div>
                )}
            </div>
            
            <div className="p-4 space-y-4">
            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-500 space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <ScanLine className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm">No food logged yet</p>
                </div>
            ) : (
                Object.entries(groupedHistory).map(([date, group]) => {
                    const isExpanded = expandedDates[date];
                    return (
                        <div key={date} className="animate-in slide-in-from-bottom-2 duration-500 bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            <button 
                                onClick={() => toggleDate(date)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{date}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-zinc-500 font-medium">{group.totalCals} kcal</span>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                </div>
                            </button>
                            
                            {isExpanded && (
                                <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-3">
                                    {group.items.map((item, i) => (
                                        <div key={item.id || i} className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 flex-shrink-0">
                                            <Utensils className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <div className="min-w-0 flex-1 pr-2">
                                            <div className="font-medium text-white capitalize text-sm truncate">{item.name}</div>
                                            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-right">
                                            <div className="text-white font-bold text-sm">{item.calories}</div>
                                            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">kcal</div>
                                            </div>
                                            <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item.id);
                                            }}
                                            className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                            >
                                            <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
