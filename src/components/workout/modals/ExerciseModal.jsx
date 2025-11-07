import React, { useState, useEffect, useRef } from 'react';
import { X, HeartPulse, Dumbbell, Clock, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Plus, Heart, Loader2 } from 'lucide-react';
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
        action: (li.querySelector('strong')?.textContent || li.textContent.split(' ')[0] + ' ' + li.textContent.split(' ')[1]).trim(),
        text: li.textContent.trim()
      }));
  }
  const tips = Array.from(doc.querySelectorAll('p'))
    .filter(p => /tip|note|avoid|important|mistake/i.test(p.textContent))
    .map(p => p.textContent.trim());
  return { steps, tips: tips.length ? tips : ['Keep form strict', 'Breathe out on effort'] };
};

export const ExerciseModal = ({ isOpen, exercise, onClose, onQuickAdd }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [openInst, setOpenInst] = useState(true);
  const [fav, setFav] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // SAFE ACCESS
  if (!exercise) return null;

  const images = exercise.images?.length ? exercise.images : [{ image: exercise.gifUrl || FALLBACK }];
  const currentImg = images[imgIdx]?.image || FALLBACK;
  const { steps, tips } = parseInstructions(exercise.description);

  useEffect(() => {
    if (exercise.id) isFavorite(exercise.id).then(setFav);
  }, [exercise.id]);

  const next = () => setImgIdx(i => (i + 1) % images.length);
  const prev = () => setImgIdx(i => (i - 1 + images.length) % images.length);

  const swipe = useSwipeable({ onSwipedLeft: next, onSwipedRight: prev, trackMouse: true });

  const addToday = async () => {
    setAdding(true);
    try { await onQuickAdd(exercise); toast.success('Added! 💪'); }
    catch { toast.error('Already in today'); }
    finally { setAdding(false); }
  };

  const toggleFav = async () => {
    setSaving(true);
    const newFav = await toggleFavorite(exercise);
    setFav(newFav);
    toast.success(newFav ? '❤️ Saved' : '💔 Removed');
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl" onClick={onClose}>
      <div className="bg-gradient-to-br from-black/95 via-emerald-950/50 to-black/95 rounded-3xl p-8 max-w-5xl w-full max-h-[94vh] overflow-y-auto border-4 border-emerald-500/40 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="float-right p-3 bg-white/10 hover:bg-white/20 rounded-full mb-4">
          <X className="w-8 h-8" />
        </button>

        <h2 className="text-5xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
          {exercise.name || 'Unknown Exercise'}
        </h2>

        <div className="relative rounded-3xl overflow-hidden mb-8 border-4 border-emerald-500/30" {...swipe}>
          <img src={currentImg} alt={exercise.name} className="w-full aspect-video object-cover" onError={e => e.target.src = FALLBACK} />
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/70 rounded-full"><ChevronLeft className="w-8 h-8" /></button>
              <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/70 rounded-full"><ChevronRight className="w-8 h-8" /></button>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[exercise.muscles, exercise.equipment || 'Bodyweight', exercise.musclesSecondary, exercise.category]
            .filter(Boolean)
            .map((v, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 text-center border-2 border-white/20">
                <HeartPulse className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-2xl font-bold">{v}</p>
              </div>
            ))}
        </div>

        <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-3xl p-8 border-4 border-emerald-500/40">
          <button onClick={() => setOpenInst(!openInst)} className="w-full flex justify-between text-3xl font-bold">
            Instructions <ChevronDown className={`w-10 h-10 transition ${openInst ? 'rotate-180' : ''}`} />
          </button>
          {openInst && (
            <div className="mt-8 space-y-8">
              {steps.map(s => (
                <div key={s.number} className="flex gap-6">
                  <div className="w-14 h-14 bg-emerald-500 text-black rounded-full flex-center font-bold text-2xl">{s.number}</div>
                  <div>
                    <p className="text-emerald-300 font-bold text-xl">{s.action}</p>
                    <p className="text-white/80 text-lg">{s.text}</p>
                  </div>
                </div>
              ))}
              {tips.length > 0 && (
                <div className="p-8 bg-amber-500/20 rounded-3xl border-4 border-amber-500/50">
                  <h4 className="text-3xl font-bold text-amber-300 mb-6">Pro Tips</h4>
                  {tips.map((t, i) => (
                    <p key={i} className="flex gap-4 text-lg"><CheckCircle2 className="w-8 h-8 text-emerald-400 mt-0.5" /> {t}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-6 mt-12">
          <button onClick={addToday} disabled={adding} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 py-8 rounded-3xl font-bold text-4xl text-black shadow-2xl hover:scale-105 flex-center gap-4">
            {adding ? <Loader2 className="w-12 h-12 animate-spin" /> : <Plus className="w-12 h-12" />} Add to Today
          </button>
          <button onClick={toggleFav} className={`p-8 rounded-3xl border-4 ${fav ? 'border-rose-500 bg-rose-500/20' : 'border-white/30'}`}>
            <Heart className={`w-16 h-16 ${fav ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};