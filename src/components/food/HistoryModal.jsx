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
      } catch { }
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
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in p-3 sm:p-4 pt-4 sm:pt-0">
      <div className="bg-zinc-900 w-full max-w-md rounded-3xl flex flex-col shadow-2xl border border-white/10 max-h-[92vh] sm:max-h-[80vh] animate-in zoom-in-95 duration-200 overflow-hidden mt-0 sm:mt-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Food & Water</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          
          {/* Top Section (Tips, Info, Goal) */}
          <div className="px-6 pt-6 pb-2 space-y-4">
            
            {/* AI Tips (if available) */}
            {aiTips && (
              <div className="relative bg-gradient-to-b from-[#121216] to-[#0c0c10] rounded-2xl border border-white/5 p-4 overflow-hidden">
                <div className="relative z-10">
                  <div className="font-semibold text-white/90 mb-1.5 flex items-center gap-1">
                    <span className="text-yellow-500">✨</span>
                    <span className="text-sm">Top Strategies</span>
                  </div>
                  <ul className="space-y-1 text-[12px] text-zinc-300">
                    {aiTips
                      .split(/\n/)
                      .map(line => line.trim())
                      .filter(line => {
                        if (!line) return false;
                        const lowerLine = line.toLowerCase();
                        if (lowerLine.includes('here are') || lowerLine.includes('tips for')) return false;
                        if (lowerLine.includes('strategies') || lowerLine.includes('goal')) return false;
                        return true;
                      })
                      .slice(0, 3)
                      .map((line, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-emerald-500 font-bold flex-shrink-0">{idx + 1}.</span>
                          <span>{line.replace(/^[-•\d.:\s]+/, '').trim()}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                {/* Glass shine effect */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
              </div>
            )}

            {/* Explanation Text */}
            <div className="flex items-start gap-2 text-[10px] text-blue-300/70 bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/10">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <p>
                Your daily target of <strong>{waterTarget}ml</strong> is personalized based on your weight, age, and activity level. Each glass represents {glassSize}ml.
              </p>
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

          {/* Bottom Section (Water & History) */}
          <div className="p-4 space-y-4">
            {/* Water Intake Section */}
            <div className="bg-gradient-to-r from-blue-900/40 to-zinc-900 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Daily Water</span>
                </div>
                <span className="text-xs text-zinc-500">{waterIntake}ml / {waterTarget}ml</span>
              </div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (waterIntake / waterTarget) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-zinc-400">{glassesConsumed}/{totalGlasses} glasses</span>
                <span className="text-blue-400 font-medium">{Math.round((waterIntake / waterTarget) * 100)}%</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAddWater(-250)}
                  className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-500/20 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                  Remove
                </button>
                <button
                  onClick={() => onAddWater(250)}
                  className="flex-1 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Glass
                </button>
              </div>
            </div>

            {/* Food History */}
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
                          <div key={item.id || i} className="bg-black/20 border border-white/5 rounded-xl hover:bg-white/5 transition-colors group">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 flex-shrink-0">
                                  <Utensils className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="font-medium text-white capitalize text-sm truncate">{item.name}</div>
                                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                            {/* Nutritional Breakdown + Micro Details */}
                            {(item.protein > 0 || item.carbs > 0 || item.fat > 0 || item.sugar > 0 || item.fiber > 0 || item.sodium > 0) && (
                              <div className="px-3 pb-3 flex flex-wrap items-center gap-2 text-[10px]">
                                {item.protein > 0 && (
                                  <div className="px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                                    <span className="text-blue-400 font-bold">{Math.round(item.protein)}g</span>
                                    <span className="text-blue-400/60 ml-0.5">P</span>
                                  </div>
                                )}
                                {item.carbs > 0 && (
                                  <div className="px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                                    <span className="text-yellow-400 font-bold">{Math.round(item.carbs)}g</span>
                                    <span className="text-yellow-400/60 ml-0.5">C</span>
                                  </div>
                                )}
                                {item.fat > 0 && (
                                  <div className="px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
                                    <span className="text-rose-400 font-bold">{Math.round(item.fat)}g</span>
                                    <span className="text-rose-400/60 ml-0.5">F</span>
                                  </div>
                                )}
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
                            )}
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