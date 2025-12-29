// src/components/workout/modals/ExerciseModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, HeartPulse, Dumbbell, Clock, Info, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, AlertCircle, CheckCircle2, Plus, Heart, Loader2, Sparkles, Play 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { toggleFavorite, isFavorite } from '../../../utils/db';
import { fetchExerciseDetails } from '../../../api/exercises';

// ✅ FIX 1: Use local fallback GIF
const FALLBACK = '/fallback-exercise.gif';
const SAFETY_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%2327272a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2371717a'%3ENo Preview%3C/text%3E%3C/svg%3E";

// --- ✅ FIXED: ROBUST INSTRUCTION PARSER ---
const parseInstructions = (input) => {
  if (!input) return { steps: [], tips: [] };

  let steps = [];
  let tips = [];

  // 1. Check if it's HTML (contains tags)
  const isHTML = /<[a-z][\s\S]*>/i.test(input);

  if (isHTML) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    
    // Try to find list items first
    const listItems = doc.querySelectorAll('li');
    if (listItems.length > 0) {
      steps = Array.from(listItems).map((li, i) => ({
        number: i + 1,
        action: `Step ${i + 1}`,
        text: li.textContent.trim()
      }));
    } else {
      // If HTML but no list, grab paragraphs
      const paragraphs = doc.querySelectorAll('p');
      steps = Array.from(paragraphs)
        .map((p, i) => ({
          number: i + 1,
          action: `Step ${i + 1}`,
          text: p.textContent.trim()
        }))
        .filter(s => s.text.length > 5); // Filter empty p tags
    }
  } else {
    // 2. Handle Plain Text (ExerciseDB Standard)
    // Split by periods, but respect common abbreviations if possible.
    // We split by a period followed by a space to avoid splitting "approx." or "lbs." too aggressively
    const rawSentences = input.split(/\. (?=[A-Z])/); 

    steps = rawSentences.map((s, i) => {
      const cleanText = s.trim().replace(/\.$/, ''); // Remove trailing dot
      return {
        number: i + 1,
        // Smart Action: First 3 words or generic "Step X"
        action: `Step ${i + 1}`, 
        text: cleanText + '.' // Add dot back for grammar
      };
    }).filter(s => s.text.length > 3);
  }

  // 3. Extract "Pro Tips" keywords
  // We look for steps that start with specific words and move them to tips
  const cleanSteps = [];
  steps.forEach(step => {
    const lower = step.text.toLowerCase();
    if (lower.startsWith('tip:') || lower.startsWith('note:') || lower.includes('avoid:')) {
      tips.push(step.text.replace(/^(Tip:|Note:|Avoid:)\s*/i, ''));
    } else {
      cleanSteps.push({ ...step, number: cleanSteps.length + 1, action: `Step ${cleanSteps.length + 1}` });
    }
  });

  // 4. Fallback if parsing failed completely
  if (cleanSteps.length === 0 && input.length > 0) {
    cleanSteps.push({ number: 1, action: 'Instruction', text: input });
  }

  return { steps: cleanSteps, tips };
};

export default function ExerciseModal({ isOpen, exercise: initialExercise, onClose, onQuickAdd, showToast }) {
  const [exercise, setExercise] = useState(initialExercise);
  const [imgIdx, setImgIdx] = useState(0);
  const [instructionsOpen, setInstructionsOpen] = useState(true); 
  const [isFav, setIsFav] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useScrollLock(isOpen);

  // Reset state when opening new exercise
  useEffect(() => {
    if (isOpen) {
      setImgIdx(0);
      setImageLoaded(false);
      setInstructionsOpen(window.innerWidth >= 768);
    }
  }, [isOpen, initialExercise?.id]);

  // Check Favorite Status
  useEffect(() => {
    if (isOpen && initialExercise?.id) {
      isFavorite(initialExercise.id).then(setIsFav);
    }
  }, [isOpen, initialExercise?.id]);

  // Fetch Details
  useEffect(() => {
    if (!isOpen || !initialExercise?.id) return;

    const fetchFullExercise = async () => {
      try {
        setLoading(true);
        // Use RapidAPI details instead of Wger
        const data = await fetchExerciseDetails(initialExercise.id);
        
        if (data) {
          setExercise({
            ...initialExercise,
            ...data,
            // Ensure we keep the ID consistent
            id: initialExercise.id
          });
        } else {
          setExercise(initialExercise);
        }
      } catch (err) {
        console.warn('Using basic exercise data', err);
        setExercise(initialExercise);
      } finally {
        setLoading(false);
      }
    };

    fetchFullExercise();
  }, [isOpen, initialExercise]);

  // Memoized Instruction Parsing
  const parsedContent = useMemo(() => {
    // 1. Prefer Array Format (RapidAPI)
    if (Array.isArray(exercise?.instructions) && exercise.instructions.length > 0) {
      return {
        steps: exercise.instructions.map((inst, i) => ({
          number: i + 1,
          action: `Step ${i + 1}`,
          text: inst
        })),
        tips: []
      };
    }

    // 2. Fallback to Robust String Parsing
    return parseInstructions(exercise?.description || '');
  }, [exercise?.description, exercise?.instructions]);

  // Media Handlers
  const nextImg = () => {
    setImageLoaded(false);
    setImgIdx(i => (i + 1) % Math.max(exercise?.images?.length || 1, 1));
  };
  
  const prevImg = () => {
    setImageLoaded(false);
    setImgIdx(i => (i - 1 + (exercise?.images?.length || 1)) % Math.max(exercise?.images?.length || 1, 1));
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextImg,
    onSwipedRight: prevImg,
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  // Action Handlers
  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await onQuickAdd(exercise);
      showToast?.(`${exercise.name} added!`, 'success', 'muscle');
    } catch {
      showToast?.('Already added', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleFav = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const newFav = await toggleFavorite(exercise);
      setIsFav(newFav);
      showToast?.(newFav ? 'Added to Favorites' : 'Removed from Favorites', newFav ? 'success' : 'info', 'heart');
    } catch {
      showToast?.('Error updating favorites', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Image State Handling
  const getPrimaryImage = () => exercise?.images?.[imgIdx]?.image || exercise?.previewImage || exercise?.gifUrl || FALLBACK;
  const [displayImage, setDisplayImage] = useState(getPrimaryImage());

  useEffect(() => {
    setDisplayImage(getPrimaryImage());
    setImageLoaded(false);
  }, [imgIdx, exercise]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    if (displayImage === FALLBACK) {
      setDisplayImage(SAFETY_PLACEHOLDER);
    } else if (displayImage !== SAFETY_PLACEHOLDER) {
      setDisplayImage(FALLBACK);
    }
    setImageLoaded(true);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;
  const hasVideo = exercise?.videos?.length > 0;
  const hasMultipleImages = exercise?.images?.length > 1;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-4xl bg-[#1c1c1e] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden isolate"
            onClick={e => e.stopPropagation()}
          >
            {/* --- HEADER --- */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {exercise?.category || 'Exercise'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-1 pr-4">
                  {exercise?.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-300" />
              </button>
            </div>

            {/* --- SCROLLABLE CONTENT --- */}
            <div className="overflow-y-auto overflow-x-hidden p-5 pb-32 space-y-6 scrollbar-hide">
              
              {/* MEDIA PLAYER */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 shadow-lg ring-1 ring-white/5">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  </div>
                )}
                
                {hasVideo ? (
                  <div className="relative h-full w-full group">
                    <video 
                      controls 
                      autoPlay 
                      muted 
                      loop 
                      playsInline 
                      poster={displayImage} 
                      className="h-full w-full object-cover"
                    >
                      <source src={exercise.videos[0].video} type="video/mp4" />
                    </video>
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
                      <Play className="w-3 h-3 fill-white" /> Preview
                    </div>
                  </div>
                ) : (
                  <div {...swipeHandlers} className="relative h-full w-full">
                    {!imageLoaded && (
                      <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
                    )}
                    <img 
                      src={displayImage} 
                      alt={exercise?.name} 
                      className={`h-full w-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={handleImageError}
                    />
                    
                    {hasMultipleImages && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <button onClick={(e) => { e.stopPropagation(); prevImg(); }} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 backdrop-blur-sm"><ChevronLeft /></button>
                          <button onClick={(e) => { e.stopPropagation(); nextImg(); }} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 backdrop-blur-sm"><ChevronRight /></button>
                        </div>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {exercise.images.map((_, idx) => (
                            <div 
                              key={idx} 
                              className={`w-1.5 h-1.5 rounded-full transition-all ${idx === imgIdx ? 'bg-white w-3' : 'bg-white/40'}`} 
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox icon={HeartPulse} label="Target" value={exercise?.muscles} color="text-rose-400" />
                <StatBox icon={Dumbbell} label="Equipment" value={exercise?.equipment} color="text-blue-400" />
                <StatBox icon={Clock} label="Type" value={exercise?.category} color="text-amber-400" />
                <StatBox icon={Sparkles} label="Secondary" value={exercise?.musclesSecondary} color="text-purple-400" />
              </div>

              {/* INSTRUCTIONS */}
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
                        {parsedContent.steps.map((step) => (
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

                        {parsedContent.tips.length > 0 && (
                          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <h5 className="font-bold text-amber-400 text-sm mb-3 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" /> Pro Tips
                            </h5>
                            <ul className="space-y-2">
                              {parsedContent.tips.map((tip, i) => (
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

            {/* --- STICKY FOOTER --- */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#1c1c1e]/90 backdrop-blur-xl border-t border-white/10 z-30">
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {adding ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-6 h-6 stroke-[3]" />
                      Add to Workout
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFav}
                  disabled={saving}
                  className={`w-16 flex items-center justify-center rounded-2xl border transition-all ${
                    isFav 
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' 
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Heart className={`w-7 h-7 ${isFav ? 'fill-current' : ''}`} />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

const StatBox = ({ icon: Icon, label, value, color }) => (
  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 flex flex-col items-center text-center justify-center">
    <Icon className={`w-6 h-6 ${color} mb-2`} />
    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{label}</span>
    <span className="text-sm font-bold text-white truncate w-full px-1">{value || '—'}</span>
  </div>
);