import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const FALLBACK_GIF = '/fallback-exercise.gif';
const SAFETY_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%2327272a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2371717a'%3ENo Preview%3C/text%3E%3C/svg%3E";

export const ExerciseCard = ({ exercise, onClick, onQuickAdd }) => {
  const [imgSrc, setImgSrc] = useState(exercise.previewImage || exercise.gifUrl || FALLBACK_GIF);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(exercise.previewImage || exercise.gifUrl || FALLBACK_GIF);
    setIsLoading(true);
  }, [exercise.previewImage, exercise.gifUrl]);

  const handleError = (e) => {
    e.target.onerror = null;
    if (imgSrc === FALLBACK_GIF) {
      setImgSrc(SAFETY_PLACEHOLDER);
    } else if (imgSrc !== SAFETY_PLACEHOLDER) {
      setImgSrc(FALLBACK_GIF);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.03 }}
      className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-emerald-500/50"
      onClick={onClick}
    >
      <div className="relative h-40 bg-black/50">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 z-10">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        )}
        <img
          src={imgSrc}
          alt={exercise.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={handleError}
        />
        <Heart className="absolute top-3 right-3 w-7 h-7 text-rose-500 fill-current z-20" />
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