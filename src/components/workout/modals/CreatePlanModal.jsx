import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, AlertCircle, Check, Dumbbell, Search, ListOrdered
} from 'lucide-react';
import { SafeExerciseImage } from './components/SafeExerciseImage';
import { PlanDaySelector } from './components/PlanDaySelector';
import { SearchResults } from './components/SearchResults';
import { PlanExerciseList } from './components/PlanExerciseList';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Mobile tab states
const MOBILE_TABS = {
  DAYS: 'days',
  SEARCH: 'search',
  EXERCISES: 'exercises'
};

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
  const [mobileTab, setMobileTab] = useState(MOBILE_TABS.DAYS);

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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-0 sm:p-4"
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
            rounded-none sm:rounded-2xl lg:rounded-3xl w-full sm:max-w-7xl h-full sm:h-[95vh]
            overflow-hidden border-0 sm:border-2 border-emerald-500/30
            shadow-2xl shadow-emerald-500/20
            flex flex-col
          "
          onClick={e => e.stopPropagation()}
        >
          {/* ═══ COMPACT HEADER ═══ */}
          <div className="flex-shrink-0 p-3 sm:p-4 lg:p-5 bg-gradient-to-b from-emerald-950/60 via-emerald-950/30 to-transparent border-b border-emerald-500/20">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg border border-emerald-500/30"
                >
                  <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                    {editingPlanId ? 'Edit Plan' : 'New Plan'}
                  </h2>
                  {totalExercises > 0 && (
                    <p className="text-xs sm:text-sm text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      {activeDays}d • {totalExercises}ex
                    </p>
                  )}
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all border border-white/10"
              >
                <X className="w-5 h-5 text-white/70" />
              </motion.button>
            </div>

            {/* Compact Name Input */}
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Plan name..."
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              maxLength={50}
              className="
                w-full px-3 py-2.5 sm:py-3 rounded-lg
                bg-white/10 border border-white/20
                focus:border-emerald-500 focus:bg-white/15
                focus:ring-2 focus:ring-emerald-500/20
                transition-all duration-200 outline-none
                text-white placeholder-white/40 font-medium text-sm sm:text-base
              "
            />
          </div>

          {/* ═══ BODY - MOBILE TABS / DESKTOP PANELS ═══ */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
            {/* DESKTOP LAYOUT */}
            <div className="hidden lg:flex flex-1 min-h-0 overflow-hidden">
              {/* Day Selector Sidebar */}
              <div className="flex-shrink-0 w-64">
                <PlanDaySelector
                  days={planDays}
                  selectedDayIndex={selectedDayIndex}
                  onSelect={setSelectedDayIndex}
                  onToggleRest={toggleRestDay}
                />
              </div>

              {/* Search Panel */}
              <div className="flex-shrink-0 w-80 border-r border-white/10">
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
              <div className="flex-1 min-h-0">
                <PlanExerciseList
                  exercises={currentDay.exercises}
                  dayName={DAYS_OF_WEEK[selectedDayIndex]}
                  isRest={currentDay.isRest}
                  onReorder={newOrder => reorderPlanDay(selectedDayIndex, newOrder)}
                  onRemove={i => removeFromPlanDay(selectedDayIndex, i)}
                />
              </div>
            </div>

            {/* MOBILE LAYOUT - TAB BASED */}
            <div className="lg:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Mobile Tab Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  {mobileTab === MOBILE_TABS.DAYS && (
                    <motion.div
                      key="days"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <PlanDaySelector
                        days={planDays}
                        selectedDayIndex={selectedDayIndex}
                        onSelect={(i) => {
                          setSelectedDayIndex(i);
                          setMobileTab(MOBILE_TABS.EXERCISES);
                        }}
                        onToggleRest={toggleRestDay}
                      />
                    </motion.div>
                  )}

                  {mobileTab === MOBILE_TABS.SEARCH && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <SearchResults
                        search={planSearch}
                        setSearch={setPlanSearch}
                        results={planResults}
                        totalCount={planTotalCount}
                        currentPage={planCurrentPage}
                        totalPages={planTotalPages}
                        loading={planLoading}
                        onAdd={ex => {
                          if (!currentDay.isRest) {
                            addToPlanDay(selectedDayIndex, ex);
                            setMobileTab(MOBILE_TABS.EXERCISES);
                          }
                        }}
                        onPageChange={onPlanPageChange}
                      />
                    </motion.div>
                  )}

                  {mobileTab === MOBILE_TABS.EXERCISES && (
                    <motion.div
                      key="exercises"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <PlanExerciseList
                        exercises={currentDay.exercises}
                        dayName={DAYS_OF_WEEK[selectedDayIndex]}
                        isRest={currentDay.isRest}
                        onReorder={newOrder => reorderPlanDay(selectedDayIndex, newOrder)}
                        onRemove={i => removeFromPlanDay(selectedDayIndex, i)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Bottom Tab Bar */}
              <div className="flex-shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent border-t border-emerald-500/20 backdrop-blur-xl">
                <div className="grid grid-cols-3 gap-1 p-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileTab(MOBILE_TABS.DAYS)}
                    className={`
                      flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-all
                      ${mobileTab === MOBILE_TABS.DAYS
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-white/60 border border-white/10'
                      }
                    `}
                  >
                    <Dumbbell className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Days</span>
                    {activeDays > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                        {activeDays}
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileTab(MOBILE_TABS.SEARCH)}
                    className={`
                      flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-all
                      ${mobileTab === MOBILE_TABS.SEARCH
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-white/60 border border-white/10'
                      }
                    `}
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Search</span>
                    {planResults.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                        {planResults.length}
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileTab(MOBILE_TABS.EXERCISES)}
                    className={`
                      flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-all
                      ${mobileTab === MOBILE_TABS.EXERCISES
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-white/60 border border-white/10'
                      }
                    `}
                  >
                    <ListOrdered className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Exercises</span>
                    {currentDay.exercises.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                        {currentDay.exercises.length}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ COMPACT FOOTER ═══ */}
          <div className="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent border-t border-emerald-500/20 backdrop-blur-xl">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveNewPlan}
                disabled={!newPlanName.trim()}
                className="
                  flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600
                  hover:from-emerald-400 hover:to-emerald-500
                  disabled:from-gray-700 disabled:to-gray-800
                  disabled:cursor-not-allowed
                  py-3 px-4 rounded-lg font-bold text-sm sm:text-base
                  shadow-lg shadow-emerald-500/30
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  border border-emerald-400/30
                  disabled:border-gray-700
                "
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {editingPlanId ? 'Update Plan' : 'Save Plan'}
                </span>
                <span className="sm:hidden">
                  {editingPlanId ? 'Update' : 'Save'}
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="
                  px-6 sm:px-8 py-3 bg-white/10 hover:bg-white/20
                  rounded-lg font-semibold text-sm sm:text-base
                  transition-all border border-white/20
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