import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, AlertCircle, Check, Dumbbell
} from 'lucide-react';
import { SafeExerciseImage } from './components/SafeExerciseImage';
import { PlanDaySelector } from './components/PlanDaySelector';
import { SearchResults } from './components/SearchResults';
import { PlanExerciseList } from './components/PlanExerciseList';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ══════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ══════════════════════════════════════════════════════════════
export const CreatePlanModal = ({
  showCreatePlan,
  setShowCreatePlan,
  newPlanName,
  setNewPlanName,
  planDays,
  setPlanDays,
  selectedDayIndex,
  setSelectedDayIndex,
  planSearch,
  setPlanSearch,
  planResults,
  planLoading,
  planTotalCount,
  planCurrentPage,
  planTotalPages,
  addToPlanDay,
  removeFromPlanDay,
  reorderPlanDay,
  saveNewPlan,
  editingPlanId,
  onPlanPageChange
}) => {
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const toggleRestDay = (index) => {
    setPlanDays(prev => {
      const newDays = [...prev];
      const day = newDays[index];
      const willBeRest = !day.isRest;
      newDays[index] = {
        ...day,
        isRest: willBeRest,
        exercises: willBeRest ? [] : day.exercises
      };
      if (willBeRest && selectedDayIndex === index) {
        const next = newDays.findIndex((d, i) => i > index && !d.isRest);
        setSelectedDayIndex(next !== -1 ? next : newDays.findIndex(d => !d.isRest));
      }
      return newDays;
    });
  };

  useEffect(() => {
    if (showCreatePlan) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => nameInputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCreatePlan]);

  useEffect(() => {
    const esc = e => e.key === 'Escape' && handleClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const handleClose = () => {
    const hasChanges = newPlanName.trim() || planDays.some(d => d.exercises.length > 0 || d.isRest);
    if (hasChanges) setShowUnsavedWarning(true);
    else setShowCreatePlan(false);
  };

  const confirmClose = () => {
    setShowUnsavedWarning(false);
    setShowCreatePlan(false);
  };

  if (!showCreatePlan) return null;

  const totalExercises = planDays.reduce((s, d) => s + (d.isRest ? 0 : d.exercises.length), 0);
  const activeDays = planDays.filter(d => !d.isRest && d.exercises.length > 0).length;
  const currentDay = planDays.find(d => d.day === DAYS_OF_WEEK[selectedDayIndex]) || {
    day: DAYS_OF_WEEK[selectedDayIndex],
    exercises: [],
    isRest: false
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-4"
        onClick={e => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="
            bg-gradient-to-br from-gray-900 via-emerald-950/30 to-gray-900
            rounded-2xl lg:rounded-3xl w-full max-w-7xl h-[98vh] lg:h-[95vh]
            overflow-hidden border-2 border-emerald-500/30
            shadow-2xl shadow-emerald-500/20
            flex flex-col
          "
          onClick={e => e.stopPropagation()}
        >
          {/* ═══ HEADER ═══ */}
          <div className="flex-shrink-0 p-4 lg:p-6 bg-gradient-to-b from-emerald-950/60 via-emerald-950/30 to-transparent border-b border-emerald-500/20">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30"
                  >
                    <Dumbbell className="w-6 h-6 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">
                      {editingPlanId ? 'Edit Workout Plan' : 'Create New Plan'}
                    </h2>
                    {totalExercises > 0 && (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm text-emerald-400 mt-1 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {activeDays} day{activeDays !== 1 ? 's' : ''} • {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-all border border-white/10 hover:border-white/20"
              >
                <X className="w-6 h-6 text-white/70" />
              </motion.button>
            </div>

            {/* Plan Name Input */}
            <motion.div
              animate={{ scale: nameFocused ? 1.01 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="Enter plan name (e.g., Upper/Lower Split, Push/Pull/Legs)"
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  maxLength={50}
                  className="
                    w-full px-5 py-4 rounded-xl
                    bg-white/10 border-2 border-white/20
                    focus:border-emerald-500 focus:bg-white/15
                    focus:ring-4 focus:ring-emerald-500/20
                    transition-all duration-200 outline-none
                    text-white placeholder-white/40 font-semibold text-lg
                  "
                />
                {newPlanName && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
                  >
                    <span className="text-xs text-white/40">
                      {newPlanName.length}/50
                    </span>
                    <Check className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ═══ BODY ═══ */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Day Selector Sidebar */}
            <div className="flex-shrink-0">
              <PlanDaySelector
                days={planDays}
                selectedDayIndex={selectedDayIndex}
                onSelect={setSelectedDayIndex}
                onToggleRest={toggleRestDay}
              />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Search Panel */}
              <div className="flex-shrink-0 h-1/2 lg:h-auto lg:w-96 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-white/10">
                <SearchResults
                  search={planSearch}
                  setSearch={setPlanSearch}
                  results={planResults}
                  totalCount={planTotalCount}
                  currentPage={planCurrentPage}
                  totalPages={planTotalPages}
                  loading={planLoading}
                  onAdd={ex => !currentDay.isRest && addToPlanDay(selectedDayIndex, ex)}
                  onPageChange={onPlanPageChange}
                />
              </div>

              {/* Exercise List Panel */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <PlanExerciseList
                  exercises={currentDay.exercises}
                  dayName={DAYS_OF_WEEK[selectedDayIndex]}
                  isRest={currentDay.isRest}
                  onReorder={newOrder => reorderPlanDay(selectedDayIndex, newOrder)}
                  onRemove={i => removeFromPlanDay(selectedDayIndex, i)}
                />
              </div>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="flex-shrink-0 p-4 lg:p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent border-t border-emerald-500/20 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveNewPlan}
                disabled={!newPlanName.trim()}
                className="
                  flex-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600
                  hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500
                  disabled:from-gray-700 disabled:to-gray-800
                  disabled:cursor-not-allowed
                  py-4 px-6 rounded-xl font-bold text-lg
                  shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50
                  transition-all duration-200
                  flex items-center justify-center gap-3
                  border-2 border-emerald-400/30
                  disabled:border-gray-700
                  relative overflow-hidden
                  group
                "
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <Save className="w-5 h-5 relative z-10" />
                <span className="relative z-10">
                  {editingPlanId ? 'Update Plan' : 'Save Plan'}
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="
                  px-8 py-4 bg-white/10 hover:bg-white/20
                  rounded-xl font-semibold text-lg
                  transition-all border-2 border-white/20 hover:border-white/30
                "
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ═══ UNSAVED WARNING DIALOG ═══ */}
        <AnimatePresence>
          {showUnsavedWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[110]"
              onClick={() => setShowUnsavedWarning(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
                className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-red-500/30 shadow-2xl shadow-red-500/20"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start gap-4 mb-6">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="p-3 bg-red-500/20 rounded-xl border border-red-500/30"
                  >
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Unsaved Changes
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      You have unsaved changes to your workout plan. Are you sure you want to leave? All progress will be lost.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmClose}
                    className="
                      flex-1 py-3.5 px-4
                      bg-gradient-to-r from-red-500 to-red-600
                      hover:from-red-600 hover:to-red-700
                      rounded-xl font-semibold
                      transition-all shadow-lg shadow-red-500/30
                      border border-red-400/30
                    "
                  >
                    Leave Anyway
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUnsavedWarning(false)}
                    className="
                      flex-1 py-3.5 px-4
                      bg-white/10 hover:bg-white/20
                      rounded-xl font-semibold
                      transition-all border-2 border-white/20 hover:border-white/30
                    "
                  >
                    Keep Editing
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};