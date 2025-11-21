import React, { useCallback, useMemo } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Dumbbell, Moon, Plus } from 'lucide-react';
import { ExerciseItem } from './ExerciseItem';

/**
 * Exercise list component for a specific workout day
 * Features:
 * - Drag and drop reordering
 * - Mobile-optimized scrolling
 * - Rest day state display
 * - Exercise indicators
 */
export const PlanExerciseList = React.memo(({ exercises, dayName, isRest, onReorder, onRemove }) => {
  // Removed slicing to allow full list visibility while relying on React.memo for performance
  
  const handleReorder = useCallback((newOrder) => {
    onReorder(newOrder);
  }, [onReorder]);

  const handleRemove = useCallback((i) => {
    onRemove(i);
  }, [onRemove]);

  const estimatedDuration = useMemo(() => exercises.length * 5, [exercises.length]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-black/20 min-h-0">
      {/* ═══ COMPACT HEADER ═══ */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-gray-900/95 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {dayName}
              </h3>
              {!isRest && exercises.length > 0 && (
                <p className="text-[11px] text-white/60">
                  {exercises.length} ex • ~{estimatedDuration} min
                </p>
              )}
            </div>
          </div>

          {isRest && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Moon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Rest</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SCROLLABLE LIST ═══ */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
          willChange: 'scroll-position'
        }}
      >
        {isRest ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center border border-gray-700/50">
                <Moon className="w-10 h-10 text-gray-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-400 mb-2">Rest Day</h4>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Recovery time for muscle growth
              </p>
            </div>
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Dumbbell className="w-10 h-10 text-emerald-400/40" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No Exercises</h4>
              <p className="text-sm text-white/50 max-w-xs mx-auto">
                Add exercises from search
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pb-20">
            <Reorder.Group axis="y" values={exercises} onReorder={handleReorder} className="space-y-2">
              {exercises.map((ex, i) => (
                <ExerciseItem 
                  key={`${ex.id || ex.exerciseId}-${i}`} 
                  ex={ex} 
                  index={i} 
                  onRemove={handleRemove} 
                />
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>
    </div>
  );
});
