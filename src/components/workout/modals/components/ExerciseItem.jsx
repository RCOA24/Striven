import React from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Trash2 } from 'lucide-react';
import { SafeExerciseImage } from './SafeExerciseImage';

/**
 * Individual exercise item component with drag-and-drop support
 * Displays exercise details and provides remove functionality
 */
export const ExerciseItem = ({ ex, index, onRemove }) => {
  const controls = useDragControls();
  
  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      className="group rounded-xl bg-gradient-to-r from-emerald-400/20 via-emerald-500/15 to-teal-500/20
                 ring-1 ring-white/10 active:ring-emerald-400/30
                 transition-all shadow-lg active:shadow-emerald-500/20"
    >
      <motion.div 
        className="rounded-xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl
                   p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-all active:bg-zinc-900/80"
        whileDrag={{
          scale: 1.02,
          boxShadow: '0 14px 28px rgba(16,185,129,0.35)',
        }}
      >
        {/* Larger Mobile Drag Handle */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onPointerDown={e => controls.start(e)}
          style={{ touchAction: 'none' }}
          className="cursor-grab active:cursor-grabbing p-2 rounded-lg
                     transition-all active:bg-emerald-500/10 ring-1 ring-transparent active:ring-emerald-500/30
                     touch-manipulation"
        >
          <GripVertical className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
        </motion.div>

        {/* Compact Order Badge */}
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 opacity-30 blur-md" />
          <div className="relative w-full h-full rounded-full bg-zinc-900/80 ring-1 ring-emerald-400/30 flex items-center justify-center">
            <span className="text-emerald-200 font-bold text-xs sm:text-sm">{index + 1}</span>
          </div>
        </div>

        {/* Compact Image */}
        <div className="relative flex-shrink-0 rounded-lg p-[1.5px] bg-gradient-to-br from-emerald-400/30 to-teal-500/30">
          <SafeExerciseImage 
            src={ex.gifUrl} 
            alt={ex.name} 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-white/10" 
          />
        </div>

        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs sm:text-sm text-white/90 truncate">
            {ex.name}
          </div>
          <div className="text-[11px] text-white/60 mt-0.5 flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
              {ex.sets || 4}×{ex.reps || 10}
            </span>
            <span className="text-white/30">•</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/70">
              {ex.rest || 90}s
            </span>
          </div>
        </div>

        {/* Larger Remove Button for Mobile */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onRemove(index)}
          className="p-2.5 sm:p-3 rounded-lg transition-all flex-shrink-0
                     ring-1 ring-transparent active:ring-red-500/40 active:bg-red-500/10
                     touch-manipulation"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-400/70 active:text-red-400" />
        </motion.button>
      </motion.div>
    </Reorder.Item>
  );
};
