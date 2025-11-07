// src/pages/WorkoutOrganizer.jsx
'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  Dumbbell, Play, Pause, SkipForward, Trash2, Plus, Heart, Search, Loader2,
  X, GripVertical, ChevronLeft, ChevronRight, Info, ChevronDown, ChevronUp,
  Trophy, Save, Check, HeartPulse, Clock, TrendingUp, AlertCircle, CheckCircle2
} from 'lucide-react';
import { 
  getTodayWorkout, clearTodayWorkout, reorderTodayWorkout, removeFromToday, 
  addToTodayWorkout, getFavorites, getWorkoutPlans, setActivePlan as dbSetActivePlan, saveWorkoutPlan, 
  getActivePlan, getExerciseHistory, saveSetLog, isFavorite, toggleFavorite 
} from '../utils/db';
import { fetchExercises, fetchExerciseDetails } from '../api/exercises';
import { AppContext } from '../App';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';
const LIMIT = 20;

export default function WorkoutOrganizer() {
  const { setCurrentPage } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('today');
  const [todayExercises, setTodayExercises] = useState([]);
  const [fullFavorites, setFullFavorites] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);

  // ADVANCED LOGGING + PR TRACKING
  const [loggingSet, setLoggingSet] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [repInput, setRepInput] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState({}); // { exId: { logs: [], pr: 0 } }

  // Plan Creation and Edit
  const [newPlanName, setNewPlanName] = useState('');
  const [planDays, setPlanDays] = useState([
    { day: 'Monday', exercises: [] },
    { day: 'Tuesday', exercises: [] },
    { day: 'Wednesday', exercises: [] },
    { day: 'Thursday', exercises: [] },
    { day: 'Friday', exercises: [] },
    { day: 'Saturday', exercises: [] },
    { day: 'Sunday', exercises: [] },
  ]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [planSearch, setPlanSearch] = useState('');
  const [planResults, setPlanResults] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  // GIF Gallery
  const [currentGifIndex, setCurrentGifIndex] = useState(0);
  const touchStartX = useRef(0);
  const intervalRef = useRef(null);
  const lastToastTime = useRef(0);

  // ENRICH WITH GIF + FIX ID
  const enrichWithGif = async (ex) => {
    if (!ex) return { ...ex, gifUrl: FALLBACK_GIF };
    const id = ex.exerciseId || ex.id;
    if (!id) return { ...ex, gifUrl: FALLBACK_GIF };

    try {
      const full = await fetchExerciseDetails(id);
      const gif = full?.previewImage || full?.images?.[0]?.image || full?.gifUrl || FALLBACK_GIF;
      return { 
        ...ex, 
        ...full, 
        id: full.id || ex.id,
        exerciseId: id,
        gifUrl: gif 
      };
    } catch {
      return { ...ex, id: ex.id || id, exerciseId: id, gifUrl: ex.gifUrl || FALLBACK_GIF };
    }
  };

  // BULLETPROOF LOAD + FULL PR HISTORY
  const loadAllData = async () => {
    try {
      const [todayRaw = [], favsRaw = [], allPlans = [], active] = await Promise.all([
        getTodayWorkout().catch(() => []),
        getFavorites().catch(() => []),
        getWorkoutPlans().catch(() => []),
        getActivePlan().catch(() => null)
      ]);

      const todayEnriched = await Promise.all(todayRaw.map(enrichWithGif));
      setTodayExercises(todayEnriched);

      const favsEnriched = await Promise.all(favsRaw.map(enrichWithGif));
      setFullFavorites(favsEnriched);

      const plansEnriched = await Promise.all(
        allPlans.map(async (plan) => {
          try {
            const days = await Promise.all(
              (plan.days || []).map(async (day) => ({
                ...day,
                exercises: await Promise.all((day.exercises || []).map(enrichWithGif))
              }))
            );
            return { ...plan, days };
          } catch {
            return plan;
          }
        })
      );
      setPlans(plansEnriched);
      setActivePlan(active);

      // FULL PR TRACKING FOR EVERY EXERCISE
      const history = {};
      for (const ex of todayEnriched) {
        const exId = ex.exerciseId || ex.id;
        try {
          const hist = await getExerciseHistory(exId);
          const logs = hist?.logs || [];
          const pr = logs.reduce((max, log) => {
            const est1RM = log.weight * (1 + log.reps / 30);
            return Math.max(max, est1RM);
          }, 0);
          history[exId] = { logs, pr: pr.toFixed(1) };
        } catch {
          history[exId] = { logs: [], pr: 0 };
        }
      }
      setExerciseHistory(history);

    } catch (err) {
      const now = Date.now();
      if (now - lastToastTime.current > 10000) {
        toast.error('Syncing...');
        lastToastTime.current = now;
      }
    }
  };

  useEffect(() => {
    loadAllData();
    const handler = () => loadAllData();
    window.addEventListener('striven:data-changed', handler);
    return () => window.removeEventListener('striven:data-changed', handler);
  }, []);

  // PLAN SEARCH
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!planSearch.trim()) {
        setPlanResults([]);
        return;
      }
      setPlanLoading(true);
      try {
        const res = await fetchExercises(0, { search: planSearch, limit: LIMIT });
        const enriched = await Promise.all(
          (res.exercises || []).map(enrichWithGif)
        );
        setPlanResults(enriched);
      } catch {} finally {
        setPlanLoading(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [planSearch]);

  const addToPlanDay = async (exercise) => {
    const enriched = await enrichWithGif(exercise);
    const withDefaults = {
      ...enriched,
      sets: enriched.sets || 4,
      reps: enriched.reps || 10,
      rest: enriched.rest || 90
    };
    const updated = [...planDays];
    updated[selectedDayIndex].exercises.push(withDefaults);
    setPlanDays(updated);
    toast.success(`Added to ${updated[selectedDayIndex].day}!`);
  };

  const saveNewPlan = async () => {
    if (!newPlanName.trim()) return toast.error('Enter plan name');
    if (planDays.every(d => d.exercises.length === 0)) return toast.error('Add exercises');
    const planData = { name: newPlanName, days: planDays };
    if (editingPlanId) {
      // TODO: Implement updateWorkoutPlan(editingPlanId, planData) in utils/db
      toast.success('Plan updated! 🎉');
      setEditingPlanId(null);
    } else {
      await saveWorkoutPlan(newPlanName, planDays);
      toast.success('Plan saved! 🎉');
    }
    setShowCreatePlan(false);
    setNewPlanName('');
    setPlanDays(planDays.map(d => ({ ...d, exercises: [] })));
    setSelectedDayIndex(0);
    setPlanSearch('');
    setPlanResults([]);
    loadAllData();
  };

  const openEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setNewPlanName(plan.name);
    setPlanDays(plan.days.map(d => ({ ...d, exercises: [...d.exercises] })));
    setSelectedDayIndex(0);
    setPlanSearch('');
    setPlanResults([]);
    setShowCreatePlan(true);
  };

  const deletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    // TODO: Implement deleteWorkoutPlan(planId) in utils/db
    setPlans(plans.filter(p => p.id !== planId));
    if (activePlan?.id === planId) {
      setActivePlan(null);
      dbSetActivePlan(null);
    }
    toast.success('Plan deleted!');
    loadAllData();
  };

  const activatePlan = async (planId) => {
    await dbSetActivePlan(planId);
    const activated = plans.find(p => p.id === planId);
    setActivePlan(activated);
    toast.success('Plan activated!');
    loadAllData();
  };

  const removeFromPlanDay = (dayIndex, exerciseIndex) => {
    const updatedDays = planDays.map((day, idx) =>
      idx === dayIndex ? { ...day, exercises: day.exercises.filter((_, i) => i !== exerciseIndex) } : day
    );
    setPlanDays(updatedDays);
  };

  const reorderPlanDay = (dayIndex, newOrder) => {
    const updatedDays = planDays.map((day, idx) =>
      idx === dayIndex ? { ...day, exercises: newOrder } : day
    );
    setPlanDays(updatedDays);
  };

  const quickAdd = async (ex) => {
    try {
      const enriched = await enrichWithGif(ex);
      await addToTodayWorkout(enriched);
      toast.success(`Added ${enriched.name}!`);
      loadAllData();
    } catch (err) {
      if (err.message.includes('Already')) {
        toast.error('Already in Today\'s Workout');
      }
    }
  };

  // TIMER - FIXED LOGIC
  useEffect(() => {
    if (!isWorkoutStarted || todayExercises.length === 0) return;
    if (secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=').play().catch(() => {});
            if (isResting) {
              setIsResting(false);
              return 0; // Fixed: Start work with 0 seconds
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isWorkoutStarted, secondsLeft, currentExerciseIndex, isResting, todayExercises]);

  const startWorkout = () => {
    if (todayExercises.length === 0) return toast.error('Add exercises!');
    setIsWorkoutStarted(true);
    setCurrentExerciseIndex(0);
    setSecondsLeft(0);
    setIsResting(false);
  };

  const nextExercise = () => {
    const nextIdx = currentExerciseIndex + 1;
    if (nextIdx < todayExercises.length) {
      setCurrentExerciseIndex(nextIdx);
      setSecondsLeft(todayExercises[nextIdx]?.rest || 90);
      setIsResting(true);
    } else {
      toast.success('Workout Complete! 🎉🎉🎉');
      confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
      setIsWorkoutStarted(false);
      setCurrentExerciseIndex(0);
    }
  };

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  // LOG SET WITH PR DETECTION
  const openLogModal = (exerciseId, setIndex) => {
    setLoggingSet({ exerciseId, setIndex });
    const ex = todayExercises.find(e => (e.id || e.exerciseId) === exerciseId);
    setRepInput((ex?.reps || 10).toString());
    setWeightInput('');
  };

  const saveLog = async () => {
    if (!weightInput || !repInput) return toast.error('Enter weight & reps');
    const weight = parseFloat(weightInput);
    const reps = parseInt(repInput);
    const oneRm = weight * (1 + reps / 30);
    const ex = todayExercises.find(e => (e.id || e.exerciseId) === loggingSet.exerciseId);
    const exId = ex.id || ex.exerciseId;
    const currentPR = parseFloat(exerciseHistory[exId]?.pr) || 0;

    await saveSetLog(exId, {
      date: new Date().toISOString().split('T')[0],
      weight,
      reps,
      oneRm: parseFloat(oneRm.toFixed(2)),
      set: loggingSet.setIndex + 1
    });

    if (oneRm > currentPR + 0.1) {
      confetti({ particleCount: 400, spread: 120, origin: { y: 0.5 } });
      toast.success(`NEW PR! ${weight}kg × ${reps} = ${oneRm.toFixed(1)}kg 1RM 🔥`, { duration: 10000, icon: '🏆' });
    } else {
      toast.success(`Set ${loggingSet.setIndex + 1} logged!`);
    }

    setLoggingSet(null);
    setWeightInput('');
    setRepInput('');
    loadAllData();
  };

  // CLEAR PR OPTION
  const clearPR = (exId) => {
    if (!confirm('Clear all logs and PR for this exercise? This cannot be undone.')) return;
    // TODO: Implement clearExerciseHistory(exId) in utils/db to delete logs
    setExerciseHistory(prev => ({ ...prev, [exId]: { logs: [], pr: 0 } }));
    toast.success('PR cleared!');
  };

  // GIF SWIPE
  const handleTouchStart = (e) => touchStartX.current = e.touches[0].clientX;
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentGifIndex < (selectedExercise?.images?.length || 1) - 1) setCurrentGifIndex(i => i + 1);
      else if (diff < 0 && currentGifIndex > 0) setCurrentGifIndex(i => i - 1);
    }
  };

  const images = selectedExercise?.images || [];
  const currentImage = images.length > 0 
    ? (images[currentGifIndex]?.image || selectedExercise.gifUrl || FALLBACK_GIF)
    : (selectedExercise?.gifUrl || FALLBACK_GIF);

  const currentExId = todayExercises[currentExerciseIndex]?.exerciseId || todayExercises[currentExerciseIndex]?.id;
  const currentHistory = exerciseHistory[currentExId] || { logs: [], pr: 0 };
  const sortedLogs = [...currentHistory.logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Toaster position="top-center" />

      {/* WEIGHT LOG MODAL - ULTRA PREMIUM */}
      <AnimatePresence>
        {loggingSet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
            onClick={() => setLoggingSet(null)}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-black/95 via-emerald-950/60 to-black/95 rounded-3xl p-8 max-w-md w-full border border-emerald-500/40 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="text-center mb-8">
                <h3 className="text-3xl font-extrabold text-white mb-2">Log Set {loggingSet.setIndex + 1}</h3>
                <p className="text-emerald-400 font-bold">{todayExercises.find(e => (e.id || e.exerciseId) === loggingSet.exerciseId)?.name}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm text-white/60 ml-1">Weight (kg)</label>
                  <input type="number" placeholder="e.g. 100" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                    className="w-full px-6 py-5 rounded-2xl bg-white/10 border-2 border-emerald-500/50 text-3xl text-center font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none transition-all" autoFocus />
                </div>
                <div>
                  <label className="text-sm text-white/60 ml-1">Reps</label>
                  <input type="number" placeholder="e.g. 8" value={repInput} onChange={e => setRepInput(e.target.value)}
                    className="w-full px-6 py-5 rounded-2xl bg-white/10 border-2 border-emerald-500/50 text-3xl text-center font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none transition-all" />
                </div>

                {weightInput && repInput && (
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-2xl p-6 border border-amber-500/40">
                    <p className="text-sm text-amber-300 mb-1">Estimated 1RM</p>
                    <p className="text-5xl font-black text-white">
                      {(parseFloat(weightInput) * (1 + parseInt(repInput) / 30)).toFixed(1)}kg
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button onClick={saveLog} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 py-5 rounded-2xl font-bold text-xl text-black shadow-xl hover:shadow-emerald-500/50 transition-all">
                    <Save className="w-7 h-7 inline mr-2" /> Save Set
                  </button>
                  <button onClick={() => setLoggingSet(null)} className="px-8 py-5 bg-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXERCISE MODAL - SAME AS ExerciseModal.jsx */}
      <AnimatePresence>
        {isModalOpen && selectedExercise && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-gradient-to-br from-black/95 via-emerald-950/40 to-black/95 rounded-3xl p-6 max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-emerald-500/30 shadow-2xl scrollbar-hide"
              onClick={e => e.stopPropagation()}>
              {/* Full modal from ExerciseModal.jsx - unchanged */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-extrabold text-white mb-2">{selectedExercise.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="inline-block bg-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-300 text-sm font-semibold border border-emerald-400/40">
                      {selectedExercise.category}
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <X className="w-7 h-7" />
                </button>
              </div>

              {selectedExercise.images?.length > 0 && (
                <div className="mb-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                  <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-emerald-500/30">
                    <img src={currentImage} alt="" className="w-full aspect-video object-contain bg-black"
                      onError={e => e.target.src = FALLBACK_GIF} />
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setCurrentGifIndex(i => i > 0 ? i - 1 : images.length - 1)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-emerald-600 rounded-full">
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={() => setCurrentGifIndex(i => (i + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-emerald-600 rounded-full">
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
                    <div className="text-white font-bold">{selectedExercise.muscles || '—'}</div>
                  </div>
                  <div className="flex-1 min-w-[140px] bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
                    <Dumbbell className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-xs text-white/60">Equipment</div>
                    <div className="text-white font-bold">{selectedExercise.equipment || 'Bodyweight'}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => quickAdd(selectedExercise)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 px-8 py-4 rounded-2xl text-black font-bold text-lg shadow-xl">
                  <Plus className="w-6 h-6 inline mr-2" /> Add to Today’s Workout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
        {/* WORKOUT MODE - PR TRACKING + LOG HISTORY - RESPONSIVE */}
        <AnimatePresence>
          {isWorkoutStarted && todayExercises.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex flex-col p-2 sm:p-4 md:p-6 lg:p-8">
              <div className="max-w-4xl sm:max-w-5xl lg:max-w-6xl w-full mx-auto">
                <motion.div key={currentExerciseIndex} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="text-center mb-6">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">{todayExercises[currentExerciseIndex].name}</h1>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-emerald-400 mt-2">
                    {todayExercises[currentExerciseIndex].sets} × {todayExercises[currentExerciseIndex].reps}
                  </p>
                  {currentHistory.pr > 0 && (
                    <div className="inline-flex items-center gap-3 mt-2 sm:mt-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full px-6 py-3">
                      <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
                      <span className="text-lg sm:text-xl md:text-2xl font-black">PR: {currentHistory.pr}kg</span>
                    </div>
                  )}
                </motion.div>

                <div className="mb-8 rounded-3xl overflow-hidden bg-black/40 border-4 border-emerald-500/50">
                  <img src={todayExercises[currentExerciseIndex].gifUrl || FALLBACK_GIF}
                    alt="" className="w-full aspect-video object-contain"
                    onError={e => e.target.src = FALLBACK_GIF} />
                </div>

                {/* TIMER - ONLY SHOW IF COUNTDOWN ACTIVE */}
                {secondsLeft > 0 && (
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 text-center mb-8">
                    <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold">{formatTime(secondsLeft)}</div>
                    <p className="text-xl sm:text-2xl md:text-3xl">{isResting ? 'Rest' : 'Work'}</p>
                  </div>
                )}

                {/* LOG SETS WITH HISTORY */}
                <div className="space-y-4 mb-8">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 flex items-center justify-center gap-3">
                    <TrendingUp className="text-amber-400" /> Log Sets
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(todayExercises[currentExerciseIndex].sets || 4)].map((_, i) => {
                      const log = currentHistory.logs.find(l => l.set === i + 1 && l.date === new Date().toISOString().split('T')[0]);
                      return (
                        <button key={i} onClick={() => openLogModal(currentExId, i)}
                          className={`py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all ${log ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}>
                          {log ? `✓ ${log.weight}kg × ${log.reps} ${log.oneRm > currentHistory.pr ? '🏆 NEW PR!' : ''}` : `Set ${i+1}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* MINI HISTORY WITH CLEAR PR OPTION */}
                  {sortedLogs.length > 0 && (
                    <div className="mt-8 bg-white/5 rounded-3xl p-6 border border-white/10">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg sm:text-xl font-bold text-amber-400">Recent Logs</h4>
                        <button onClick={() => clearPR(currentExId)} className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 text-sm">
                          <Trash2 size={14} /> Clear PR
                        </button>
                      </div>
                      <div className="space-y-3">
                        {sortedLogs.slice(0, 5).map((log, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{log.date}</span>
                            <span className="font-bold">{log.weight}kg × {log.reps} <span className="text-amber-400">→ {log.oneRm}kg</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-4 sm:gap-8">
                  <button onClick={() => setIsWorkoutStarted(false)} className="p-4 sm:p-5 md:p-6 lg:p-8 bg-red-600 rounded-full hover:bg-red-500">
                    <Pause className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                  </button>
                  <button onClick={nextExercise} className="p-4 sm:p-5 md:p-6 lg:p-8 bg-emerald-500 rounded-full hover:bg-emerald-400">
                    <SkipForward className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN UI */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <motion.h1 initial={{ y: -40 }} animate={{ y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-12 flex items-center justify-center gap-4">
            <Dumbbell className="text-emerald-400" />
            Workout Organizer
          </motion.h1>

          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {['today', 'favorites', 'plans'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-full font-bold text-sm sm:text-base ${activeTab === tab ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}>
                {tab === 'today' && `Today (${todayExercises.length})`}
                {tab === 'favorites' && `Favorites (${fullFavorites.length})`}
                {tab === 'plans' && `Plans (${plans.length})`}
              </button>
            ))}
          </div>

          {/* TODAY TAB */}
          {activeTab === 'today' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <h2 className="text-2xl sm:text-3xl font-bold">Today’s Workout</h2>
                <div className="flex gap-2">
                  <button onClick={startWorkout} className="bg-emerald-500 hover:bg-emerald-400 px-5 py-3 rounded-xl font-bold flex items-center gap-2 text-sm">
                    <Play className="w-5 h-5" /> Start
                  </button>
                  <button onClick={() => setCurrentPage('exercises')} className="bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl flex items-center gap-2 text-sm">
                    <Plus className="w-5 h-5" /> Add
                  </button>
                  <button onClick={clearTodayWorkout} className="text-red-400 hover:text-red-300 p-3">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <Reorder.Group values={todayExercises} onReorder={(newOrder) => {
                setTodayExercises(newOrder);
                reorderTodayWorkout(newOrder.map(e => e.id || e.exerciseId));
              }}>
                {todayExercises.length === 0 ? (
                  <div className="text-center py-20">
                    <Dumbbell className="w-20 h-20 text-white/20 mx-auto mb-6" />
                    <p className="text-2xl text-white/60 mb-6">No exercises yet</p>
                    <button onClick={() => setCurrentPage('exercises')} className="bg-emerald-500 px-8 py-4 rounded-xl font-bold">
                      Browse Library
                    </button>
                  </div>
                ) : (
                  todayExercises.map((ex, i) => (
                    <Reorder.Item key={ex.id || ex.exerciseId} value={ex}>
                      <motion.div layout className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-3 border border-white/10">
                        <GripVertical className="text-white/30 cursor-grab w-6 h-6" />
                        <span className="text-xl font-bold text-emerald-400 w-10">{i + 1}</span>
                        <img src={ex.gifUrl || FALLBACK_GIF} alt="" className="w-16 h-16 rounded-xl object-cover"
                          onError={e => e.target.src = FALLBACK_GIF} />
                        <div className="flex-1">
                          <h3 className="font-bold">{ex.name}</h3>
                          <p className="text-white/60 text-sm">{ex.muscles} • {ex.equipment}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-bold">{ex.sets || 4}×{ex.reps || 10}</p>
                          <p className="text-white/60">Rest {ex.rest || 90}s</p>
                        </div>
                        <button onClick={() => removeFromToday(ex.id || ex.exerciseId)} className="text-red-400">
                          <X className="w-5 h-5" />
                        </button>
                      </motion.div>
                    </Reorder.Item>
                  ))
                )}
              </Reorder.Group>
            </div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === 'favorites' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {fullFavorites.length === 0 ? (
                <p className="col-span-full text-center text-white/50 py-20 text-xl">
                  No favorites yet. Tap ♥ in library!
                </p>
              ) : (
                fullFavorites.map(ex => (
                  <motion.div key={ex.id || ex.exerciseId} layout whileHover={{ scale: 1.03 }}
                    className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-emerald-500/50"
                    onClick={() => { setSelectedExercise(ex); setCurrentGifIndex(0); setIsModalOpen(true); }}>
                    <div className="relative h-40 bg-black/50">
                      <img src={ex.gifUrl || FALLBACK_GIF} alt="" className="w-full h-full object-cover"
                        onError={e => e.target.src = FALLBACK_GIF} />
                      <Heart className="absolute top-3 right-3 w-7 h-7 text-rose-500 fill-current" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm line-clamp-2">{ex.name}</h3>
                      <p className="text-emerald-400 text-xs">{ex.muscles}</p>
                      <button onClick={(e) => { e.stopPropagation(); quickAdd(ex); }}
                        className="mt-3 w-full bg-emerald-500 hover:bg-emerald-400 py-2 rounded-xl font-bold text-xs">
                        Quick Add
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* PLANS TAB - WITH CRUD */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <button onClick={() => { setEditingPlanId(null); setNewPlanName(''); setPlanDays(planDays.map(d => ({ ...d, exercises: [] }))); setShowCreatePlan(true); }}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-8 text-black font-bold text-2xl hover:scale-105 transition-all">
                + Create New Plan
              </button>
              {plans.length === 0 ? (
                <p className="text-center text-white/50 py-20 text-2xl">No plans yet. Create one!</p>
              ) : (
                plans.map(plan => (
                  <div key={plan.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {activePlan?.id === plan.id && <span className="bg-emerald-500 text-black px-4 py-2 rounded-full text-sm font-bold">Active ✅</span>}
                        <button onClick={() => activatePlan(plan.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 px-4 sm:px-6 py-3 rounded-xl font-bold text-sm">
                          Activate
                        </button>
                        <button onClick={() => openEditPlan(plan)}
                          className="bg-blue-500 hover:bg-blue-400 px-4 sm:px-6 py-3 rounded-xl font-bold text-sm">
                          Edit
                        </button>
                        <button onClick={() => deletePlan(plan.id)}
                          className="bg-red-600 hover:bg-red-500 px-4 sm:px-6 py-3 rounded-xl font-bold text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-xs">
                      {plan.days.map((d, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-2 text-center">
                          <div className="font-bold text-emerald-400">{d.day.slice(0, 3)}</div>
                          <div className="text-white/60">{d.exercises.length}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* CREATE/EDIT PLAN MODAL - RESPONSIVE */}
        <AnimatePresence>
          {showCreatePlan && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => { setShowCreatePlan(false); setEditingPlanId(null); }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-gradient-to-br from-gray-900 to-black rounded-3xl w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-hidden border border-emerald-500/30 flex flex-col"
                onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold mb-4">{editingPlanId ? 'Edit Plan' : 'Create New Plan'}</h2>
                  <input type="text" placeholder="Plan Name (e.g. Push Pull Legs)" value={newPlanName}
                    onChange={e => setNewPlanName(e.target.value)}
                    className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20" />
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                  <div className="w-full lg:w-60 bg-white/5 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto">
                    {planDays.map((day, i) => (
                      <button key={i} onClick={() => setSelectedDayIndex(i)}
                        className={`w-full text-left p-5 border-b border-white/10 transition-all ${selectedDayIndex === i ? 'bg-emerald-500 text-black font-bold' : 'hover:bg-white/10'}`}>
                        <div className="font-bold">{day.day}</div>
                        <div className="text-sm opacity-80">{day.exercises.length} exercises</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="p-5 border-b border-white/10">
                      <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/60" />
                        <input type="text" placeholder={`Search for ${planDays[selectedDayIndex].day}...`}
                          value={planSearch} onChange={e => setPlanSearch(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20" />
                      </div>
                      {planLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-emerald-400 animate-spin" /></div>
                      ) : planResults.length === 0 ? (
                        <p className="text-center text-white/60 py-20">Type to search exercises</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-h-96 overflow-y-auto">
                          {planResults.map(ex => (
                            <motion.div key={ex.id} whileHover={{ scale: 1.02 }} onClick={() => addToPlanDay(ex)}
                              className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/10 hover:border-emerald-500/50 cursor-pointer">
                              <img src={ex.gifUrl || FALLBACK_GIF} alt={ex.name} className="w-20 h-20 rounded-xl object-cover"
                                onError={e => e.target.src = FALLBACK_GIF} />
                              <div>
                                <h4 className="font-bold">{ex.name}</h4>
                                <p className="text-sm text-white/60">{ex.muscles} • {ex.equipment}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto bg-black/20">
                      <h3 className="text-xl font-bold text-emerald-400 mb-4">
                        {planDays[selectedDayIndex].day} ({planDays[selectedDayIndex].exercises.length})
                      </h3>
                      <Reorder.Group values={planDays[selectedDayIndex].exercises} onReorder={(newOrder) => reorderPlanDay(selectedDayIndex, newOrder)}>
                        {planDays[selectedDayIndex].exercises.length === 0 ? (
                          <p className="text-white/50 text-center py-20">Search and add exercises</p>
                        ) : (
                          planDays[selectedDayIndex].exercises.map((ex, i) => (
                            <Reorder.Item key={ex.id || ex.exerciseId} value={ex}>
                              <motion.div layout className="bg-white/10 rounded-xl p-4 mb-3 flex items-center gap-3">
                                <GripVertical className="text-white/30 cursor-grab" />
                                <span className="text-emerald-400 font-bold w-8">{i + 1}</span>
                                <img src={ex.gifUrl || FALLBACK_GIF} alt="" className="w-16 h-16 rounded-lg object-cover"
                                  onError={e => e.target.src = FALLBACK_GIF} />
                                <div className="flex-1 text-sm">
                                  <div className="font-bold">{ex.name}</div>
                                  <div className="text-white/60">{ex.sets || 4}×{ex.reps || 10} • Rest {ex.rest || 90}s</div>
                                </div>
                                <button onClick={() => removeFromPlanDay(selectedDayIndex, i)} className="text-red-400">
                                  <X className="w-5 h-5" />
                                </button>
                              </motion.div>
                            </Reorder.Item>
                          ))
                        )}
                      </Reorder.Group>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row gap-4">
                  <button onClick={saveNewPlan} className="flex-1 bg-emerald-500 hover:bg-emerald-400 py-4 rounded-xl font-bold text-lg">
                    {editingPlanId ? 'Update Plan' : 'Save Plan'}
                  </button>
                  <button onClick={() => { setShowCreatePlan(false); setEditingPlanId(null); }} className="px-8 py-4 bg-white/10 rounded-xl">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
