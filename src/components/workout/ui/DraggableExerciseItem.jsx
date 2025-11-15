import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';

export const DraggableExerciseItem = ({ exercise, index, onRemove, onDragEnd }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={exercise}
      onDragEnd={onDragEnd}
      dragListener={false}
      dragControls={controls}
    >
      <motion.div
        layout="position"
        whileHover={{ scale: 1.01 }}
        className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-3 border border-white/10"
      >
        <button
          onPointerDown={(e) => controls.start(e)}
          className="shrink-0 p-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors cursor-grab touch-none"
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical className="text-white/60 w-6 h-6" />
        </button>

        <span className="text-xl font-bold text-emerald-400 w-10 text-center">{index + 1}</span>

        <img
          src={exercise.gifUrl || FALLBACK_GIF}
          alt={exercise.name || 'Exercise'}
          className="w-16 h-16 rounded-xl object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.src = FALLBACK_GIF; }}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate">{exercise.name}</h3>
          <p className="text-white/60 text-sm truncate">{exercise.muscles} • {exercise.equipment}</p>
        </div>

        <div className="text-right text-sm">
          <p className="font-bold">{exercise.sets || 4}×{exercise.reps || 10}</p>
          <p className="text-white/60">Rest {exercise.rest || 90}s</p>
        </div>

        <button
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(exercise.id); }}
          className="text-red-400 p-2 rounded-lg hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
          title="Remove"
          aria-label={`Remove ${exercise.name || 'exercise'}`}
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </Reorder.Item>
  );
};