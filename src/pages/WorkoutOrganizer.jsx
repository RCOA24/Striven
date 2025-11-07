'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Dumbbell } from 'lucide-react';
import { 
  clearTodayWorkout, reorderTodayWorkout, removeFromToday, addToTodayWorkout,
  setActivePlan, saveWorkoutPlan, saveSetLog 
} from '../utils/db'; // ← FIXED: setActivePlan
import { fetchExercises } from '../api/exercises';
import { AppContext } from '../App';

import { useWorkoutData } from '../components/workout/hooks/useWorkoutData';
import { TodayTab } from '../components/workout/tabs/TodayTab';
import { FavoritesTab } from '../components/workout/tabs/FavoritesTab';
import { PlansTab } from '../components/workout/tabs/PlansTab';
import { WorkoutModeOverlay } from '../components/workout/modals/WorkoutModeOverlay';
import { LogSetModal } from '../components/workout/modals/LogSetModal';
import { ExerciseModal } from '../components/workout/modals/ExerciseModal';
import { CreatePlanModal } from '../components/workout/modals/CreatePlanModal';

const LIMIT = 20;

export default function WorkoutOrganizer() {
  const { setCurrentPage } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('today');

  const {
    todayExercises, setTodayExercises,
    fullFavorites,
    plans, setPlans,
    activePlan, setActivePlan,
    exerciseHistory, setExerciseHistory,
    loadAllData, enrichWithGif
  } = useWorkoutData();

  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const intervalRef = useRef(null);

  const [loggingSet, setLoggingSet] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [repInput, setRepInput] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGifIndex, setCurrentGifIndex] = useState(0);
  const touchStartX = useRef(0);

  const [showCreatePlan, setShowCreatePlan] = useState(false);
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

  // Timer
  useEffect(() => {
    if (!isWorkoutStarted || todayExercises.length === 0) return;
    if (secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=').play().catch(() => {});
            setIsResting(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isWorkoutStarted, secondsLeft, currentExerciseIndex, isResting, todayExercises]);

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

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
      weight, reps,
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

  const clearPR = (exId) => {
    if (!confirm('Clear all logs and PR?')) return;
    setExerciseHistory(prev => ({ ...prev, [exId]: { logs: [], pr: 0 } }));
    toast.success('PR cleared!');
  };

  const handleTouchStart = (e) => touchStartX.current = e.touches[0].clientX;
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentGifIndex < (selectedExercise?.images?.length || 1) - 1) setCurrentGifIndex(i => i + 1);
      else if (diff < 0 && currentGifIndex > 0) setCurrentGifIndex(i => i - 1);
    }
  };

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!planSearch.trim()) {
        setPlanResults([]);
        return;
      }
      setPlanLoading(true);
      try {
        const res = await fetchExercises(0, { search: planSearch, limit: LIMIT });
        const enriched = await Promise.all((res.exercises || []).map(enrichWithGif));
        setPlanResults(enriched);
      } catch {} finally {
        setPlanLoading(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [planSearch]);

  const addToPlanDay = async (exercise) => {
    const enriched = await enrichWithGif(exercise);
    const withDefaults = { ...enriched, sets: enriched.sets || 4, reps: enriched.reps || 10, rest: enriched.rest || 90 };
    const updated = [...planDays];
    updated[selectedDayIndex].exercises.push(withDefaults);
    setPlanDays(updated);
    toast.success(`Added to ${updated[selectedDayIndex].day}!`);
  };

  const saveNewPlan = async () => {
    if (!newPlanName.trim()) return toast.error('Enter plan name');
    if (planDays.every(d => d.exercises.length === 0)) return toast.error('Add exercises');
    if (editingPlanId) {
      toast.success('Plan updated! 🎉');
    } else {
      await saveWorkoutPlan(newPlanName, planDays);
      toast.success('Plan saved! 🎉');
    }
    setShowCreatePlan(false);
    setNewPlanName('');
    setPlanDays(planDays.map(d => ({ ...d, exercises: [] })));
    loadAllData();
  };

  const openEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setNewPlanName(plan.name);
    setPlanDays(plan.days.map(d => ({ ...d, exercises: [...d.exercises] })));
    setShowCreatePlan(true);
  };

  const deletePlan = async (planId) => {
    if (!confirm('Delete this plan?')) return;
    setPlans(plans.filter(p => p.id !== planId));
    if (activePlan?.id === planId) {
      setActivePlan(null);
      await setActivePlan(null); // ← FIXED
    }
    toast.success('Plan deleted!');
    loadAllData();
  };

  const activatePlan = async (planId) => {
    await setActivePlan(planId); // ← FIXED
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
        clearPR={clearPR}
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

      <ExerciseModal
        isOpen={isModalOpen}
        exercise={selectedExercise}
        onClose={() => setIsModalOpen(false)}
        onQuickAdd={quickAdd}
        currentGifIndex={currentGifIndex}
        setCurrentGifIndex={setCurrentGifIndex}
        handleTouchStart={handleTouchStart}
        handleTouchEnd={handleTouchEnd}
      />

      <CreatePlanModal
        showCreatePlan={showCreatePlan}
        setShowCreatePlan={setShowCreatePlan}
        newPlanName={newPlanName}
        setNewPlanName={setNewPlanName}
        planDays={planDays}
        selectedDayIndex={selectedDayIndex}
        setSelectedDayIndex={setSelectedDayIndex}
        planSearch={planSearch}
        setPlanSearch={setPlanSearch}
        planResults={planResults}
        planLoading={planLoading}
        addToPlanDay={addToPlanDay}
        removeFromPlanDay={removeFromPlanDay}
        reorderPlanDay={reorderPlanDay}
        saveNewPlan={saveNewPlan}
        editingPlanId={editingPlanId}
      />

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
        <div className="max-w-7xl mx-auto p-6">
          <motion.h1 initial={{ y: -40 }} animate={{ y: 0 }} className="text-6xl font-bold text-center mb-12 flex items-center justify-center gap-4">
            <Dumbbell className="text-emerald-400" />
            Workout Organizer
          </motion.h1>

          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {['today', 'favorites', 'plans'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-full font-bold ${activeTab === tab ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {tab === 'today' && `Today (${todayExercises.length})`}
                {tab === 'favorites' && `Favorites (${fullFavorites.length})`}
                {tab === 'plans' && `Plans (${plans.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'today' && (
            <TodayTab
              todayExercises={todayExercises}
              setTodayExercises={setTodayExercises}
              startWorkout={startWorkout}
              clearTodayWorkout={clearTodayWorkout}
              reorderTodayWorkout={reorderTodayWorkout}
              removeFromToday={removeFromToday}
              setCurrentPage={setCurrentPage}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritesTab
              fullFavorites={fullFavorites}
              setSelectedExercise={setSelectedExercise}
              setIsModalOpen={setIsModalOpen}
              setCurrentGifIndex={setCurrentGifIndex}
              quickAdd={quickAdd}
            />
          )}

          {activeTab === 'plans' && (
            <PlansTab
              plans={plans}
              activePlan={activePlan}
              activatePlan={activatePlan}
              openEditPlan={openEditPlan}
              deletePlan={deletePlan}
            />
          )}
        </div>
      </div>
    </>
  );
}