// src/pages/WorkoutOrganizer.jsx
'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti'; // ← THIS WAS MISSING
import { 
  Dumbbell, Play, Pause, SkipForward, Trash2, Plus, Heart, Search, Loader2,
  X, GripVertical, ChevronLeft, ChevronRight, Info, ChevronDown, ChevronUp,
  Trophy, Save, Check, HeartPulse, Clock // ← THESE WERE MISSING
} from 'lucide-react';
import { 
  getTodayWorkout, clearTodayWorkout, reorderTodayWorkout, removeFromToday, 
  addToTodayWorkout, getFavorites, getWorkoutPlans, setActivePlan, saveWorkoutPlan, 
  getActivePlan, getExerciseHistory, saveSetLog // ← THESE TWO WERE MISSING
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

  // Weight Logging + PR
  const [loggingSet, setLoggingSet] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [repInput, setRepInput] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState({});

  // Plan Creation
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

  // GIF Gallery
  const [currentGifIndex, setCurrentGifIndex] = useState(0);
  const touchStartX = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    const [today, favs, allPlans, active] = await Promise.all([
      getTodayWorkout(),
      getFavorites(),
      getWorkoutPlans(),
      getActivePlan()
    ]);

    setTodayExercises(today);
    setPlans(allPlans);
    setActivePlan(active);

    const fullFavs = await Promise.all(
      favs.map(async (ex) => {
        try {
          const full = await fetchExerciseDetails(ex.id);
          return { ...full, gifUrl: full.gifUrl || FALLBACK_GIF };
        } catch {
          return { ...ex, gifUrl: FALLBACK_GIF };
        }
      })
    );
    setFullFavorites(fullFavs);

    // Load PR history
    const history = {};
    for (const ex of today) {
      const hist = await getExerciseHistory(ex.id);
      const pr = hist?.logs?.reduce((max, log) => {
        const oneRm = log.weight * (1 + log.reps / 30);
        return oneRm > max ? oneRm : max;
      }, 0) || 0;
      history[ex.id] = { ...hist, pr };
    }
    setExerciseHistory(history);
  };

  // Plan Search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!planSearch.trim()) {
        setPlanResults([]);
        return;
      }
      setPlanLoading(true);
      try {
        const res = await fetchExercises(0, { search: planSearch, limit: LIMIT });
        setPlanResults((res.exercises || []).map(ex => ({ ...ex, gifUrl: ex.gifUrl || FALLBACK_GIF })));
      } catch {
        toast.error('Search failed');
      } finally {
        setPlanLoading(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [planSearch]);

  const addToPlanDay = async (exercise) => {
    const full = await fetchExerciseDetails(exercise.id);
    const withDefaults = {
      ...full,
      gifUrl: full.gifUrl || FALLBACK_GIF,
      sets: 4, reps: 10, rest: 90
    };
    const updated = [...planDays];
    updated[selectedDayIndex].exercises.push(withDefaults);
    setPlanDays(updated);
    toast.success(`Added to ${planDays[selectedDayIndex].day}!`);
  };

  const removeFromPlanDay = (dayIdx, exIdx) => {
    const updated = [...planDays];
    updated[dayIdx].exercises.splice(exIdx, 1);
    setPlanDays(updated);
  };

  const reorderPlanDay = (dayIdx, newOrder) => {
    const updated = [...planDays];
    updated[dayIdx].exercises = newOrder;
    setPlanDays(updated);
  };

  const saveNewPlan = async () => {
    if (!newPlanName.trim()) return toast.error('Enter plan name');
    if (planDays.every(d => d.exercises.length === 0)) return toast.error('Add exercises');
    await saveWorkoutPlan(newPlanName, planDays);
    toast.success('Plan saved!');
    setShowCreatePlan(false);
    setNewPlanName('');
    setPlanDays(planDays.map(d => ({ ...d, exercises: [] })));
    loadAllData();
  };

  const activatePlan = async (planId) => {
    await setActivePlan(planId);
    toast.success('Plan activated!');
    loadAllData();
  };

  // Timer
  useEffect(() => {
    if (!isWorkoutStarted || todayExercises.length === 0) return;
    if (secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
            audio.play();
            if (isResting) {
              setIsResting(false);
              return todayExercises[currentExerciseIndex]?.rest || 90;
            }
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
    setSecondsLeft(0);
    setIsResting(false);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < todayExercises.length - 1) {
      setCurrentExerciseIndex(i => i + 1);
      setSecondsLeft(todayExercises[currentExerciseIndex + 1]?.rest || 90);
      setIsResting(true);
    } else {
      toast.success('Workout Complete! 🎉🎉🎉');
      setIsWorkoutStarted(false);
    }
  };

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  const quickAdd = async (ex) => {
    const full = await fetchExerciseDetails(ex.id);
    await addToTodayWorkout({ ...full, sets: 4, reps: 10, rest: 90 });
    toast.success(`Added ${full.name}!`);
    loadAllData();
  };

  // Weight Logging + PR
  const openLogModal = (exerciseId, setIndex) => {
    setLoggingSet({ exerciseId, setIndex });
    const ex = todayExercises.find(e => e.id === exerciseId);
    setRepInput(ex.reps.toString());
    setWeightInput('');
  };

  const saveLog = async () => {
    if (!weightInput || !repInput) return toast.error('Enter weight & reps');

    const weight = parseFloat(weightInput);
    const reps = parseInt(repInput);
    const oneRm = weight * (1 + reps / 30);

    const ex = todayExercises.find(e => e.id === loggingSet.exerciseId);
    const currentPR = exerciseHistory[ex.id]?.pr || 0;

    await saveSetLog(ex.id, {
      date: new Date().toISOString().split('T')[0],
      weight,
      reps,
      oneRm,
      set: loggingSet.setIndex + 1
    });

    if (oneRm > currentPR + 0.1) {
      confetti({
        particleCount: 300,
        spread: 100,
        origin: { y: 0.6 }
      });
      toast.success(`🏆 PR SMASHED! ${weight}kg × ${reps} = ${oneRm.toFixed(1)}kg 1RM`, {
        duration: 8000,
        icon: '🔥'
      });
    } else {
      toast.success(`Set ${loggingSet.setIndex + 1} logged!`);
    }

    setLoggingSet(null);
    setWeightInput('');
    setRepInput('');
    loadAllData();
  };

  // GIF Swipe
  const handleTouchStart = (e) => touchStartX.current = e.touches[0].clientX;
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentGifIndex < (selectedExercise?.images?.length || 1) - 1) {
        setCurrentGifIndex(i => i + 1);
      } else if (diff < 0 && currentGifIndex > 0) {
        setCurrentGifIndex(i => i - 1);
      }
    }
  };

  const images = selectedExercise?.images || [];
  const currentImage = images.length > 0 
    ? (images[currentGifIndex]?.image || selectedExercise.gifUrl || FALLBACK_GIF)
    : (selectedExercise?.gifUrl || FALLBACK_GIF);

  return (
    <>
      <Toaster position="top-center" />

      {/* WEIGHT LOGGING MODAL */}
      <AnimatePresence>
        {loggingSet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 max-w-sm w-full border border-emerald-500/30">
              <h3 className="text-2xl font-bold mb-6 text-center">
                Log Set {loggingSet.setIndex + 1}
              </h3>
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-xl"
                  autoFocus
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={repInput}
                  onChange={e => setRepInput(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-xl"
                />
                <div className="flex gap-3">
                  <button onClick={saveLog} className="flex-1 bg-emerald-500 hover:bg-emerald-400 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2">
                    <Save className="w-6 h-6" /> Save
                  </button>
                  <button onClick={() => setLoggingSet(null)} className="px-8 py-4 bg-white/10 rounded-xl font-bold">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXERCISE MODAL WITH PR */}
      <AnimatePresence>
        {isModalOpen && selectedExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-500/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-black/80 backdrop-blur-xl p-6 border-b border-white/10 flex justify-between">
                <h2 className="text-2xl font-bold">{selectedExercise.name}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                {(selectedExercise.gifUrl || images.length > 0) && (
                  <div className="mb-8">
                    <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-emerald-500/30">
                      <img
                        src={currentImage}
                        alt={selectedExercise.name}
                        className="w-full aspect-video object-contain bg-black"
                        onError={e => e.target.src = FALLBACK_GIF}
                      />
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

                {exerciseHistory[selectedExercise.id]?.pr > 0 && (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 flex items-center gap-4">
                    <Trophy className="w-12 h-12" />
                    <div>
                      <div className="text-2xl font-bold">Personal Record</div>
                      <div className="text-4xl font-black">{exerciseHistory[selectedExercise.id].pr.toFixed(1)}kg 1RM</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['muscles', 'equipment', 'musclesSecondary', 'category'].map((key, i) => {
                    const icons = [HeartPulse, Dumbbell, HeartPulse, Clock];
                    const labels = ['Primary', 'Equipment', 'Secondary', 'Type'];
                    const Icon = icons[i];
                    const value = selectedExercise[key] || (key === 'equipment' ? 'Bodyweight' : '—');
                    if (!value || value === '—') return null;
                    return (
                      <div key={key} className="bg-white/5 rounded-2xl p-4 text-center">
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${i === 2 ? 'text-amber-400' : 'text-emerald-400'}`} />
                        <div className="text-xs text-white/60">{labels[i]}</div>
                        <div className="font-bold">{value}</div>
                      </div>
                    );
                  })}
                </div>

                {selectedExercise.steps?.length > 0 && (
                  <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-2xl border border-emerald-500/40">
                    <button
                      onClick={() => setInstructionsOpen(!instructionsOpen)}
                      className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Info className="w-6 h-6 text-emerald-400" />
                        <h4 className="text-xl font-bold">How to Perform</h4>
                      </div>
                      {instructionsOpen ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {instructionsOpen && (
                      <div className="px-6 pb-6 space-y-5">
                        {selectedExercise.steps.map((step, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center font-bold">
                              {i + 1}
                            </div>
                            <div className="pt-1.5">
                              <span className="font-bold text-emerald-300">{step.action}</span>
                              <p className="text-white/80">{step.text.replace(step.action, '').trim()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
        {/* FULL WORKOUT MODE WITH LOGGING */}
        <AnimatePresence>
          {isWorkoutStarted && todayExercises.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8">
              <div className="max-w-4xl w-full">
                <motion.div key={currentExerciseIndex} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-12">
                  <h1 className="text-6xl font-bold mb-4">{todayExercises[currentExerciseIndex].name}</h1>
                  <p className="text-3xl text-emerald-400">
                    {todayExercises[currentExerciseIndex].sets} × {todayExercises[currentExerciseIndex].reps}
                  </p>
                  {exerciseHistory[todayExercises[currentExerciseIndex].id]?.pr > 0 && (
                    <p className="text-2xl text-amber-400 mt-4">
                      <Trophy className="inline w-8 h-8" /> PR: {exerciseHistory[todayExercises[currentExerciseIndex].id].pr.toFixed(1)}kg
                    </p>
                  )}
                </motion.div>

                <div className="mb-12 rounded-3xl overflow-hidden bg-black/40 border-4 border-emerald-500/50">
                  <img 
                    src={todayExercises[currentExerciseIndex].gifUrl || FALLBACK_GIF}
                    alt={todayExercises[currentExerciseIndex].name}
                    className="w-full aspect-video object-contain"
                    onError={e => e.target.src = FALLBACK_GIF}
                  />
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center mb-12">
                  <div className="text-9xl font-bold mb-8">{formatTime(secondsLeft)}</div>
                  <p className="text-4xl">{isResting ? 'Rest' : 'Work'}</p>
                </div>

                <div className="space-y-4 mb-12">
                  <h3 className="text-3xl font-bold text-center mb-6">Log Your Sets</h3>
                  {[...Array(todayExercises[currentExerciseIndex].sets)].map((_, i) => {
                    const log = exerciseHistory[todayExercises[currentExerciseIndex].id]?.logs?.find(l => l.set === i + 1);
                    return (
                      <button
                        key={i}
                        onClick={() => openLogModal(todayExercises[currentExerciseIndex].id, i)}
                        className={`w-full py-6 rounded-2xl font-bold text-2xl transition-all ${
                          log ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {log 
                          ? `Set ${i+1}: ${log.weight}kg × ${log.reps} ${log.oneRm > (exerciseHistory[todayExercises[currentExerciseIndex].id]?.pr || 0) ? '🔥 PR!' : ''}`
                          : `Set ${i+1}`
                        }
                        {log && <Check className="inline ml-3 w-8 h-8" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-12">
                  <button onClick={() => setIsWorkoutStarted(false)} className="p-8 bg-red-600 rounded-full hover:bg-red-500">
                    <Pause className="w-16 h-16" />
                  </button>
                  <button onClick={nextExercise} className="p-8 bg-emerald-500 rounded-full hover:bg-emerald-400">
                    <SkipForward className="w-16 h-16" />
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
                className={`px-6 py-3 rounded-full font-bold text-sm sm:text-base ${
                  activeTab === tab ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20'
                }`}>
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

              <Reorder.Group values={todayExercises} onReorder={async (newOrder) => {
                setTodayExercises(newOrder);
                await reorderTodayWorkout(newOrder.map(e => e.id));
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
                    <Reorder.Item key={ex.id} value={ex}>
                      <motion.div layout className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-3 border border-white/10">
                        <GripVertical className="text-white/30 cursor-grab w-6 h-6" />
                        <span className="text-xl font-bold text-emerald-400 w-10">{i + 1}</span>
                        <img src={ex.gifUrl || FALLBACK_GIF} alt="" className="w-16 h-16 rounded-xl object-cover" onError={e => e.target.src = FALLBACK_GIF} />
                        <div className="flex-1">
                          <h3 className="font-bold">{ex.name}</h3>
                          <p className="text-white/60 text-sm">{ex.muscles} • {ex.equipment}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-bold">{ex.sets}×{ex.reps}</p>
                          <p className="text-white/60">Rest {ex.rest}s</p>
                        </div>
                        <button onClick={() => removeFromToday(ex.id)} className="text-red-400">
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {fullFavorites.length === 0 ? (
                <p className="col-span-full text-center text-white/50 py-20 text-xl">
                  No favorites yet. Tap ♥ in library!
                </p>
              ) : (
                fullFavorites.map(ex => (
                  <motion.div
                    key={ex.id}
                    layout
                    whileHover={{ scale: 1.03 }}
                    className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-emerald-500/50"
                    onClick={() => {
                      setSelectedExercise(ex);
                      setCurrentGifIndex(0);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="relative h-40 bg-black/50">
                      <img src={ex.gifUrl || FALLBACK_GIF} alt="" className="w-full h-full object-cover" onError={e => e.target.src = FALLBACK_GIF} />
                      <Heart className="absolute top-3 right-3 w-7 h-7 text-rose-500 fill-current" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm line-clamp-2">{ex.name}</h3>
                      <p className="text-emerald-400 text-xs">{ex.muscles}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          quickAdd(ex);
                        }}
                        className="mt-3 w-full bg-emerald-500 hover:bg-emerald-400 py-2 rounded-xl font-bold text-xs"
                      >
                        Quick Add
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* PLANS TAB */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <button onClick={() => setShowCreatePlan(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-8 text-black font-bold text-2xl hover:scale-105 transition-all">
                + Create New Plan
              </button>
              {plans.map(plan => (
                <div key={plan.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <button onClick={() => activatePlan(plan.id)}
                      className="bg-emerald-500 hover:bg-emerald-400 px-6 py-3 rounded-xl font-bold">
                      {plan.isActive ? 'Running' : 'Activate'}
                    </button>
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
              ))}
            </div>
          )}
        </div>

        {/* CREATE PLAN MODAL */}
        <AnimatePresence>
          {showCreatePlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setShowCreatePlan(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-br from-gray-900 to-black rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-emerald-500/30 flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold mb-4">Create New Plan</h2>
                  <input
                    type="text"
                    placeholder="Plan Name"
                    value={newPlanName}
                    onChange={e => setNewPlanName(e.target.value)}
                    className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20"
                  />
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                  <div className="w-full lg:w-60 bg-white/5 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto">
                    {planDays.map((day, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDayIndex(i)}
                        className={`w-full text-left p-5 border-b border-white/10 transition-all ${
                          selectedDayIndex === i ? 'bg-emerald-500 text-black font-bold' : 'hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold">{day.day}</div>
                        <div className="text-sm opacity-80">{day.exercises.length} exercises</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="p-5 border-b border-white/10">
                      <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/60" />
                        <input
                          type="text"
                          placeholder={`Search for ${planDays[selectedDayIndex].day}...`}
                          value={planSearch}
                          onChange={e => setPlanSearch(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20"
                        />
                      </div>
                      {planLoading ? (
                        <div className="flex justify-center py-20">
                          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                        </div>
                      ) : planResults.length === 0 ? (
                        <p className="text-center text-white/60 py-20">Type to search</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-h-96 overflow-y-auto">
                          {planResults.map(ex => (
                            <motion.div
                              key={ex.id}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => addToPlanDay(ex)}
                              className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/10 hover:border-emerald-500/50 cursor-pointer"
                            >
                              <img src={ex.gifUrl || FALLBACK_GIF} alt="" className="w-16 h-16 rounded-xl object-cover" onError={e => e.target.src = FALLBACK_GIF} />
                              <div>
                                <h4 className="font-bold">{ex.name}</h4>
                                <p className="text-sm text-white/60">{ex.muscles}</p>
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
                          <p className="text-white/50 text-center py-20">No exercises yet</p>
                        ) : (
                          planDays[selectedDayIndex].exercises.map((ex, i) => (
                            <Reorder.Item key={ex.id} value={ex}>
                              <motion.div layout className="bg-white/10 rounded-xl p-4 mb-3 flex items-center gap-3">
                                <GripVertical className="text-white/30 cursor-grab" />
                                <span className="text-emerald-400 font-bold w-8">{i + 1}</span>
                                <img src={ex.gifUrl || FALLBACK_GIF} alt="" className="w-12 h-12 rounded-lg object-cover" onError={e => e.target.src = FALLBACK_GIF} />
                                <div className="flex-1 text-sm">
                                  <div className="font-bold">{ex.name}</div>
                                  <div className="text-white/60">{ex.sets}×{ex.reps} • Rest {ex.rest}s</div>
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
                    Save Plan
                  </button>
                  <button onClick={() => setShowCreatePlan(false)} className="px-8 py-4 bg-white/10 rounded-xl">
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