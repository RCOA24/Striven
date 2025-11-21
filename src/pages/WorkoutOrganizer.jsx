/**
 * Striven - Privacy-First Fitness Tracker
 * Copyright (c) 2025 Rodney Austria
 * Licensed under the MIT License
 * 
 * OPTIMIZED VERSION:
 * - Implements React.memo for heavy tabs to prevent re-renders during timer ticks.
 * - Uses useCallback for all handlers to maintain referential equality.
 * - GPU accelerated animations.
 */

'use client';

import React, { useState, useEffect, useRef, useContext, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Dumbbell, CheckCircle, XCircle, AlertCircle, Trash2, Zap, Flame, Rocket, X } from 'lucide-react';
import { 
  clearTodayWorkout, reorderTodayWorkout, removeFromToday, addToTodayWorkout,
  setActivePlan, saveWorkoutPlan, deleteWorkoutPlan, saveSetLog, updateWorkoutPlan,
  getAllExerciseHistory, toggleFavorite
} from '../utils/db';
import { fetchExercises } from '../api/exercises';
import { AppContext } from '../App';

import { useWorkoutData } from '../components/workout/hooks/useWorkoutData';
import { TodayTab } from '../components/workout/tabs/TodayTab';
import { FavoritesTab } from '../components/workout/tabs/FavoritesTab';
import { PlansTab } from '../components/workout/tabs/PlansTab';
import { WorkoutModeOverlay } from '../components/workout/modals/WorkoutModeOverlay';
import { LogSetModal } from '../components/workout/modals/LogSetModal';
import { CreatePlanModal } from '../components/workout/modals/CreatePlanModal';

const LIMIT = 20;
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// --- 1. Static Components & Helpers (Moved outside to prevent recreation) ---

const ModernToast = ({ type, message, icon, onClose, durationMs = 4000 }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-300" />,
    error: <XCircle className="w-5 h-5 text-rose-300" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-300" />,
    info: <Zap className="w-5 h-5 text-cyan-300" />,
    fire: <Flame className="w-5 h-5 text-amber-300" />,
    muscle: <Dumbbell className="w-5 h-5 text-emerald-300" />,
    rocket: <Rocket className="w-5 h-5 text-violet-300" />,
    trash: <Trash2 className="w-5 h-5 text-rose-300" />,
  };

  const palettes = {
    success: { border: 'from-emerald-400 via-teal-400 to-cyan-400', glow: 'from-emerald-400/20 via-teal-400/15 to-cyan-400/20' },
    error: { border: 'from-rose-500 via-red-500 to-orange-500', glow: 'from-rose-500/20 via-red-500/15 to-orange-500/20' },
    warning: { border: 'from-amber-400 via-orange-400 to-rose-400', glow: 'from-amber-400/20 via-orange-400/15 to-rose-400/20' },
    info: { border: 'from-cyan-400 via-blue-400 to-violet-400', glow: 'from-cyan-400/20 via-blue-400/15 to-violet-400/20' },
  };

  const palette = palettes[type] || palettes.info;
  const IconEl = icons[icon] || icons[type] || icons.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="relative pointer-events-auto transform-gpu"
    >
      <span className={`pointer-events-none absolute -inset-2 rounded-2xl blur-2xl opacity-40 bg-gradient-to-r ${palette.glow}`} />
      <div className={`relative rounded-2xl p-[2px] bg-gradient-to-r ${palette.border} shadow-2xl`}>
        <div className="relative rounded-2xl bg-zinc-900/90 backdrop-blur-xl ring-1 ring-white/10 px-5 py-4 flex items-center gap-4">
          <div className="relative">
            <div className={`rounded-xl p-[2px] bg-gradient-to-br ${palette.border}`}>
              <div className="h-10 w-10 rounded-[10px] bg-zinc-900/80 flex items-center justify-center shadow-inner">
                {IconEl}
              </div>
            </div>
          </div>
          <p className="font-semibold text-base text-white/90">{message}</p>
          <button onClick={onClose} className="ml-4 rounded-lg p-2 hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
          <motion.span
            className={`absolute left-0 bottom-0 h-[2px] bg-gradient-to-r ${palette.border} origin-left`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: durationMs / 1000, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const showToast = (message, type = 'success', icon = null) => {
  toast.custom((t) => (
    <ModernToast type={type} message={message} icon={icon || type} durationMs={4000} onClose={() => toast.dismiss(t.id)} />
  ), { duration: 4000, position: 'top-center' });
};

// --- 2. Memoized Tab Wrappers (CRITICAL for performance) ---
// These prevent the tabs from re-rendering when the Timer ticks in the parent

const MemoizedTodayTab = memo(TodayTab);
const MemoizedFavoritesTab = memo(FavoritesTab);
const MemoizedPlansTab = memo(PlansTab);

export default function WorkoutOrganizer() {
  const { setCurrentPage } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('today');

  const {
    todayExercises, setTodayExercises,
    fullFavorites,
    plans, setPlans,
    activePlan, setActivePlan: setActivePlanState,
    exerciseHistory, setExerciseHistory,
    loadAllData, enrichWithGif
  } = useWorkoutData();

  // Workout State
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const intervalRef = useRef(null);

  // Logging State
  const [loggingSet, setLoggingSet] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [repInput, setRepInput] = useState('');

  // Planning State
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [planDays, setPlanDays] = useState(DAYS_OF_WEEK.map(day => ({ day, exercises: [] })));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [planSearch, setPlanSearch] = useState('');
  const [planResults, setPlanResults] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planCurrentPage, setPlanCurrentPage] = useState(1);
  const [planTotalPages, setPlanTotalPages] = useState(1);
  const [planTotalCount, setPlanTotalCount] = useState(0);

  // --- 3. Optimized Callbacks ---

  const refreshHistory = useCallback(async () => {
    try {
      const history = await getAllExerciseHistory();
      setExerciseHistory(history);
    } catch (error) {
      console.error('Failed to refresh history:', error);
    }
  }, [setExerciseHistory]);

  // Timer Logic
  useEffect(() => {
    if (!isWorkoutStarted || todayExercises.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    
    if (secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            // Audio cue can be moved to a ref to avoid recreating the object
            new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=').play().catch(() => {});
            setIsResting(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isWorkoutStarted, secondsLeft, todayExercises.length]);

  const formatTime = useCallback((secs) => 
    `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`
  , []);

  const startWorkout = useCallback(() => {
    if (todayExercises.length === 0) {
      showToast('Add exercises first!', 'error');
      return;
    }
    setIsWorkoutStarted(true);
    setCurrentExerciseIndex(0);
    setSecondsLeft(0);
    setIsResting(false);
    showToast('Workout Started! Let\'s crush it!', 'success', 'fire');
  }, [todayExercises.length]);

  const nextExercise = useCallback(() => {
    const nextIdx = currentExerciseIndex + 1;
    if (nextIdx < todayExercises.length) {
      setCurrentExerciseIndex(nextIdx);
      setSecondsLeft(todayExercises[nextIdx]?.rest || 90);
      setIsResting(true);
    } else {
      showToast('Workout Complete! You\'re a beast!', 'success', 'fire');
      confetti({ particleCount: 400, spread: 100, origin: { y: 0.6 } });
      setIsWorkoutStarted(false);
      setCurrentExerciseIndex(0);
    }
  }, [currentExerciseIndex, todayExercises]);

  const quickAdd = useCallback(async (ex) => {
    try {
      const enriched = await enrichWithGif(ex);
      await addToTodayWorkout(enriched);
      showToast(`Added ${enriched.name}!`, 'success', 'muscle');
      await loadAllData();
    } catch (err) {
      showToast('Already in today\'s workout', 'error');
    }
  }, [enrichWithGif, loadAllData]);

  const openLogModal = useCallback((exerciseId, setIndex) => {
    setLoggingSet({ exerciseId, setIndex });
    const ex = todayExercises.find(e => (e.id || e.exerciseId) === exerciseId);
    setRepInput((ex?.reps || '10').toString().replace(/[^0-9]/g, ''));
    setWeightInput('');
  }, [todayExercises]);

  const saveLog = useCallback(async () => {
    if (!weightInput || !repInput) {
      showToast('Enter weight & reps', 'error');
      return;
    }
    const weight = parseFloat(weightInput);
    const reps = parseInt(repInput);
    const oneRm = parseFloat((weight * (1 + reps / 30)).toFixed(2));
    const exId = loggingSet.exerciseId;
    
    let currentPR = parseFloat(exerciseHistory[exId]?.pr) || 0;
    
    // Logic to check alternate IDs for PR
    const ex = todayExercises.find(e => (e.id || e.exerciseId) === exId);
    if (currentPR === 0 && ex) {
      const alternateId = ex.id !== exId ? ex.id : ex.exerciseId;
      if (alternateId && exerciseHistory[alternateId]) {
        currentPR = parseFloat(exerciseHistory[alternateId]?.pr) || 0;
      }
    }

    await saveSetLog(exId, { weight, reps, oneRm, set: loggingSet.setIndex + 1 });

    if (oneRm > currentPR + 0.1) {
      confetti({ particleCount: 500, spread: 120 });
      showToast(`NEW PR! ${weight}kg × ${reps} = ${oneRm}kg 1RM`, 'success', 'fire');
    } else {
      showToast(`Set ${loggingSet.setIndex + 1} logged!`, 'success');
    }

    setLoggingSet(null);
    setWeightInput('');
    setRepInput('');
    await refreshHistory();
    loadAllData();
  }, [weightInput, repInput, loggingSet, todayExercises, exerciseHistory, refreshHistory, loadAllData]);

  // Search Effect
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!planSearch.trim()) {
        setPlanResults([]);
        return;
      }
      setPlanLoading(true);
      try {
        const res = await fetchExercises(planCurrentPage - 1, { search: planSearch, limit: LIMIT });
        const enriched = await Promise.all((res.exercises || []).map(enrichWithGif));
        setPlanResults(enriched); // Replaced pagination append logic with direct set for cleaner search behavior
        setPlanTotalCount(res.total || 0);
        setPlanTotalPages(Math.ceil((res.total || 0) / LIMIT));
      } catch (e) {
        showToast('Search failed', 'error');
      } finally {
        setPlanLoading(false);
      }
    }, 600); // Decreased debounce slightly for better responsiveness

    return () => clearTimeout(delay);
  }, [planSearch, planCurrentPage, enrichWithGif]);

  const handlePlanPageChange = useCallback((page) => {
    if (page < 1 || page > planTotalPages || planLoading) return;
    setPlanCurrentPage(page);
  }, [planTotalPages, planLoading]);

  const addToPlanDay = useCallback(async (dayIndex, exercise) => {
    try {
      const enriched = await enrichWithGif(exercise);
      const withDefaults = { 
        ...enriched, 
        sets: 4, reps: 10, rest: 90,
        exerciseId: enriched.id || enriched.exerciseId
      };
      
      setPlanDays(prev => {
        const newDays = [...prev];
        const targetDay = { ...newDays[dayIndex] };
        const existsInDay = targetDay.exercises.some(
          ex => (ex.id || ex.exerciseId) === (withDefaults.id || withDefaults.exerciseId)
        );
        if (existsInDay) {
          showToast('Exercise already in this day', 'warning');
          return prev;
        }
        targetDay.exercises = [...targetDay.exercises, withDefaults];
        newDays[dayIndex] = targetDay;
        showToast(`Added to ${DAYS_OF_WEEK[dayIndex]}!`, 'success');
        return newDays;
      });
    } catch (error) {
      showToast('Failed to add exercise', 'error');
    }
  }, [enrichWithGif]);

  const removeFromPlanDay = useCallback((dayIndex, exIndex) => {
    setPlanDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        exercises: newDays[dayIndex].exercises.filter((_, idx) => idx !== exIndex)
      };
      return newDays;
    });
  }, []);

  const reorderPlanDay = useCallback((dayIndex, newOrder) => {
    setPlanDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex] = { ...newDays[dayIndex], exercises: newOrder };
      return newDays;
    });
  }, []);

  const handleCloseCreatePlan = useCallback(() => {
    setShowCreatePlan(false);
    // Delay reset to allow animation to finish
    setTimeout(() => {
      setPlanSearch('');
      setPlanResults([]);
      setNewPlanName('');
      setEditingPlanId(null);
      setPlanDays(DAYS_OF_WEEK.map(day => ({ day, exercises: [] })));
      setSelectedDayIndex(0);
      setPlanCurrentPage(1);
    }, 300);
  }, []);

  const saveNewPlan = useCallback(async () => {
    if (!newPlanName.trim()) return showToast('Enter plan name', 'error');
    if (!planDays.some(d => d.exercises.length > 0)) return showToast('Add at least one exercise', 'error');

    try {
      if (editingPlanId) {
        const updatedPlan = {
          id: editingPlanId,
          name: newPlanName.trim(),
          days: planDays.map(day => ({
            ...day,
            exercises: day.exercises.map(ex => ({ ...ex, exerciseId: ex.id || ex.exerciseId }))
          })),
          updatedAt: new Date().toISOString()
        };
        await updateWorkoutPlan(editingPlanId, updatedPlan);
        showToast('Plan updated successfully!', 'success', 'rocket');
        setPlans(prev => prev.map(p => p.id === editingPlanId ? updatedPlan : p));
        if (activePlan?.id === editingPlanId) setActivePlanState(updatedPlan);
      } else {
        await saveWorkoutPlan(newPlanName.trim(), planDays);
        showToast('Plan created & activated!', 'success', 'rocket');
        confetti({ particleCount: 300, spread: 80 });
      }
      handleCloseCreatePlan();
      loadAllData();
    } catch (error) {
      showToast('Failed to save plan', 'error');
    }
  }, [newPlanName, planDays, editingPlanId, handleCloseCreatePlan, loadAllData, setPlans, activePlan, setActivePlanState]);

  const openEditPlan = useCallback((plan) => {
    setEditingPlanId(plan.id);
    setNewPlanName(plan.name);
    const clonedDays = DAYS_OF_WEEK.map(dayName => {
      const planDay = plan.days.find(d => d.day === dayName);
      return {
        day: dayName,
        exercises: planDay ? [...planDay.exercises.map(ex => ({ ...ex }))] : []
      };
    });
    setPlanDays(clonedDays);
    setSelectedDayIndex(0);
    setShowCreatePlan(true);
  }, []);

  const activatePlan = useCallback(async (planId) => {
    try {
      await setActivePlan(planId);
      const plan = plans.find(p => p.id === planId);
      setActivePlanState(plan);
      showToast('Plan activated!', 'success', 'rocket');
      confetti({ particleCount: 150 });
      loadAllData();
    } catch (error) {
      showToast('Failed to activate plan', 'error');
    }
  }, [plans, setActivePlanState, loadAllData]);

  const deletePlanHandler = useCallback((planId) => {
    const actuallyDelete = async (id) => {
      try {
        await deleteWorkoutPlan(id);
        showToast('Plan deleted!', 'info', 'trash');
        loadAllData();
      } catch (error) {
        showToast('Failed to delete plan', 'error');
      }
    };

    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 p-6 rounded-2xl text-white shadow-2xl border border-zinc-700"
      >
        <p className="text-lg font-bold mb-4">Delete this plan?</p>
        <div className="flex gap-3">
          <button 
            onClick={() => { toast.dismiss(t.id); actuallyDelete(planId); }} 
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="bg-zinc-700 hover:bg-zinc-600 px-6 py-2 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    ), { duration: Infinity });
  }, [loadAllData]);

  const handleToggleFavorite = useCallback(async (exercise) => {
    try {
      const isFavorited = await toggleFavorite(exercise);
      if (isFavorited) showToast(`Added ${exercise.name} to Favorites!`, 'success', 'muscle');
      else showToast(`Removed ${exercise.name} from Favorites`, 'info', 'trash');
      loadAllData();
    } catch (error) {
      showToast('Failed to update Favorites', 'error');
    }
  }, [loadAllData]);

  // --- 4. Render ---
  
  return (
    <>
      <Toaster position="top-center" />

      <WorkoutModeOverlay
        isWorkoutStarted={isWorkoutStarted}
        todayExercises={todayExercises}
        currentExerciseIndex={currentExerciseIndex}
        secondsLeft={secondsLeft}
        isResting={isResting}
        formatTime={formatTime}
        nextExercise={nextExercise}
        setIsWorkoutStarted={setIsWorkoutStarted}
        exerciseHistory={exerciseHistory}
        openLogModal={openLogModal}
        refreshHistory={refreshHistory}
        showToast={showToast}
      />

      <LogSetModal
        loggingSet={loggingSet}
        exercise={todayExercises.find(e => (e.id || e.exerciseId) === loggingSet?.exerciseId)}
        weightInput={weightInput}
        setWeightInput={setWeightInput}
        repInput={repInput}
        setRepInput={setRepInput}
        saveLog={saveLog}
        onClose={() => setLoggingSet(null)}
      />

      <CreatePlanModal
        showCreatePlan={showCreatePlan}
        setShowCreatePlan={handleCloseCreatePlan}
        newPlanName={newPlanName}
        setNewPlanName={setNewPlanName}
        planDays={planDays}
        setPlanDays={setPlanDays}
        selectedDayIndex={selectedDayIndex}
        setSelectedDayIndex={setSelectedDayIndex}
        planSearch={planSearch}
        setPlanSearch={setPlanSearch}
        planResults={planResults}
        planLoading={planLoading}
        planTotalCount={planTotalCount}
        planCurrentPage={planCurrentPage}
        planTotalPages={planTotalPages}
        addToPlanDay={addToPlanDay}
        removeFromPlanDay={removeFromPlanDay}
        reorderPlanDay={reorderPlanDay}
        saveNewPlan={saveNewPlan}
        editingPlanId={editingPlanId}
        onPlanPageChange={handlePlanPageChange}
      />

      {/* Static Background - z-index set low to prevent interaction issues */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-950 to-black -z-50" />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] -z-40 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] -z-40 pointer-events-none" />

      {/* Main Layout */}
      <div className="min-h-screen w-full text-white relative flex flex-col overflow-x-hidden">
        <div className="w-full flex-grow px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-7xl mx-auto">
            
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center mb-10"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Dumbbell className="text-white w-8 h-8" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Workout Organizer</h1>
              </div>
            </motion.div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 p-1.5 bg-white/5 backdrop-blur-md rounded-full w-fit mx-auto border border-white/10">
              {['today', 'favorites', 'plans'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 z-10 ${
                    activeTab === tab ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full -z-10 shadow-lg shadow-emerald-500/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {tab === 'today' && `Today (${todayExercises.length})`}
                  {tab === 'favorites' && `Favorites (${fullFavorites.length})`}
                  {tab === 'plans' && `Plans (${plans.length})`}
                </button>
              ))}
            </div>

            {/* Content Area - Using Layout Animations */}
            <div className="relative min-h-[400px]">
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === 'today' && (
                  <motion.div
                    key="today"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="will-change-transform"
                  >
                    <MemoizedTodayTab
                      todayExercises={todayExercises}
                      setTodayExercises={setTodayExercises}
                      startWorkout={startWorkout}
                      clearTodayWorkout={clearTodayWorkout}
                      reorderTodayWorkout={reorderTodayWorkout}
                      removeFromToday={removeFromToday}
                      setCurrentPage={setCurrentPage}
                    />
                  </motion.div>
                )}

                {activeTab === 'favorites' && (
                  <motion.div
                    key="favorites"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="will-change-transform"
                  >
                    <MemoizedFavoritesTab 
                      fullFavorites={fullFavorites} 
                      quickAdd={quickAdd}
                      toggleFavorite={handleToggleFavorite}
                      showToast={showToast}
                    />
                  </motion.div>
                )}

                {activeTab === 'plans' && (
                  <motion.div
                    key="plans"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="will-change-transform"
                  >
                    <MemoizedPlansTab
                      plans={plans}
                      activePlan={activePlan}
                      activatePlan={activatePlan}
                      openEditPlan={openEditPlan}
                      deletePlan={deletePlanHandler}
                      setShowCreatePlan={setShowCreatePlan}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}