// src/components/ExerciseModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, HeartPulse, Dumbbell, Clock, PlayCircle, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Plus, Heart, Loader2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import toast, { Toaster } from 'react-hot-toast';
import { addToTodayWorkout, addToFavorites, removeFromFavorites, isFavorite, toggleFavorite } from '../utils/db';

const fallbackImage = '/placeholder-exercise.jpg';

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
    const sentences = raw.split(/(?<=[\.!?])\s+/).filter(s => s.length > 10);
    steps = sentences.map((s, i) => ({
      number: i + 1,
      action: s.trim().split(' ').slice(0, 2).join(' '),
      text: s.trim()
    }));
  }

  const tipElements = doc.querySelectorAll('p');
  tipElements.forEach(p => {
    const text = p.textContent.toLowerCase();
    if (text.includes('tip') || text.includes('note') || text.includes('common mistake') || text.includes('avoid') || text.includes('important')) {
      tips.push(p.textContent.trim());
    }
  });

  return {
    steps,
    tips: tips.length > 0 ? tips : ['Keep your core engaged throughout', 'Control the movement — don’t use momentum', 'Breathe out during the effort phase']
  };
};

export default React.memo(function ExerciseModal({ exercise, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [addingToWorkout, setAddingToWorkout] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const modalRef = useRef(null);

  const videos = exercise?.videos || [];
  const images = exercise?.images || [];
  const { steps, tips } = parseInstructions(exercise?.description);

  const currentVideo = videos[currentVideoIndex];
  const currentImage = images[currentImageIndex]?.image || fallbackImage;

  // Load favorite status
  useEffect(() => {
    if (exercise?.id) {
      isFavorite(exercise.id).then(setIsFav);
    }
  }, [exercise?.id]);

  // Auto-expand instructions on desktop
  useEffect(() => {
    const handleResize = () => setInstructionsOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKey);
    modalRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, currentImageIndex]);

  const nextImage = () => setCurrentImageIndex(i => (i + 1) % images.length);
  const prevImage = () => setCurrentImageIndex(i => (i - 1 + images.length) % images.length);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextImage,
    onSwipedRight: prevImage,
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  // Add to Today's Workout
  const handleAddToWorkout = async () => {
    if (addingToWorkout) return;
    setAddingToWorkout(true);
    try {
      await addToTodayWorkout(exercise);
      toast.custom((t) => (
        <div
          className={`pointer-events-auto mx-2 w-full max-w-md rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
            t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          } bg-gradient-to-br from-emerald-500/15 via-emerald-400/10 to-teal-400/15 border-emerald-400/30 shadow-[0_12px_40px_rgba(16,185,129,0.35)]`}
        >
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 rounded-t-2xl" />
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-black shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-white truncate">
                {exercise.name}
              </p>
              <p className="text-xs sm:text-sm text-emerald-200/80">
                Added to Today’s Workout
              </p>
            </div>
          </div>
        </div>
      ), { duration: 2200, position: 'top-center' });
    } catch (err) {
      toast.custom((t) => (
        <div
          className={`pointer-events-auto mx-2 w-full max-w-md rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
            t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          } bg-gradient-to-br from-rose-500/15 via-amber-500/10 to-rose-500/15 border-rose-400/30 shadow-[0_12px_40px_rgba(244,63,94,0.25)]`}
        >
          <div className="h-1 w-full bg-gradient-to-r from-rose-400 via-amber-300 to-pink-300 rounded-t-2xl" />
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-black shadow-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-white truncate">
                {exercise.name}
              </p>
              <p className="text-xs sm:text-sm text-rose-200/85">
                {err?.message || 'Already in Today’s Workout'}
              </p>
            </div>
          </div>
        </div>
      ), { duration: 2600, position: 'top-center' });
    } finally {
      setAddingToWorkout(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (savingFav) return;
    setSavingFav(true);
    try {
      const newFav = await toggleFavorite(exercise);
      setIsFav(newFav);

      if (newFav) {
        toast.custom((t) => (
          <div
            className={`pointer-events-auto mx-2 w-full max-w-md rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
              t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            } bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-fuchsia-500/15 border-rose-400/30 shadow-[0_12px_40px_rgba(236,72,153,0.28)]`}
            onClick={() => toast.dismiss(t.id)}
          >
            <div className="h-1 w-full bg-gradient-to-r from-rose-400 via-pink-300 to-fuchsia-300 rounded-t-2xl" />
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-black shadow-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-bold text-white truncate">
                  {exercise.name}
                </p>
                <p className="text-xs sm:text-sm text-rose-200/85">
                  Saved to Favorites
                </p>
              </div>
            </div>
          </div>
        ), { duration: 2200, position: 'top-center' });
      } else {
        toast.custom((t) => (
          <div
            className={`pointer-events-auto mx-2 w-full max-w-md rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
              t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            } bg-gradient-to-br from-slate-600/15 via-gray-600/10 to-slate-700/15 border-slate-400/30 shadow-[0_12px_40px_rgba(148,163,184,0.25)]`}
            onClick={() => toast.dismiss(t.id)}
          >
            <div className="h-1 w-full bg-gradient-to-r from-slate-300 via-gray-300 to-zinc-300 rounded-t-2xl" />
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-gray-600 text-white shadow-lg">
                <Heart className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-bold text-white truncate">
                  {exercise.name}
                </p>
                <p className="text-xs sm:text-sm text-slate-200/85">
                  Removed from Favorites
                </p>
              </div>
            </div>
          </div>
        ), { duration: 2200, position: 'top-center' });
      }
    } catch (err) {
      toast.custom((t) => (
        <div
          className={`pointer-events-auto mx-2 w-full max-w-md rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
            t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          } bg-gradient-to-br from-rose-500/15 via-amber-500/10 to-rose-500/15 border-rose-400/30 shadow-[0_12px_40px_rgba(244,63,94,0.25)]`}
          onClick={() => toast.dismiss(t.id)}
        >
          <div className="h-1 w-full bg-gradient-to-r from-rose-400 via-amber-300 to-pink-300 rounded-t-2xl" />
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-black shadow-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-white truncate">
                Favorites
              </p>
              <p className="text-xs sm:text-sm text-rose-200/85">
                Failed to update Favorites
              </p>
            </div>
          </div>
        </div>
      ), { duration: 2600, position: 'top-center' });
    } finally {
      setSavingFav(false);
    }
  };

  if (!isOpen || !exercise) return null;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <div
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto overflow-x-hidden overscroll-contain"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-modal-title"
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className="bg-gradient-to-br from-black/95 via-emerald-950/40 to-black/95 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-4xl w-full border border-emerald-500/30 max-h-[90vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl outline-none scrollbar-hide"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="min-w-0">
              <h3 id="exercise-modal-title" className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-1 sm:mb-2 break-words">
                {exercise.name}
              </h3>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="inline-block bg-emerald-500/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-emerald-300 text-xs sm:text-sm font-semibold border border-emerald-400/40">
                  {exercise.category}
                </span>
                {exercise.difficulty && (
                  <span className="text-[11px] sm:text-xs text-white/60">• {exercise.difficulty}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>

          {/* Hero Video */}
          {videos.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-black/50 border border-emerald-500/30 shadow-2xl">
                <video
                  key={currentVideo?.video}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full aspect-video"
                  poster={images[0]?.image || fallbackImage}
                >
                  <source src={currentVideo?.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {videos.length > 1 && (
                <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {videos.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentVideoIndex(i)}
                      className={`flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                        i === currentVideoIndex
                          ? 'bg-emerald-500 text-black shadow-lg'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Angle {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="mb-6 sm:mb-8" {...swipeHandlers}>
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-black/40 border border-emerald-500/30">
                <img
                  src={currentImage}
                  alt={`${exercise.name} - ${currentImageIndex + 1}/${images.length}`}
                  className="w-full aspect-video object-contain bg-black"
                  loading="lazy"
                  onError={e => e.target.src = fallbackImage}
                />
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/70 hover:bg-emerald-600 rounded-full text-white shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/70 hover:bg-emerald-600 rounded-full text-white shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-3 sm:px-4 py-1 rounded-full text-white font-semibold text-xs sm:text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                        i === currentImageIndex ? 'border-emerald-500 shadow-lg' : 'border-white/20 opacity-70 hover:opacity-90'
                      }`}
                    >
                      <img src={img.image || fallbackImage} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats – Centered */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
              <div className="flex-1 min-w-[120px] max-w-[200px] bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 text-center">
                <HeartPulse className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-1.5 sm:mb-2" />
                <div className="text-[11px] sm:text-xs text-white/60">Primary</div>
                <div className="text-white font-bold text-sm sm:text-base">{exercise.muscles || '—'}</div>
              </div>

              <div className="flex-1 min-w-[120px] max-w-[200px] bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 text-center">
                <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-1.5 sm:mb-2" />
                <div className="text-[11px] sm:text-xs text-white/60">Equipment</div>
                <div className="text-white font-bold text-sm sm:text-base">{exercise.equipment || 'Bodyweight'}</div>
              </div>

              {exercise.musclesSecondary && (
                <div className="flex-1 min-w-[120px] max-w-[200px] bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 text-center">
                  <HeartPulse className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mx-auto mb-1.5 sm:mb-2" />
                  <div className="text-[11px] sm:text-xs text-white/60">Secondary</div>
                  <div className="text-white font-bold text-xs sm:text-sm">{exercise.musclesSecondary}</div>
                </div>
              )}

              <div className="flex-1 min-w-[120px] max-w-[200px] bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 text-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-1.5 sm:mb-2" />
                <div className="text-[11px] sm:text-xs text-white/60">Type</div>
                <div className="text-white font-bold text-sm sm:text-base">{exercise.category}</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-xl sm:rounded-2xl border border-emerald-500/40 overflow-hidden">
            <button
              onClick={() => setInstructionsOpen(!instructionsOpen)}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-white/5 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Info className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 flex-shrink-0" />
                <h4 className="text-lg sm:text-xl font-bold text-white truncate">How to Perform {exercise.name}</h4>
                <span className="text-xs sm:text-sm text-emerald-300 font-medium whitespace-nowrap">{steps.length} steps</span>
              </div>
              {instructionsOpen ? <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {instructionsOpen && (
              <div className="px-4 sm:px-6 pb-5 sm:pb-6 space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                {steps.map((step) => (
                  <div key={step.number} className="flex gap-3 sm:gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-lg">
                      {step.number}
                    </div>
                    <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
                      <span className="block font-bold text-emerald-300 text-sm sm:text-base truncate">{step.action}</span>
                      <p className="text-white/80 leading-relaxed text-sm sm:text-base break-words">{step.text.replace(step.action, '').trim()}</p>
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
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aliases */}
          {exercise.aliases?.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h4 className="text-xs sm:text-sm font-bold text-white/60 mb-2 sm:mb-3">Also known as:</h4>
              <div className="flex flex-wrap gap-2">
                {exercise.aliases.map((a, i) => (
                  <span key={i} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full text-white/70 text-xs sm:text-sm border border-white/20">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
            <button
              onClick={handleAddToWorkout}
              disabled={addingToWorkout}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-black font-bold text-base sm:text-lg shadow-xl hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              {addingToWorkout ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              Add to Today’s Workout
            </button>

            <button
              onClick={handleToggleFavorite}
              disabled={savingFav}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold border-2 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 sm:gap-3 justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                isFav
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 hover:bg-rose-500/30'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              } disabled:opacity-50`}
            >
              {savingFav ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isFav ? (
                <>
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                  Saved
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                  Save Exercise
                </>
              )}
            </button>
          </div>

          {/* License */}
          {exercise.license && (
            <p className="mt-4 sm:mt-6 text-center text-[11px] sm:text-xs text-white/40">
              Data licensed under {exercise.license}
            </p>
          )}
        </div>
      </div>
    </>
  );
});