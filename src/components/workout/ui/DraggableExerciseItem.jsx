import { Reorder } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';

export const DraggableExerciseItem = ({ exercise, index, onRemove }) => {
  return (
    <Reorder.Item key={exercise.id || exercise.exerciseId} value={exercise}>
      <motion.div layout className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-3 border border-white/10">
        <GripVertical className="text-white/30 cursor-grab w-6 h-6" />
        <span className="text-xl font-bold text-emerald-400 w-10">{index + 1}</span>
        <img
          src={exercise.gifUrl || FALLBACK_GIF}
          alt=""
          className="w-16 h-16 rounded-xl object-cover"
          onError={e => e.target.src = FALLBACK_GIF}
        />
        <div className="flex-1">
          <h3 className="font-bold">{exercise.name}</h3>
          <p className="text-white/60 text-sm">{exercise.muscles} • {exercise.equipment}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold">{exercise.sets || 4}×{exercise.reps || 10}</p>
          <p className="text-white/60">Rest {exercise.rest || 90}s</p>
        </div>
        <button onClick={() => onRemove(exercise.id || exercise.exerciseId)} className="text-red-400">
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </Reorder.Item>
  );
};