// src/components/ExerciseModal.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, HeartPulse, Dumbbell, Clock, PlayCircle, Info, ChevronLeft, ChevronRight, 
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Plus, Heart, Loader2, Sparkles, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import toast, { Toaster } from 'react-hot-toast';
import { addToTodayWorkout, addToFavorites, removeFromFavorites, isFavorite, toggleFavorite } from '../utils/db';

const FALLBACK = 'https://via.placeholder.com/600x400/111/fff?text=No+Preview';

// --- Scroll Lock Hook ---
const useScrollLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);
};

// --- Instruction Parser (Memoized inside component) ---
const parseInstructions = (html) => {
  if (!html) return { steps: [], tips: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const ol = doc.querySelector('ol');
  const ul = doc.querySelector('ul');
  const list = ol || ul;

  let steps = [];
  let tips = [];

  if (list) {
    steps = Array.from(list.children)
      .filter(el => el.tagName === 'LI')
      .map((li, i) => {
        const text = li.textContent.trim();
        const strong = li.querySelector('strong');
        const action = strong ? strong.textContent.trim() : text.split(' ').slice(0, 2).join(' ');
        return { number: i + 1, action, text };
      });
  } else {
    const raw = doc.body.textContent;
    // Improved sentence splitting logic
    const sentences = raw.split(/(?<=[\.!?])\s+/).filter(s => s.length > 10);
    steps = sentences.map((s, i) => ({
      number: i + 1,
      action: `Step ${i + 1}`,
      text: s.trim()
    }));
  }

  const tipElements = doc.querySelectorAll('p');
  tipElements.forEach(p => {
    const text = p.textContent.toLowerCase();
    if (text.match(/tip|note|common mistake|avoid|important/)) {
      tips.push(p.textContent.replace(/tip:|note:/i, '').trim());
    }
  });

  return {
    steps: steps.length > 0 ? steps : [{ number: 1, action: 'Info', text: 'See video for details.' }],
    tips: tips.length > 0 ? tips : ['Keep core engaged', 'Control the movement', 'Breathe consistently']
  };
};

// --- Main Component ---
const ExerciseModal = ({ exercise, isOpen, onClose }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [vidIdx, setVidIdx] = useState(0);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  useScrollLock(isOpen);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setImgIdx(0);
      setVidIdx(0);
      setImgLoaded(false);
      setInstructionsOpen(window.innerWidth >= 768);
      if (exercise?.id) isFavorite(exercise.id).then(setIsFav);
    }
  }, [isOpen, exercise]);

  const videos = exercise?.videos || [];
  const images = exercise?.images || [];
  
  // Memoize expensive parsing
  const { steps, tips } = useMemo(() => 
    parseInstructions(exercise?.description), 
  [exercise?.description]);

  const currentVideo = videos[vidIdx];
  const currentImage = images[imgIdx]?.image || exercise?.gifUrl || FALLBACK;

  // Navigation
  const nextImg = () => { setImgLoaded(false); setImgIdx(i => (i + 1) % images.length); };
  const prevImg = () => { setImgLoaded(false); setImgIdx(i => (i - 1 + images.length) % images.length); };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextImg,
    onSwipedRight: prevImg,
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  // Handlers
  const handleAddToWorkout = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await addToTodayWorkout(exercise);
      // Custom Apple-style Toast
      toast.custom((t) => (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.9 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
        >
          <div className="bg-emerald-500 text-black p-2 rounded-full"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <div className="text-white font-bold text-sm">Added to Workout</div>
            <div className="text-white/60 text-xs">{exercise.name}</div>
          </div>
        </motion.div>
      ), { duration: 2000 });
    } catch (err) {
      toast.error('Already in today\'s workout');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleFav = async () => {
    if (savingFav) return;
    setSavingFav(true);
    try {
      const newFav = await toggleFavorite(exercise);
      setIsFav(newFav);
      
      const message = newFav ? 'Saved to Favorites' : 'Removed from Favorites';
      toast.custom((t) => (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.9 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
        >
          <div className={`p-2 rounded-full ${newFav ? 'bg-rose-500 text-white' : 'bg-zinc-600 text-white'}`}>
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{message}</div>
            <div className="text-white/60 text-xs">{exercise.name}</div>
          </div>
        </motion.div>
      ), { duration: 2000 });

    } catch {
      toast.error('Failed to update favorites');
    } finally {
      setSavingFav(false);
    }
  };

  if (!isOpen || !exercise) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <Toaster position="top-center" />
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl bg-[#1c1c1e] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden isolate"
              onClick={e => e.stopPropagation()}
            >
              {/* --- Sticky Header --- */}
              <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-[#1c1c1e]/90 backdrop-blur-xl border-b border-white/5">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">
                    {exercise.category}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate pr-4">
                    {exercise.name}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-300" />
                </button>
              </div>

              {/* --- Scrollable Content --- */}
              <div className="overflow-y-auto overflow-x-hidden p-5 pb-32 space-y-6 scrollbar-hide">
                
                {/* Media Section */}
                <div className="space-y-4">
                  {/* Video Player */}
                  {videos.length > 0 && (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 shadow-lg ring-1 ring-white/5">
                      <video
                        key={currentVideo?.video}
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster={currentImage}
                        className="h-full w-full object-cover"
                      >
                        <source src={currentVideo?.video} type="video/mp4" />
                      </video>
                      {videos.length > 1 && (
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          {videos.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setVidIdx(i)}
                              className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                                i === vidIdx ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black/50 text-white border-white/20'
                              }`}
                            >
                              Angle {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image Gallery (if no video or auxiliary) */}
                  {(!videos.length && images.length > 0) && (
                    <div {...swipeHandlers} className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 shadow-lg ring-1 ring-white/5 group">
                      {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                          <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                        </div>
                      )}
                      <img
                        src={currentImage}
                        alt={exercise.name}
                        className={`h-full w-full object-contain transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImgLoaded(true)}
                        onError={(e) => { e.target.src = FALLBACK; setImgLoaded(true); }}
                      />
                      
                      {images.length > 1 && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={(e) => { e.stopPropagation(); prevImg(); }} className="p-2 bg-black/50 rounded-full text-white backdrop-blur-sm"><ChevronLeft /></button>
                            <button onClick={(e) => { e.stopPropagation(); nextImg(); }} className="p-2 bg-black/50 rounded-full text-white backdrop-blur-sm"><ChevronRight /></button>
                          </div>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-3' : 'bg-white/40'}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox icon={HeartPulse} label="Target" value={exercise.muscles} color="text-rose-400" />
                  <StatBox icon={Dumbbell} label="Equipment" value={exercise.equipment} color="text-blue-400" />
                  <StatBox icon={Clock} label="Type" value={exercise.category} color="text-amber-400" />
                  <StatBox icon={Sparkles} label="Secondary" value={exercise.musclesSecondary} color="text-purple-400" />
                </div>

                {/* Instructions Accordion */}
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setInstructionsOpen(!instructionsOpen)}
                    className="w-full p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/20 p-2 rounded-lg">
                        <Info className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="font-bold text-white text-lg">Instructions</span>
                    </div>
                    {instructionsOpen ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                  </button>

                  <AnimatePresence>
                    {instructionsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5"
                      >
                        <div className="p-5 space-y-6">
                          {steps.map((step) => (
                            <div key={step.number} className="flex gap-4">
                              <div className="flex flex-col items-center gap-1">
                                <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold flex items-center justify-center text-zinc-300">
                                  {step.number}
                                </span>
                                <div className="w-0.5 flex-1 bg-zinc-800 my-1 last:hidden" />
                              </div>
                              <div className="pb-2">
                                <h4 className="font-bold text-white text-sm mb-1">{step.action}</h4>
                                <p className="text-zinc-400 text-sm leading-relaxed">{step.text}</p>
                              </div>
                            </div>
                          ))}

                          {tips.length > 0 && (
                            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                              <h5 className="font-bold text-amber-400 text-sm mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Pro Tips
                              </h5>
                              <ul className="space-y-2">
                                {tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-amber-200/80">
                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* --- Sticky Footer --- */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#1c1c1e]/90 backdrop-blur-xl border-t border-white/10 z-30">
                <div className="flex gap-3">
                  {/* Add Button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddToWorkout}
                    disabled={adding}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg py-3.5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                  >
                    {adding ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6 stroke-[3]" /> Add to Workout</>}
                  </motion.button>

                  {/* Fav Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleFav}
                    disabled={savingFav}
                    className={`w-16 flex items-center justify-center rounded-2xl border transition-all ${
                      isFav 
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {savingFav ? <Loader2 className="w-6 h-6 animate-spin" /> : <Heart className={`w-7 h-7 ${isFav ? 'fill-current' : ''}`} />}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
};

// Helper for stats
const StatBox = ({ icon: Icon, label, value, color }) => (
  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 flex flex-col items-center text-center justify-center">
    <Icon className={`w-6 h-6 ${color} mb-2`} />
    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{label}</span>
    <span className="text-sm font-bold text-white truncate w-full px-1">{value || '—'}</span>
  </div>
);

export default React.memo(ExerciseModal);