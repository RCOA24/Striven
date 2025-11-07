import React, { useState, useEffect, useRef } from 'react';
import { X, HeartPulse, Dumbbell, Clock, PlayCircle, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

const fallbackImage = '/placeholder-exercise.jpg';

const parseInstructions = (html) => {
  if (!html) return { steps: [], tips: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract <ol> or <ul> as steps
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
        const action = strong ? strong.textContent.trim() : text.split(' ')[0] + ' ' + text.split(' ')[1];
        return { number: i + 1, action, text };
      });
  } else {
    // Fallback: split by sentences or numbers
    const raw = doc.body.textContent;
    const sentences = raw.split(/(?<=[\.!?])\s+/).filter(s => s.length > 10);
    steps = sentences.map((s, i) => ({
      number: i + 1,
      action: s.trim().split(' ')[0],
      text: s.trim()
    }));
  }

  // Look for common tip patterns
  const tipElements = doc.querySelectorAll('p');
  tipElements.forEach(p => {
    const text = p.textContent.toLowerCase();
    if (text.includes('tip') || text.includes('note') || text.includes('common mistake') || text.includes('avoid')) {
      tips.push(p.textContent.trim());
    }
  });

  return { steps, tips: tips.length > 0 ? tips : ['Keep your core engaged', 'Breathe out during the effort phase'] };
};

export default React.memo(function ExerciseModal({ exercise, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const modalRef = useRef(null);

  const videos = exercise?.videos || [];
  const images = exercise?.images || [];
  const { steps, tips } = parseInstructions(exercise?.description);

  const currentVideo = videos[currentVideoIndex];
  const currentImage = images[currentImageIndex]?.image || fallbackImage;

  // Auto-expand instructions on desktop
  useEffect(() => {
    const handleResize = () => setInstructionsOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard & focus trap
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

  if (!isOpen || !exercise) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-gradient-to-br from-black/95 via-emerald-950/40 to-black/95 rounded-3xl p-6 max-w-4xl w-full border border-emerald-500/30 max-h-[92vh] overflow-y-auto shadow-2xl outline-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 id="exercise-modal-title" className="text-3xl font-extrabold text-white mb-2">
              {exercise.name}
            </h3>
            <div className="flex items-center gap-3">
              <span className="inline-block bg-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-300 text-sm font-semibold border border-emerald-400/40">
                {exercise.category}
              </span>
              {exercise.difficulty && (
                <span className="text-xs text-white/60">• {exercise.difficulty}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all backdrop-blur-sm"
            aria-label="Close modal"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Hero Video */}
        {videos.length > 0 && (
          <div className="mb-8">
            <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-emerald-500/30 shadow-2xl">
              <video
                key={currentVideo.video}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full aspect-video"
                poster={images[0]?.image || fallbackImage}
              >
                <source src={currentVideo.video} type="video/mp4" />
              </video>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5">
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {currentVideo.duration || '??'}s
                  </span>
                  {currentVideo.width && (
                    <span>{currentVideo.width}×{currentVideo.height}</span>
                  )}
                </div>
              </div>
            </div>

            {videos.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {videos.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentVideoIndex(i)}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
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

        {/* Image Gallery with Swipe */}
        {images.length > 0 && (
          <div className="mb-8" {...swipeHandlers}>
            <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-emerald-500/30">
              <img
                src={currentImage}
                alt={`${exercise.name} - ${currentImageIndex + 1}/${images.length}`}
                className="w-full aspect-video object-contain bg-black"
                loading="lazy"
                onError={e => e.target.src = fallbackImage}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-emerald-600 rounded-full text-white transition-all shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-emerald-600 rounded-full text-white transition-all shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1.5 rounded-full text-white font-semibold text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-4 transition-all ${
                      i === currentImageIndex ? 'border-emerald-500 shadow-lg' : 'border-white/20 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img src={img.image || fallbackImage} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats – Always Perfectly Centered */}
<div className="mb-8">
  <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
    {/* Primary Muscles */}
    <div className="flex-1 min-w-[140px] max-w-[200px] bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
      <HeartPulse className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
      <div className="text-xs text-white/60">Primary</div>
      <div className="text-white font-bold">{exercise.muscles || '—'}</div>
    </div>

    {/* Equipment */}
    <div className="flex-1 min-w-[140px] max-w-[200px] bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
      <Dumbbell className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
      <div className="text-xs text-white/60">Equipment</div>
      <div className="text-white font-bold">{exercise.equipment || 'Bodyweight'}</div>
    </div>

    {/* Secondary Muscles – Only if exists */}
    {exercise.musclesSecondary && (
      <div className="flex-1 min-w-[140px] max-w-[200px] bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
        <HeartPulse className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <div className="text-xs text-white/60">Secondary</div>
        <div className="text-white font-bold text-sm">{exercise.musclesSecondary}</div>
      </div>
    )}

    {/* Type / Category */}
    <div className="flex-1 min-w-[140px] max-w-[200px] bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
      <Clock className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
      <div className="text-xs text-white/60">Type</div>
      <div className="text-white font-bold">{exercise.category}</div>
    </div>
  </div>
</div>

        {/* USER-FRIENDLY INSTRUCTIONS */}
        <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-2xl border border-emerald-500/40 overflow-hidden">
          <button
            onClick={() => setInstructionsOpen(!instructionsOpen)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">How to Perform {exercise.name}</h4>
              <span className="text-sm text-emerald-300 font-medium">{steps.length} steps</span>
            </div>
            {instructionsOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>

          {instructionsOpen && (
            <div className="px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <span className="font-bold text-emerald-300">{step.action}</span>
                    <p className="text-white/80 leading-relaxed">{step.text.replace(step.action, '').trim()}</p>
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
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
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
          <div className="mt-6">
            <h4 className="text-sm font-bold text-white/60 mb-3">Also known as:</h4>
            <div className="flex flex-wrap gap-2">
              {exercise.aliases.map((a, i) => (
                <span key={i} className="px-4 py-2 bg-white/10 rounded-full text-white/70 text-sm border border-white/20">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-4 mt-8">
          <button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 px-8 py-4 rounded-2xl text-black font-bold text-lg shadow-xl hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-98">
            ➕ Add to Today’s Workout
          </button>
          <button className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold border border-white/30 transition-all hover:scale-105">
            ❤️ Save Exercise
          </button>
        </div>

        {/* License */}
        {exercise.license && (
          <p className="mt-6 text-center text-xs text-white/40">
            Data licensed under {exercise.license}
          </p>
        )}
      </div>
    </div>
  );
});