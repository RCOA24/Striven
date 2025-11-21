import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

  const toggleRestDay = useCallback((index) => {
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
  }, [selectedDayIndex, setPlanDays, setSelectedDayIndex]);

  useEffect(() => {
    if (showCreatePlan) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => nameInputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCreatePlan]);

  const handleClose = useCallback(() => {
    const hasChanges = newPlanName.trim() || planDays.some(d => d.exercises.length > 0 || d.isRest);
    if (hasChanges) setShowUnsavedWarning(true);
    else setShowCreatePlan(false);
  }, [newPlanName, planDays, setShowCreatePlan]);

  useEffect(() => {
    const esc = e => e.key === 'Escape' && handleClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [handleClose]);

  const confirmClose = useCallback(() => {
    setShowUnsavedWarning(false);
    setShowCreatePlan(false);
  }, [setShowCreatePlan]);

  const totalExercises = useMemo(() => 
    planDays.reduce((s, d) => s + (d.isRest ? 0 : d.exercises.length), 0),
    [planDays]
  );
  const activeDays = useMemo(() => 
    planDays.filter(d => !d.isRest && d.exercises.length > 0).length,
    [planDays]
  );
  const currentDay = useMemo(() => 
    planDays.find(d => d.day === DAYS_OF_WEEK[selectedDayIndex]) || {
      day: DAYS_OF_WEEK[selectedDayIndex],
      exercises: [],
      isRest: false
    },
    [planDays, selectedDayIndex]
  );

  const handleAddToPlanDay = useCallback((ex) => {
    if (!currentDay.isRest) {
      addToPlanDay(selectedDayIndex, ex);
      setMobileTab(MOBILE_TABS.EXERCISES);
    }
  }, [currentDay.isRest, addToPlanDay, selectedDayIndex]);

  const handleSelectDay = useCallback((i) => {
    setSelectedDayIndex(i);
    setMobileTab(MOBILE_TABS.EXERCISES);
  }, [setSelectedDayIndex]);

  return (
    <AnimatePresence mode="wait">
      {showCreatePlan && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-0 sm:p-4"
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="
              bg-gray-900
              rounded-none sm:rounded-2xl lg:rounded-3xl w-full sm:max-w-7xl h-full sm:h-[95vh]
              overflow-hidden border-0 sm:border-2 border-emerald-500/30
              shadow-2xl
              flex flex-col
            "
            style={{ 
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* ═══ COMPACT HEADER ═══ */}
            <div className="flex-shrink-0 p-3 sm:p-4 lg:p-5 bg-emerald-950/40 border-b border-emerald-500/20">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                    <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  </div>
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
                
                <button
                  onClick={handleClose}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                  style={{ touchAction: 'manipulation' }}
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
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
                  transition-colors duration-200 outline-none
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
                  {mobileTab === MOBILE_TABS.DAYS && (
                    <PlanDaySelector
                      days={planDays}
                      selectedDayIndex={selectedDayIndex}
                      onSelect={handleSelectDay}
                      onToggleRest={toggleRestDay}
                    />
                  )}

                  {mobileTab === MOBILE_TABS.SEARCH && (
                    <SearchResults
                      search={planSearch}
                      setSearch={setPlanSearch}
                      results={planResults}
                      totalCount={planTotalCount}
                      currentPage={planCurrentPage}
                      totalPages={planTotalPages}
                      loading={planLoading}
                      onAdd={handleAddToPlanDay}
                      onPageChange={onPlanPageChange}
                    />
                  )}

                  {mobileTab === MOBILE_TABS.EXERCISES && (
                    <PlanExerciseList
                      exercises={currentDay.exercises}
                      dayName={DAYS_OF_WEEK[selectedDayIndex]}
                      isRest={currentDay.isRest}
                      onReorder={newOrder => reorderPlanDay(selectedDayIndex, newOrder)}
                      onRemove={i => removeFromPlanDay(selectedDayIndex, i)}
                    />
                  )}
                </div>

                {/* Mobile Bottom Tab Bar */}
                <div className="flex-shrink-0 bg-black border-t border-emerald-500/20">
                  <div className="grid grid-cols-3 gap-1 p-2">
                    <button
                      onClick={() => setMobileTab(MOBILE_TABS.DAYS)}
                      className={`
                        flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-colors
                        ${mobileTab === MOBILE_TABS.DAYS
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-white/60 border border-white/10'
                        }
                      `}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Dumbbell className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Days</span>
                      {activeDays > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                          {activeDays}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setMobileTab(MOBILE_TABS.SEARCH)}
                      className={`
                        flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-colors
                        ${mobileTab === MOBILE_TABS.SEARCH
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-white/60 border border-white/10'
                        }
                      `}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Search className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Search</span>
                      {planResults.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                          {planResults.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setMobileTab(MOBILE_TABS.EXERCISES)}
                      className={`
                        flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-colors
                        ${mobileTab === MOBILE_TABS.EXERCISES
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-white/60 border border-white/10'
                        }
                      `}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <ListOrdered className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Exercises</span>
                      {currentDay.exercises.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                          {currentDay.exercises.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ COMPACT FOOTER ═══ */}
            <div className="flex-shrink-0 p-3 sm:p-4 bg-black/80 border-t border-emerald-500/20">
              <div className="flex gap-2">
                <button
                  onClick={saveNewPlan}
                  disabled={!newPlanName.trim()}
                  className="
                    flex-1 bg-emerald-500
                    hover:bg-emerald-400
                    disabled:bg-gray-700
                    disabled:cursor-not-allowed
                    py-3 px-4 rounded-lg font-bold text-sm sm:text-base
                    shadow-lg
                    transition-colors duration-200
                    active:scale-95
                    flex items-center justify-center gap-2
                    border border-emerald-400/30
                    disabled:border-gray-700
                  "
                  style={{ touchAction: 'manipulation' }}
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {editingPlanId ? 'Update Plan' : 'Save Plan'}
                  </span>
                  <span className="sm:hidden">
                    {editingPlanId ? 'Update' : 'Save'}
                  </span>
                </button>
                
                <button
                  onClick={handleClose}
                  className="
                    px-6 sm:px-8 py-3 bg-white/10 hover:bg-white/20
                    rounded-lg font-semibold text-sm sm:text-base
                    transition-colors border border-white/20
                    active:scale-95
                  "
                  style={{ touchAction: 'manipulation' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showUnsavedWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[110]"
          onClick={() => setShowUnsavedWarning(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border-2 border-red-500/30 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
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
              <button
                onClick={confirmClose}
                className="
                  flex-1 py-3.5 px-4
                  bg-red-500 hover:bg-red-600
                  rounded-xl font-semibold
                  transition-colors shadow-lg
                  border border-red-400/30
                  active:scale-95
                "
                style={{ touchAction: 'manipulation' }}
              >
                Leave Anyway
              </button>
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="
                  flex-1 py-3.5 px-4
                  bg-white/10 hover:bg-white/20
                  rounded-xl font-semibold
                  transition-colors border-2 border-white/20 hover:border-white/30
                  active:scale-95
                "
                style={{ touchAction: 'manipulation' }}
              >
                Keep Editing
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};