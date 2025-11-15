import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { Dumbbell, Moon, Plus } from 'lucide-react';
import { ExerciseItem } from './ExerciseItem';

const MAX_VISIBLE_EXERCISES = 10;

/**
 * Exercise list component for a specific workout day
 * Features:
 * - Drag and drop reordering
 * - Mobile-optimized scrolling
 * - Rest day state display
 * - Exercise indicators
 */
export const PlanExerciseList = ({ exercises, dayName, isRest, onReorder, onRemove }) => {
  const visible = exercises.slice(0, MAX_VISIBLE_EXERCISES);
  const hiddenCount = exercises.length - MAX_VISIBLE_EXERCISES;

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gradient-to-b from-black/20 to-transparent min-h-0">
      {/* ═══ STICKY HEADER ═══ */}
      <div className="flex-shrink-0 p-4 lg:p-6 bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-transparent backdrop-blur-sm border-b border-white/10 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5 mb-1">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
              </div>
              {dayName}
            </h3>
            {!isRest && exercises.length > 0 && (
              <p className="text-sm text-white/60 ml-11">
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} • ~{exercises.length * 5} min
              </p>
            )}
          </div>

          {isRest && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50"
            >
              <Moon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 font-medium">Rest Day</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ═══ SCROLLABLE EXERCISE LIST ═══ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent min-h-0 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        {/* Rest Day State */}
        {isRest ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center h-full min-h-80"
          >
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center border border-gray-700/50">
                <Moon className="w-12 h-12 text-gray-500" />
              </div>
              <h4 className="text-xl font-semibold text-gray-400 mb-2">Rest Day</h4>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Recovery is essential for muscle growth and preventing injury
              </p>
            </div>
          </motion.div>
        ) : exercises.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center h-full min-h-80"
          >
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
                <Dumbbell className="w-12 h-12 text-emerald-400/40" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">No Exercises Yet</h4>
              <p className="text-sm text-white/50 max-w-xs mx-auto">
                Search and add exercises from the search panel
              </p>
            </div>
          </motion.div>
        ) : (
          // Exercise List with drag-and-drop
          <div className="space-y-3">
            <Reorder.Group axis="y" values={exercises} onReorder={onReorder} className="space-y-2.5">
              {visible.map((ex, i) => (
                <ExerciseItem 
                  key={`${ex.id || ex.exerciseId}-${i}`} 
                  ex={ex} 
                  index={i} 
                  onRemove={onRemove} 
                />
              ))}
            </Reorder.Group>

            {/* Hidden Exercises Indicator */}
            {hiddenCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <p className="text-emerald-300 text-sm font-semibold">
                    +{hiddenCount} more exercise{hiddenCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-xs text-emerald-400/60 mt-1">
                  Scroll to see all exercises in this workout
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
