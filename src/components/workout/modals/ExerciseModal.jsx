import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Plus, HeartPulse, Dumbbell } from 'lucide-react';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';

export const ExerciseModal = ({ isOpen, exercise, onClose, onQuickAdd, currentGifIndex, setCurrentGifIndex, handleTouchStart, handleTouchEnd }) => {
  if (!isOpen || !exercise) return null;

  const images = exercise.images || [];
  const currentImage = images.length > 0
    ? (images[currentGifIndex]?.image || exercise.gifUrl || FALLBACK_GIF)
    : (exercise.gifUrl || FALLBACK_GIF);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-br from-black/95 via-emerald-950/40 to-black/95 rounded-3xl p-6 max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-emerald-500/30 shadow-2xl scrollbar-hide"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-3xl font-extrabold text-white mb-2">{exercise.name}</h3>
            <div className="flex items-center gap-3">
              <span className="inline-block bg-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-300 text-sm font-semibold border border-emerald-400/40">
                {exercise.category}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <X className="w-7 h-7" />
          </button>
        </div>

        {exercise.images?.length > 0 && (
          <div className="mb-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-emerald-500/30">
              <img src={currentImage} alt="" className="w-full aspect-video object-contain bg-black" onError={e => e.target.src = FALLBACK_GIF} />
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentGifIndex(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-emerald-600 rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => setCurrentGifIndex(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-emerald-600 rounded-full">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1.5 rounded-full text-sm">
                    {currentGifIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex-1 min-w-[140px] bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
              <HeartPulse className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-xs text-white/60">Primary</div>
              <div className="text-white font-bold">{exercise.muscles || '—'}</div>
            </div>
            <div className="flex-1 min-w-[140px] bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
              <Dumbbell className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-xs text-white/60">Equipment</div>
              <div className="text-white font-bold">{exercise.equipment || 'Bodyweight'}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={() => onQuickAdd(exercise)} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 px-8 py-4 rounded-2xl text-black font-bold text-lg shadow-xl">
            <Plus className="w-6 h-6 inline mr-2" /> Add to Today’s Workout
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};