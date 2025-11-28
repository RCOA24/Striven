import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

// ✅ FIX 1: Use the local GIF from your /public folder
const FALLBACK_GIF = '/fallback-exercise.gif';

export const ExerciseCard = ({ exercise, onClick, onQuickAdd }) => {
  // ✅ FIX 2: Prioritize the 'previewImage' we added to the API logic, then the gifUrl
  const displayImage = exercise.previewImage || exercise.gifUrl || FALLBACK_GIF;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.03 }}
      className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-emerald-500/50"
      onClick={onClick}
    >
      <div className="relative h-40 bg-black/50">
        <img
          src={displayImage}
          alt={exercise.name}
          className="w-full h-full object-cover"
          // ✅ FIX 3: If the API link is 404, force the local GIF
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop
            e.target.src = FALLBACK_GIF;
          }}
        />
        <Heart className="absolute top-3 right-3 w-7 h-7 text-rose-500 fill-current" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm line-clamp-2">{exercise.name}</h3>
        <p className="text-emerald-400 text-xs">{exercise.muscles}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAdd(exercise); }}
          className="mt-3 w-full bg-emerald-500 hover:bg-emerald-400 py-2 rounded-xl font-bold text-xs transition-colors"
        >
          Quick Add
        </button>
      </div>
    </motion.div>
  );
};