// src/components/workout/modals/ExerciseModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, HeartPulse, Dumbbell, Clock, Info, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, AlertCircle, CheckCircle2, Plus, Heart, Loader2, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import toast from 'react-hot-toast';
import { toggleFavorite, isFavorite } from '../../../utils/db';

const FALLBACK = 'https://via.placeholder.com/600x400/111/fff?text=No+Preview';
const WGER_API = 'https://wger.de/api/v2';

export default function ExerciseModal({ isOpen, exercise: initialExercise, onClose, onQuickAdd }) {
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
    toast.success(`${exercise.name} added!`, {
      icon: 'Checkmark',
      duration: 3000,
      style: {
        background: 'linear-gradient(to right, #10b981, #34d399)',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '16px',
        padding: '14px 28px',
        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
      },
    });
  } catch {
    toast.error('Already in today', {
      icon: 'Cross',
      style: {
        background: 'linear-gradient(to right, #ef4444, #f87171)',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '16px',
        padding: '14px 28px',
        boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
      },
    });
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

    if (newFav) {
      toast.success('Saved to favorites!', {
        icon: 'Red Heart',
        duration: 3000,
        style: {
          background: 'linear-gradient(to right, #ec4899, #f43f5e)',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '16px',
          padding: '14px 28px',
          boxShadow: '0 10px 30px rgba(236, 72, 153, 0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
        },
      });
    } else {
      toast('Removed from favorites', {
        icon: 'Broken Heart',
        duration: 2500,
        style: {
          background: 'linear-gradient(to right, #6b7280, #9ca3af)',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '16px',
          padding: '14px 28px',
          boxShadow: '0 10px 30px rgba(107, 114, 128, 0.3)',
        },
      });
    }
  } catch {
    toast.error('Failed to update', {
      icon: 'Warning',
      style: {
        background: '#1f2937',
        color: '#fca5a5',
        border: '1px solid #ef4444',
      },
    });
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 100 }}
            className="relative w-full max-w-5xl mx-auto bg-gradient-to-br from-white/5 via-emerald-950/20 to-black/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl max-h-[94vh] overflow-y-auto md:max-w-4xl"
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
              className="absolute top-4 right-4 z-20 p-3 bg-white/10 hover:bg-white/20 rounded-full"
            >
              <X className="w-7 h-7 text-white" />
            </button>

            <div className="text-center pt-8 pb-6 px-6">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400">
                {exercise?.name}
              </h2>
              <div className="flex justify-center gap-3 mt-3">
                <span className="bg-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-300 font-bold text-sm border border-emerald-500/40">
                  {exercise?.category || exercise?.bodyPart}
                </span>
              </div>
            </div>

            <div className="px-6 pb-6">
              {hasVideo ? (
                <div className="relative rounded-2xl overflow-hidden border-4 border-emerald-500/30 shadow-2xl">
                  <video controls autoPlay muted loop playsInline poster={currentImg} className="w-full aspect-video">
                    <source src={exercise.videos[0].video} type="video/mp4" />
                  </video>
                  <div className="absolute top-3 left-3 bg-emerald-500 text-black px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> DEMO
                  </div>
                </div>
              ) : (
                <div {...swipe} className="relative rounded-2xl overflow-hidden border-4 border-emerald-500/30 shadow-2xl">
                  <img src={currentImg} alt={exercise?.name} className="w-full aspect-video object-cover" onError={e => e.target.src = FALLBACK} />
                  {exercise?.images?.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-emerald-600 rounded-full">
                        <ChevronLeft className="w-8 h-8" />
                      </button>
                      <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-emerald-600 rounded-full">
                        <ChevronRight className="w-8 h-8" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-5 py-1.5 rounded-full font-bold text-sm">
                        {imgIdx + 1} / {exercise.images.length}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-6">
              {[
                { icon: HeartPulse, label: 'Target', value: exercise?.muscles || '—' },
                { icon: Dumbbell, label: 'Equipment', value: exercise?.equipment || 'Bodyweight' },
                { icon: HeartPulse, label: 'Secondary', value: exercise?.musclesSecondary || '—' },
                { icon: Clock, label: 'Type', value: exercise?.category || 'Strength' },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 text-center border border-white/10">
                  <item.icon className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-white/60">{item.label}</p>
                  <p className="text-lg font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* INSTRUCTIONS — ALWAYS WORKS */}
            <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-2xl border border-emerald-500/40 overflow-hidden mx-6 mb-6">
              <button
                onClick={() => setInstructionsOpen(!instructionsOpen)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-6 h-6 text-emerald-400" />
                  <h4 className="text-xl font-bold text-white">How to Perform {exercise?.name}</h4>
                  <span className="text-sm text-emerald-300 font-medium">{steps.length} steps</span>
                </div>
                {instructionsOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </button>

              {instructionsOpen && (
                <div className="px-6 pb-6 space-y-5">
                  {steps.map((step) => (
                    <div key={step.number} className="flex gap-4">
                      <div className="w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                        {step.number}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <span className="font-bold text-emerald-300">{step.action}</span>
                        <p className="text-white/80 leading-relaxed">
                          {step.text.replace(step.action, '').trim()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {tips.length > 0 && (
                    <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="w-6 h-6 text-amber-400" />
                        <h5 className="font-bold text-amber-300">Pro Tips</h5>
                      </div>
                      <ul className="space-y-2">
                        {tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-white/80">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 px-6 pb-8">
              <button
                onClick={addToday}
                disabled={adding}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-5 rounded-2xl font-bold text-2xl text-black shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {adding ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Plus className="w-8 h-8" /> Add to Today</>}
              </button>

              <button
                onClick={toggleFav}
                disabled={saving}
                className={`p-5 rounded-2xl border-4 transition-all hover:scale-110 relative ${
                  isFav ? 'border-rose-500 bg-rose-500/20' : 'border-white/20 bg-white/10'
                }`}
              >
                <Heart className={`w-12 h-12 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                {saving && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl"><Loader2 className="w-7 h-7 animate-spin text-white" /></div>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}