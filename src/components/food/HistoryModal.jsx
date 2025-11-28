import React from 'react';
import { X, ScanLine, Utensils, Clock, Trash2, Calendar, Target, Ruler, Weight } from 'lucide-react';

const HistoryModal = ({ 
  isOpen, 
  onClose, 
  history, 
  groupedHistory, 
  nutritionGoal, 
  todayStats, 
  onDelete, 
  onSetGoal 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-3xl flex flex-col shadow-2xl border border-white/10 max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Food History</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Daily Progress Section */}
        {nutritionGoal ? (
          <div className="px-6 pt-6 pb-2 space-y-4">
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

            <div className="bg-gradient-to-r from-emerald-900/40 to-zinc-900 border border-emerald-500/20 rounded-2xl p-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Today's Intake</div>
                  <div className="text-2xl font-bold text-white">
                    {todayStats.calories} <span className="text-sm text-zinc-500 font-normal">/ {nutritionGoal.targetCalories} kcal</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 mb-1">Remaining</div>
                  <div className="font-bold text-white">{Math.max(0, nutritionGoal.targetCalories - todayStats.calories)}</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (todayStats.calories / nutritionGoal.targetCalories) * 100)}%` }}
                />
              </div>

              {/* Macros Mini */}
              <div className="flex justify-between mt-3 pt-3 border-t border-white/5 text-[10px] text-zinc-400 uppercase tracking-wide">
                <span>Prot: {todayStats.protein}g / {nutritionGoal.protein}g</span>
                <span>Carb: {todayStats.carbs}g / {nutritionGoal.carbs}g</span>
                <span>Fat: {todayStats.fat}g / {nutritionGoal.fats}g</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-6 pb-2">
            <button 
              onClick={onSetGoal}
              className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
            >
              <Target className="w-4 h-4" />
              Set Calorie Goal
            </button>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-500 space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <ScanLine className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm">No food logged yet</p>
            </div>
          ) : (
            Object.entries(groupedHistory).map(([date, group]) => (
              <div key={date} className="animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between px-2 mb-3">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{date}</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">{group.totalCals} kcal total</span>
                </div>
                
                <div className="space-y-2">
                  {group.items.map((item, i) => (
                    <div key={item.id || i} className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                          <Utensils className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white capitalize text-sm">{item.name}</div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
