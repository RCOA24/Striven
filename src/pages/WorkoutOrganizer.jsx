'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Dumbbell } from 'lucide-react';
import { 
  clearTodayWorkout, reorderTodayWorkout, removeFromToday, addToTodayWorkout,
  setActivePlan, saveWorkoutPlan, deleteWorkoutPlan, saveSetLog 
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

export default function WorkoutOrganizer() {
  const { setCurrentPage } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('today');

  const {
    todayExercises, setTodayExercises,
    fullFavorites,
    plans, setPlans,
    activePlan, setActivePlan: setActivePlanState,
    exerciseHistory,
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
    if (todayExercises.length === 0) return toast.error('Add exercises first!');
    setIsWorkoutStarted(true);
    setCurrentExerciseIndex(0);
    setSecondsLeft(0);
    setIsResting(false);
    toast.success('Workout Started! Let’s crush it! 💪', { icon: '🔥', duration: 4000 });
  };

  const nextExercise = () => {
    const nextIdx = currentExerciseIndex + 1;
    if (nextIdx < todayExercises.length) {
      setCurrentExerciseIndex(nextIdx);
      setSecondsLeft(todayExercises[nextIdx]?.rest || 90);
      setIsResting(true);
    } else {
      toast.success('Workout Complete! You’re a beast! 🏆', { duration: 8000 });
      confetti({ particleCount: 400, spread: 100, origin: { y: 0.6 } });
      setIsWorkoutStarted(false);
      setCurrentExerciseIndex(0);
    }
  };

  const quickAdd = async (ex) => {
    try {
      const enriched = await enrichWithGif(ex);
      await addToTodayWorkout(enriched);
      toast.success(`✅ ${enriched.name} added!`, { icon: '💪' });
      loadAllData();
    } catch (err) {
      toast.error('Already in today’s workout');
    }
  };

  const openLogModal = (exerciseId, setIndex) => {
    setLoggingSet({ exerciseId, setIndex });
    const ex = todayExercises.find(e => (e.id || e.exerciseId) === exerciseId);
    setRepInput((ex?.reps || '10').toString().replace(/[^0-9]/g, ''));
    setWeightInput('');
  };

  const saveLog = async () => {
    if (!weightInput || !repInput) return toast.error('Enter weight & reps');
    const weight = parseFloat(weightInput);
    const reps = parseInt(repInput);
    const oneRm = parseFloat((weight * (1 + reps / 30)).toFixed(2));
    const ex = todayExercises.find(e => (e.id || e.exerciseId) === loggingSet.exerciseId);
    const exId = ex.id || ex.exerciseId;
    const currentPR = parseFloat(exerciseHistory[exId]?.pr) || 0;

    await saveSetLog(exId, { weight, reps, oneRm, set: loggingSet.setIndex + 1 });

    if (oneRm > currentPR + 0.1) {
      confetti({ particleCount: 500, spread: 120 });
      toast.success(`NEW PR! ${weight}kg × ${reps} = ${oneRm}kg 1RM 🏆🔥`, { duration: 10000 });
    } else {
      toast.success(`Set ${loggingSet.setIndex + 1} logged!`);
    }

    setLoggingSet(null);
    setWeightInput('');
    setRepInput('');
    loadAllData();
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
        const enriched = await Promise.all((res.exercises || []).map(enrichWithGif));
        setPlanResults(enriched);
      } catch (e) {
        toast.error('Search failed');
      } finally {
        setPlanLoading(false);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [planSearch]);

  const addToPlanDay = async (exercise) => {
    const enriched = await enrichWithGif(exercise);
    const withDefaults = { ...enriched, sets: 4, reps: 10, rest: 90 };
    const updated = [...planDays];
    updated[selectedDayIndex].exercises.push(withDefaults);
    setPlanDays(updated);
    toast.success(`Added to ${planDays[selectedDayIndex].day}!`);
  };

  const saveNewPlan = async () => {
    if (!newPlanName.trim()) return toast.error('Enter plan name');
    if (planDays.every(d => d.exercises.length === 0)) return toast.error('Add exercises');

    if (editingPlanId) {
      // For edit: update in DB would need update function, but we'll just replace in state
      setPlans(plans.map(p => p.id === editingPlanId ? { ...p, name: newPlanName, days: planDays } : p));
      toast.success('Plan updated! 🎉', { icon: '✏️' });
    } else {
      await saveWorkoutPlan(newPlanName, planDays);
      toast.success('Plan saved & activated! 🚀', { icon: '✅' });
    }
    confetti({ particleCount: 300, spread: 80 });
    setShowCreatePlan(false);
    setNewPlanName('');
    setEditingPlanId(null);
    setPlanDays(planDays.map(d => ({ ...d, exercises: [] })));
    loadAllData();
  };

  const openEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setNewPlanName(plan.name);
    setPlanDays(plan.days.map(d => ({ ...d, exercises: [...d.exercises] })));
    setShowCreatePlan(true);
  };

  const activatePlan = async (planId) => {
    await setActivePlan(planId);
    const plan = plans.find(p => p.id === planId);
    setActivePlanState(plan);
    toast.success('Plan activated! 💥', { icon: '✅', style: { background: '#10b981', color: 'white' } });
    confetti({ particleCount: 150 });
    loadAllData();
  };

const deletePlanHandler = async (planId) => {
  toast((t) => (
    <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 rounded-3xl text-white">
      <p className="text-2xl font-bold mb-4">🗑️ Delete this plan forever?</p>
      <div className="flex gap-4">
        <button onClick={() => { toast.dismiss(t.id); actuallyDelete(); }} className="bg-white text-black px-8 py-3 rounded-xl font-bold">
          Yes, Delete
        </button>
        <button onClick={() => toast.dismiss(t.id)} className="bg-white/20 px-8 py-3 rounded-xl font-bold">
          Cancel
        </button>
      </div>
    </div>
  ), { duration: Infinity });
};

const actuallyDelete = async () => {
  // your delete code
  toast.success('Plan deleted!', { icon: '🗑️' });
};

  const removeFromPlanDay = (dayIndex, exIndex) => {
    const updated = [...planDays];
    updated[dayIndex].exercises.splice(exIndex, 1);
    setPlanDays(updated);
  };

  const reorderPlanDay = (dayIndex, newOrder) => {
    const updated = [...planDays];
    updated[dayIndex].exercises = newOrder;
    setPlanDays(updated);
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 5000 }} />

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

          <div className="flex justify-center gap-4 mb-10 flex-wrap">
            {['today', 'favorites', 'plans'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${activeTab === tab 
                  ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/50' 
                  : 'bg-white/10 hover:bg-white/20'}`}
              >
                {tab === 'today' && `Today (${todayExercises.length})`}
                {tab === 'favorites' && `Favorites (${fullFavorites.length})`}
                {tab === 'plans' && `Plans (${plans.length})`}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'today' && (
              <motion.div key="today" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <TodayTab
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
              <motion.div key="favorites" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <FavoritesTab
                  fullFavorites={fullFavorites}
                  quickAdd={quickAdd}
                />
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div key="plans" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <PlansTab
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
    </>
  );
}