'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Dumbbell, CheckCircle, XCircle, AlertCircle, Trash2, Zap } from 'lucide-react';
import { 
  clearTodayWorkout, reorderTodayWorkout, removeFromToday, addToTodayWorkout,
  setActivePlan, saveWorkoutPlan, deleteWorkoutPlan, saveSetLog, updateWorkoutPlan,
  getAllExerciseHistory
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

// Modern Toast Component
const ModernToast = ({ type, message, icon }) => {
  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    info: <Zap className="w-6 h-6" />,
    fire: 'fire',
    muscle: 'muscle',
    rocket: 'rocket',
    trash: <Trash2 className="w-6 h-6" />
  };

  const colors = {
    success: 'from-emerald-500 to-teal-500',
    error: 'from-red-500 to-rose-500',
    warning: 'from-amber-500 to-orange-500',
    info: 'from-blue-500 to-cyan-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-gradient-to-r ${colors[type] || colors.info} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-white/20`}
    >
      <div className="text-white">
        {icons[icon] || icons[type]}
      </div>
      <p className="font-bold text-base">{message}</p>
    </motion.div>
  );
};

const showToast = (message, type = 'success', icon = null) => {
  toast.custom((t) => (
    <ModernToast type={type} message={message} icon={icon || type} />
  ), {
    duration: 4000,
    position: 'top-center'
  });
};

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
  const [planDays, setPlanDays] = useState(DAYS_OF_WEEK.map(day => ({ day, exercises: [] })));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [planSearch, setPlanSearch] = useState('');
  const [planResults, setPlanResults] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  // ── PLAN PAGINATION STATE ────────────────────────────────────────
  const [planCurrentPage, setPlanCurrentPage] = useState(1);
  const [planTotalPages, setPlanTotalPages] = useState(1);
  const [planTotalCount, setPlanTotalCount] = useState(0);

  // DEBUG: Track state changes
  useEffect(() => {
    console.log('currentExerciseIndex changed:', currentExerciseIndex);
    if (isWorkoutStarted) {
      console.log('Current exercise:', todayExercises[currentExerciseIndex]?.name);
    }
  }, [currentExerciseIndex, isWorkoutStarted, todayExercises]);

  // ADDED: Refresh History Function
  const refreshHistory = async () => {
    try {
      const history = await getAllExerciseHistory();
      setExerciseHistory(history);
    } catch (error) {
      console.error('Failed to refresh history:', error);
    }
  };

  // Timer - FIXED: Only counts down when secondsLeft > 0
  useEffect(() => {
    if (!isWorkoutStarted || todayExercises.length === 0) {
      clearInterval(intervalRef.current);
      return;
    }
    
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
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => clearInterval(intervalRef.current);
  }, [isWorkoutStarted, secondsLeft, todayExercises.length]);

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  const startWorkout = () => {
    console.log('startWorkout called');
    console.log('State before:', { currentExerciseIndex, secondsLeft, isResting, isWorkoutStarted });
    
    if (todayExercises.length === 0) {
      showToast('Add exercises first!', 'error');
      return;
    }
    
    setIsWorkoutStarted(true);
    setCurrentExerciseIndex(0);
    setSecondsLeft(0);
    setIsResting(false);
    
    console.log('Workout started - should be on exercise 0');
    showToast('Workout Started! Let\'s crush it!', 'success', 'fire');
  };

  const nextExercise = () => {
    const stack = new Error().stack;
    console.log('nextExercise called!');
    console.log('Stack trace:', stack);
    console.log('Current state:', { currentExerciseIndex, todayExercises: todayExercises.length });
    
    if (stack.includes('saveLog') || stack.includes('refreshHistory') || stack.includes('loadAllData')) {
      console.error('WARNING: nextExercise called from save/refresh function!');
      console.error('This should NOT happen. Check for auto-advance logic.');
    }
    
    const nextIdx = currentExerciseIndex + 1;
    if (nextIdx < todayExercises.length) {
      setCurrentExerciseIndex(nextIdx);
      setSecondsLeft(todayExercises[nextIdx]?.rest || 90);
      setIsResting(true);
      console.log('Moving to exercise', nextIdx);
    } else {
      showToast('Workout Complete! You\'re a beast!', 'success', 'fire');
      confetti({ particleCount: 400, spread: 100, origin: { y: 0.6 } });
      setIsWorkoutStarted(false);
      setCurrentExerciseIndex(0);
      console.log('Workout complete');
    }
  };

  const quickAdd = async (ex) => {
    try {
      const enriched = await enrichWithGif(ex);
      await addToTodayWorkout(enriched);
      showToast(`Added ${enriched.name}!`, 'success', 'muscle');
      loadAllData();
    } catch (err) {
      showToast('Already in today\'s workout', 'error');
    }
  };

  const openLogModal = (exerciseId, setIndex) => {
    console.log('Opening log modal:', { exerciseId, setIndex });
    console.log('Current exercise index:', currentExerciseIndex);
    setLoggingSet({ exerciseId, setIndex });
    const ex = todayExercises.find(e => (e.id || e.exerciseId) === exerciseId);
    setRepInput((ex?.reps || '10').toString().replace(/[^0-9]/g, ''));
    setWeightInput('');
    console.log('Modal opened - should NOT advance exercise');
  };

  const saveLog = async () => {
    if (!weightInput || !repInput) {
      showToast('Enter weight & reps', 'error');
      return;
    }
    const weight = parseFloat(weightInput);
    const reps = parseInt(repInput);
    const oneRm = parseFloat((weight * (1 + reps / 30)).toFixed(2));
    
    const exId = loggingSet.exerciseId;
    
    let currentPR = parseFloat(exerciseHistory[exId]?.pr) || 0;
    
    const ex = todayExercises.find(e => 
      (e.id || e.exerciseId) === exId || 
      (e.exerciseId || e.id) === exId
    );
    if (currentPR === 0 && ex) {
      const alternateId = ex.id !== exId ? ex.id : ex.exerciseId;
      if (alternateId && exerciseHistory[alternateId]) {
        currentPR = parseFloat(exerciseHistory[alternateId]?.pr) || 0;
      }
    }

    console.log('Saving log:', { exId, weight, reps, oneRm, currentPR });

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
    
    console.log('Set logged - NOT calling nextExercise');
  };

  // ── PLAN SEARCH (PAGINATED) ─────────────────────────────────────
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!planSearch.trim()) {
        setPlanResults([]);
        setPlanCurrentPage(1);
        setPlanTotalPages(1);
        setPlanTotalCount(0);
        return;
      }

      setPlanLoading(true);
      try {
        const res = await fetchExercises(planCurrentPage - 1, {
          search: planSearch,
          limit: LIMIT
        });

        const enriched = await Promise.all(
          (res.exercises || []).map(enrichWithGif)
        );

        setPlanResults(prev =>
          planCurrentPage === 1 ? enriched : [...prev, ...enriched]
        );
        setPlanResults(enriched);
        setPlanTotalCount(res.total || 0);
        setPlanTotalPages(Math.ceil((res.total || 0) / LIMIT));
      } catch (e) {
        showToast('Search failed', 'error');
      } finally {
        setPlanLoading(false);
      }
    }, 900);

    return () => clearTimeout(delay);
  }, [planSearch, planCurrentPage]);

  // ── PAGE CHANGE HANDLER ───────────────────────────────────────
  const handlePlanPageChange = (page) => {
    if (page < 1 || page > planTotalPages || planLoading) return;
    setPlanCurrentPage(page);
  };

  const addToPlanDay = async (dayIndex, exercise) => {
    try {
      const enriched = await enrichWithGif(exercise);
      const withDefaults = { 
        ...enriched, 
        sets: 4, 
        reps: 10, 
        rest: 90,
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
      console.error('Error adding to plan day:', error);
      showToast('Failed to add exercise', 'error');
    }
  };

  const removeFromPlanDay = (dayIndex, exIndex) => {
    setPlanDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        exercises: newDays[dayIndex].exercises.filter((_, idx) => idx !== exIndex)
      };
      return newDays;
    });
    showToast('Exercise removed', 'info');
  };

  const reorderPlanDay = (dayIndex, newOrder) => {
    setPlanDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        exercises: newOrder
      };
      return newDays;
    });
  };

  const handleCloseCreatePlan = () => {
    setShowCreatePlan(false);
    setTimeout(() => {
      setPlanSearch('');
      setPlanResults([]);
      setNewPlanName('');
      setEditingPlanId(null);
      setPlanDays(DAYS_OF_WEEK.map(day => ({ day, exercises: [] })));
      setSelectedDayIndex(0);
      // Reset pagination
      setPlanCurrentPage(1);
      setPlanTotalPages(1);
      setPlanTotalCount(0);
    }, 300);
  };

  const saveNewPlan = async () => {
    if (!newPlanName.trim()) {
      showToast('Enter plan name', 'error');
      return;
    }
    
    const hasExercises = planDays.some(d => d.exercises.length > 0);
    if (!hasExercises) {
      showToast('Add at least one exercise', 'errorfile');
      return;
    }

    try {
      if (editingPlanId) {
        const updatedPlan = {
          id: editingPlanId,
          name: newPlanName.trim(),
          days: planDays.map(day => ({
            ...day,
            exercises: day.exercises.map(ex => ({
              ...ex,
              exerciseId: ex.id || ex.exerciseId,
              id: ex.id || ex.exerciseId
            }))
          })),
          updatedAt: new Date().toISOString()
        };
        
        await updateWorkoutPlan(editingPlanId, updatedPlan);
        showToast('Plan updated successfully!', 'success', 'rocket');
        
        setPlans(prev => prev.map(p => p.id === editingPlanId ? updatedPlan : p));
        if (activePlan?.id === editingPlanId) {
          setActivePlanState(updatedPlan);
        }
      } else {
        await saveWorkoutPlan(newPlanName.trim(), planDays);
        showToast('Plan created & activated!', 'success', 'rocket');
        confetti({ particleCount: 300, spread: 80 });
      }
      
      handleCloseCreatePlan();
      loadAllData();
    } catch (error) {
      console.error('Error saving plan:', error);
      showToast('Failed to save plan', 'error');
    }
  };

  const openEditPlan = (plan) => {
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
    setPlanSearch('');
    setPlanResults([]);
    setShowCreatePlan(true);
  };

  const activatePlan = async (planId) => {
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
  };

  const deletePlanHandler = (planId) => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-red-600 to-rose-600 p-6 rounded-3xl text-white shadow-2xl border border-white/20"
      >
        <p className="text-2xl font-bold mb-4">Delete this plan forever?</p>
        <div className="flex gap-4">
          <button 
            onClick={() => { toast.dismiss(t.id); actuallyDelete(planId); }} 
            className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Yes, Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="bg-white/20 px-8 py-3 rounded-xl font-bold hover:bg-white/30 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    ), { duration: Infinity, position: 'top-center' });
  };

  const actuallyDelete = async (planId) => {
    try {
      await deleteWorkoutPlan(planId);
      showToast('Plan deleted!', 'info', 'trash');
      loadAllData();
    } catch (error) {
      showToast('Failed to delete plan', 'error');
    }
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
        refreshHistory={refreshHistory}
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
        setPlanDays={setPlanDays}               // <-- NEW
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

{/* Full-screen gradient background - fixed behind everything */}
<div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pointer-events-none -z-10" />

{/* Decorative gradient orbs */}
<div className="fixed top-20 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
<div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

{/* Content section - scrollable over the background */}
<div className="min-h-screen w-full text-white relative flex flex-col">
  <div className="w-full flex-grow px-4 sm:px-6 lg:px-8 py-12">
    <div className="w-full max-w-7xl mx-auto">
      <motion.h1
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-8 sm:mb-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
      >
        <Dumbbell className="text-emerald-400 w-10 h-10 sm:w-12 sm:h-12" />
        <span>Workout Organizer</span>
      </motion.h1>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
        {['today', 'favorites', 'plans'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base md:text-lg transition-all ${
              activeTab === tab
                ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/50 scale-105'
                : 'bg-white/10 hover:bg-white/20 hover:scale-105'
            }`}
          >
            {tab === 'today' && `Today (${todayExercises.length})`}
            {tab === 'favorites' && `Favorites (${fullFavorites.length})`}
            {tab === 'plans' && `Plans (${plans.length})`}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
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
          <motion.div
            key="favorites"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FavoritesTab fullFavorites={fullFavorites} quickAdd={quickAdd} />
          </motion.div>
        )}

        {activeTab === 'plans' && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
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
</div>



    </>
  );
}