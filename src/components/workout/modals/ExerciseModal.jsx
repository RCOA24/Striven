// src/modals/workout/ExerciseModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HeartPulse, Dumbbell, Clock, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, Plus, Heart, Loader2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import toast from 'react-hot-toast';
import { toggleFavorite, isFavorite } from '../../../utils/db';

const FALLBACK = 'https://via.placeholder.com/600x400/111/fff?text=No+Preview';

const parseInstructions = (html = '') => {
  if (!html.trim()) return { steps: [], tips: ['Stay tight', 'Control the descent', 'Explode up'] };
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const list = doc.querySelector('ol') || doc.querySelector('ul');
  let steps = [];
  if (list) {
    steps = Array.from(list.children)
      .filter(li => li.tagName === 'LI')
      .map((li, i) => ({
        number: i + 1,
        action: (li.querySelector('strong')?.textContent || li.textContent.split(':')[0]).trim(),
        text: li.textContent.trim()
      }));
  }
  const tips = Array.from(doc.querySelectorAll('p'))
    .filter(p => /tip|note|avoid|important|mistake|pro|common/i.test(p.textContent))
    .map(p => p.textContent.trim());
  return { steps, tips: tips.length ? tips : ['Keep core tight', 'Breathe out on effort', 'Full range of motion'] };
};

export const ExerciseModal = ({ isOpen, exercise, onClose, onQuickAdd }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [openInst, setOpenInst] = useState(true);
  const [fav, setFav] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // CRITICAL FIX: Prevent render if no exercise
  if (!isOpen || !exercise) return null;

  const images = exercise.images?.length > 0 
    ? exercise.images 
    : [{ image: exercise.gifUrl || FALLBACK }];

  const currentImg = images[imgIdx]?.image || FALLBACK;
  const { steps, tips } = parseInstructions(exercise.description || exercise.instructions);

  useEffect(() => {
    if (isOpen && exercise?.id) {
      isFavorite(exercise.id).then(setFav).catch(() => setFav(false));
      setImgIdx(0); // Reset GIF on open
    }
  }, [isOpen, exercise?.id]);

  const next = () => setImgIdx(i => (i + 1) % images.length);
  const prev = () => setImgIdx(i => (i - 1 + images.length) % images.length);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: prev,
    trackMouse: true,
    preventScrollOnSwipe: true,
    trackTouch: true
  });

  const addToday = async () => {
    if (!onQuickAdd) return;
    setAdding(true);
    try {
      await onQuickAdd(exercise);
      toast.success('Added to Today! 💪', { icon: '🎯' });
    } catch (err) {
      toast.error('Already in today\'s workout');
    } finally {
      setAdding(false);
    }
  };

  const toggleFav = async () => {
    setSaving(true);
    try {
      const newFav = await toggleFavorite(exercise);
      setFav(newFav);
      toast.success(newFav ? '❤️ Added to Favorites!' : '💔 Removed from Favorites', {
        icon: newFav ? '❤️' : '💔'
      });
    } catch {
      toast.error('Failed to update favorite');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && exercise && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-black/95 via-emerald-950/60 to-black/95 rounded-3xl p-8 max-w-5xl w-full max-h-[94vh] overflow-y-auto border-4 border-emerald-500/40 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all hover:scale-110"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Title */}
            <h2 className="text-5xl sm:text-6xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              {exercise.name || 'Exercise'}
            </h2>

            {/* GIF with Swipe */}
            <div
              className="relative rounded-3xl overflow-hidden mb-10 border-4 border-emerald-500/30 shadow-2xl"
              {...swipeHandlers}
            >
              <img
                src={currentImg}
                alt={exercise.name}
                className="w-full aspect-video object-cover"
                onError={e => e.target.src = FALLBACK}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/70 hover:bg-emerald-600 rounded-full transition-all"
                  >
                    <ChevronLeft className="w-10 h-10" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/70 hover:bg-emerald-600 rounded-full transition-all"
                  >
                    <ChevronRight className="w-10 h-10" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-2 rounded-full text-lg font-bold">
                    {imgIdx + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { icon: HeartPulse, label: 'Primary', value: exercise.muscles },
                { icon: Dumbbell, label: 'Equipment', value: exercise.equipment || 'Bodyweight' },
                { icon: HeartPulse, label: 'Secondary', value: exercise.musclesSecondary || '—' },
                { icon: Clock, label: 'Type', value: exercise.category || 'Strength' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 text-center border-2 border-white/20 hover:border-emerald-400/50 transition-all"
                >
                  <item.icon className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-white/60">{item.label}</p>
                  <p className="text-xl font-bold mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 rounded-3xl p-8 border-4 border-emerald-500/40 mb-12">
              <button
                onClick={() => setOpenInst(!openInst)}
                className="w-full flex justify-between items-center text-3xl font-bold hover:text-emerald-300 transition-all"
              >
                <span className="flex items-center gap-4">
                  <Info className="w-10 h-10" /> How to Perform
                </span>
                <ChevronDown className={`w-10 h-10 transition-transform ${openInst ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {openInst && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-8 space-y-8 overflow-hidden"
                  >
                    {steps.length > 0 ? (
                      steps.map((step) => (
                        <motion.div
                          key={step.number}
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: step.number * 0.1 }}
                          className="flex gap-6"
                        >
                          <div className="w-16 h-16 bg-emerald-500 text-black rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0">
                            {step.number}
                          </div>
                          <div>
                            <p className="text-emerald-300 font-bold text-xl">{step.action}</p>
                            <p className="text-white/80 text-lg leading-relaxed">{step.text}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-white/60 italic">No detailed instructions available.</p>
                    )}

                    {tips.length > 0 && (
                      <div className="mt-10 p-8 bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-3xl border-4 border-amber-500/50">
                        <h4 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-4">
                          <AlertCircle className="w-10 h-10" /> Pro Tips
                        </h4>
                        {tips.map((tip, i) => (
                          <p key={i} className="flex gap-4 text-lg mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-1" />
                            <span>{tip}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6">
              <button
                onClick={addToday}
                disabled={adding}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-8 rounded-3xl font-bold text-4xl text-black shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-4 disabled:opacity-70"
              >
                {adding ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-12 h-12" /> Add to Today
                  </>
                )}
              </button>

              <button
                onClick={toggleFav}
                disabled={saving}
                className={`p-8 rounded-3xl border-4 transition-all hover:scale-110 ${
                  fav
                    ? 'border-rose-500 bg-rose-500/20 shadow-rose-500/50'
                    : 'border-white/30 bg-white/10'
                }`}
              >
                <Heart className={`w-16 h-16 transition-all ${fav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};