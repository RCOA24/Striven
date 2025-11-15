// src/components/workout/modals/ExerciseModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, HeartPulse, Dumbbell, Clock, Info, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, AlertCircle, CheckCircle2, Plus, Heart, Loader2, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { toggleFavorite, isFavorite } from '../../../utils/db';

const FALLBACK = 'https://via.placeholder.com/600x400/111/fff?text=No+Preview';
const WGER_API = 'https://wger.de/api/v2';

export default function ExerciseModal({ isOpen, exercise: initialExercise, onClose, onQuickAdd, showToast }) {
  const [exercise, setExercise] = useState(initialExercise);
  const [imgIdx, setImgIdx] = useState(0);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // FETCH FULL EXERCISE WITH DESCRIPTION
  useEffect(() => {
    if (!isOpen || !initialExercise?.id) return;

    const fetchFullExercise = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${WGER_API}/exerciseinfo/${initialExercise.id}/`);
        const data = await res.json();

        const fullExercise = {
          ...initialExercise,
          description: data.description || '',
          images: data.images || initialExercise.images || [],
          videos: data.videos || initialExercise.videos || []
        };

        setExercise(fullExercise);
      } catch (err) {
        console.warn('Failed to load full exercise, using fallback', err);
        setExercise({
          ...initialExercise,
          description: '<p>Stand with feet shoulder-width apart. Engage core. Breathe out on effort.</p>',
          images: initialExercise.images || [],
          videos: initialExercise.videos || []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFullExercise();
  }, [isOpen, initialExercise]);

  // PARSE INSTRUCTIONS (BULLETPROOF)
  const parseInstructions = (html = '') => {
    if (!html.trim()) {
      return {
        steps: [
          { number: 1, action: 'Stand tall', text: 'Feet shoulder-width apart, chest up' },
          { number: 2, action: 'Engage core', text: 'Tighten abs like bracing for a punch' },
          { number: 3, action: 'Move slowly', text: 'Control every rep — no momentum' }
        ],
        tips: ['Breathe out on effort', 'Keep back neutral', 'Film your form']
      };
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const list = doc.querySelector('ol') || doc.querySelector('ul');
    const steps = [];
    const tips = [];

    if (list) {
      Array.from(list.children)
        .filter(li => li.tagName === 'LI')
        .forEach((li, i) => {
          const text = li.textContent.trim();
          const action = li.querySelector('strong')?.textContent.trim() || 
                        text.split(' ').slice(0, 2).join(' ');
          steps.push({ number: i + 1, action, text });
        });
    }

    doc.querySelectorAll('p').forEach(p => {
      const txt = p.textContent.toLowerCase();
      if (/tip|note|avoid|mistake|important|pro|common/i.test(txt)) {
        tips.push(p.textContent.trim());
      }
    });

    return {
      steps: steps.length ? steps : [
        { number: 1, action: 'Set up', text: 'Position yourself correctly' },
        { number: 2, action: 'Execute', text: 'Perform the movement with control' }
      ],
      tips: tips.length ? tips : ['Focus on form', 'Progress slowly']
    };
  };

  const { steps, tips } = parseInstructions(exercise?.description);

  // Load favorite
  useEffect(() => {
    if (isOpen && exercise?.id) {
      isFavorite(exercise.id).then(setIsFav);
    }
  }, [isOpen, exercise?.id]);

  // Auto-open on desktop
  useEffect(() => {
    const update = () => setInstructionsOpen(window.innerWidth >= 768);
    if (isOpen) {
      update();
      window.addEventListener('resize', update);
    }
    return () => window.removeEventListener('resize', update);
  }, [isOpen]);

  // Navigation
  const nextImg = () => setImgIdx(i => (i + 1) % Math.max(exercise?.images?.length || 1, 1));
  const prevImg = () => setImgIdx(i => (i - 1 + (exercise?.images?.length || 1)) % Math.max(exercise?.images?.length || 1, 1));

  const swipe = useSwipeable({
    onSwipedLeft: nextImg,
    onSwipedRight: prevImg,
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const addToday = async () => {
    if (!onQuickAdd || adding) return;
    setAdding(true);
    try {
      await onQuickAdd(exercise);
      if (showToast) {
        showToast(`${exercise.name} added to workout!`, 'success', 'muscle');
      }
    } catch {
      if (showToast) {
        showToast('Already in today\'s workout', 'error');
      }
    } finally {
      setAdding(false);
    }
  };

  const toggleFav = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const newFav = await toggleFavorite(exercise);
      setIsFav(newFav);

      if (showToast) {
        if (newFav) {
          showToast(`Added ${exercise.name} to Favorites!`, 'success', 'muscle');
        } else {
          showToast(`Removed ${exercise.name} from Favorites`, 'info', 'trash');
        }
      }
    } catch (error) {
      if (showToast) {
        showToast('Failed to update Favorites', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentImg = exercise?.images?.[imgIdx]?.image || exercise?.gifUrl || FALLBACK;
  const hasVideo = exercise?.videos?.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-3xl overflow-x-hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 100 }}
            className="relative w-full max-w-lg sm:max-w-2xl md:max-w-4xl mx-auto bg-gradient-to-br from-white/5 via-emerald-950/20 to-black/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl max-h-[90vh] sm:max-h-[94vh] overflow-y-auto overflow-x-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
              </div>
            )}

            <button
              onClick={onClose}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>

            <div className="text-center pt-6 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-6">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 break-words">
                {exercise?.name}
              </h2>
              <div className="flex justify-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                <span className="bg-emerald-500/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-500/40">
                  {exercise?.category || exercise?.bodyPart}
                </span>
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              {hasVideo ? (
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-emerald-500/30 shadow-2xl">
                  <video controls autoPlay muted loop playsInline poster={currentImg} className="w-full aspect-video">
                    <source src={exercise.videos[0].video} type="video/mp4" />
                  </video>
                  <div className="absolute top-3 left-3 bg-emerald-500 text-black px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> DEMO
                  </div>
                </div>
              ) : (
                <div {...swipe} className="relative rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-emerald-500/30 shadow-2xl">
                  <img src={currentImg} alt={exercise?.name} className="w-full aspect-video object-cover" onError={e => e.target.src = FALLBACK} />
                  {exercise?.images?.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/70 hover:bg-emerald-600 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
                        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                      </button>
                      <button onClick={nextImg} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/70 hover:bg-emerald-600 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
                        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                      </button>
                      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-3 sm:px-5 py-1 rounded-full font-bold text-xs sm:text-sm">
                        {imgIdx + 1} / {exercise.images.length}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 pb-4 sm:pb-6">
            {[
              { icon: HeartPulse, label: 'Target', value: exercise?.muscles || '—' },
              { icon: Dumbbell, label: 'Equipment', value: exercise?.equipment || 'Bodyweight' },
              { icon: HeartPulse, label: 'Secondary', value: exercise?.musclesSecondary || '—' },
              { icon: Clock, label: 'Type', value: exercise?.category || 'Strength' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border border-white/10">
                <item.icon className="w-7 h-7 sm:w-10 sm:h-10 text-emerald-400 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-[11px] sm:text-xs text-white/60">{item.label}</p>
                <p className="text-sm sm:text-lg font-bold text-white break-words">{item.value}</p>
              </div>
            ))}
          </div>

            {/* INSTRUCTIONS */}
            <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-xl sm:rounded-2xl border border-emerald-500/40 overflow-hidden mx-4 sm:mx-6 mb-4 sm:mb-6">
              <button
                onClick={() => setInstructionsOpen(!instructionsOpen)}
                className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-white/5 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Info className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 flex-shrink-0" />
                  <h4 className="text-lg sm:text-xl font-bold text-white truncate">How to Perform {exercise?.name}</h4>
                  <span className="text-xs sm:text-sm text-emerald-300 font-medium whitespace-nowrap">{steps.length} steps</span>
                </div>
                {instructionsOpen ? <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

              {instructionsOpen && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
                  {steps.map((step) => (
                    <div key={step.number} className="flex gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-lg">
                        {step.number}
                      </div>
                      <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
                        <span className="block font-bold text-emerald-300 text-sm sm:text-base truncate">{step.action}</span>
                        <p className="text-white/80 leading-relaxed text-sm sm:text-base break-words">
                          {step.text.replace(step.action, '').trim()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {tips.length > 0 && (
                    <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-amber-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                        <h5 className="font-bold text-amber-300 text-sm sm:text-base">Pro Tips</h5>
                      </div>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-white/80 text-sm sm:text-base">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mt-0.5" />
                            <span className="break-words">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-4 sm:px-6 pb-6 sm:pb-8">
              <button
                onClick={addToday}
                disabled={adding}
                className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-xl sm:text-2xl text-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                {adding ? <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" /> : <><Plus className="w-6 h-6 sm:w-8 sm:h-8" /> Add to Today</>}
              </button>

              <button
                onClick={toggleFav}
                disabled={saving}
                className={`w-full sm:w-auto px-4 sm:px-5 py-4 sm:py-5 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all hover:scale-[1.02] active:scale-95 relative shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 flex items-center justify-center gap-2 sm:gap-3 ${
                  isFav 
                    ? 'border-rose-500 bg-gradient-to-br from-rose-500/30 to-pink-500/20 shadow-rose-500/50' 
                    : 'border-white/20 bg-white/10 hover:border-white/30'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-white" />
                ) : (
                  <>
                    <Heart 
                      className={`w-6 h-6 sm:w-8 sm:h-8 transition-all ${
                        isFav 
                          ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' 
                          : 'text-white/70'
                      }`} 
                    />
                    <span className="font-bold text-lg sm:text-xl text-white">
                      Remove from Favorites
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}