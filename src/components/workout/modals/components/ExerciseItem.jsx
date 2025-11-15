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
      className="bg-gradient-to-r from-white/8 to-white/5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-emerald-500/10"
    >
      <motion.div 
        className="p-3.5 flex items-center gap-3"
        whileDrag={{ zIndex: 50, scale: 1.02, boxShadow: '0 12px 24px rgba(16,185,129,0.35)' }}
      >
        {/* Drag Handle */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          onPointerDown={e => controls.start(e)}
          style={{ touchAction: 'none' }}
          className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <GripVertical className="w-5 h-5 text-white/30" />
        </motion.div>

        {/* Order Badge */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-emerald-300 font-bold text-sm">{index + 1}</span>
        </div>

        {/* Exercise Image */}
        <SafeExerciseImage 
          src={ex.gifUrl} 
          alt={ex.name} 
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-white/10 shadow-md" 
        />

        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-white truncate">
            {ex.name}
          </div>
          <div className="text-xs text-white/50 mt-1 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">
              {ex.sets || 4} × {ex.reps || 10}
            </span>
            <span>•</span>
            <span>{ex.rest || 90}s rest</span>
          </div>
        </div>

        {/* Remove Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(index)}
          className="p-2.5 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0 group border border-transparent hover:border-red-500/30"
        >
          <Trash2 className="w-4 h-4 text-red-400/70 group-hover:text-red-400 transition-colors" />
        </motion.button>
      </motion.div>
    </Reorder.Item>
  );
};
