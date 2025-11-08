import { motion, AnimatePresence } from 'framer-motion';
import { Reorder, useDragControls } from 'framer-motion';
import { Search, Loader2, GripVertical, X, Plus, Save, AlertCircle, ChevronLeft, ChevronRight, Dumbbell, Calendar, Trash2, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Mobile-friendly day selector with swipe navigation
const PlanDaySelector = ({ days, selectedDayIndex, onSelect }) => {
  const scrollRef = useRef(null);

  const scrollToDay = (index) => {
    if (scrollRef.current) {
      const dayElement = scrollRef.current.children[index];
      dayElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  useEffect(() => {
    scrollToDay(selectedDayIndex);
  }, [selectedDayIndex]);

  return (
    <div className="relative bg-gradient-to-b from-emerald-950/40 to-transparent border-b border-emerald-500/20">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 border-r border-emerald-500/20">
        <div className="p-4 border-b border-emerald-500/20">
          <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Calendar className="w-4 h-4" /> Weekly Schedule
          </h3>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
          {DAYS_OF_WEEK.map((dayName, i) => {
            const dayData = days.find(d => d.day === dayName) || { day: dayName, exercises: [] };
            const isSelected = selectedDayIndex === i;
            return (
              <motion.button
                key={dayName}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(i)}
                className={`w-full text-left p-4 transition-all border-b border-white/5 relative ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'hover:bg-white/5 text-white/80'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="dayIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${isSelected ? 'text-emerald-300' : ''}`}>
                    {dayName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      dayData.exercises.length > 0 
                        ? 'bg-emerald-500/30 text-emerald-300' 
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {dayData.exercises.length}
                    </span>
                    {dayData.exercises.length > 0 && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mobile Horizontal Scroll */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 p-3">
          <button
            onClick={() => onSelect(Math.max(0, selectedDayIndex - 1))}
            disabled={selectedDayIndex === 0}
            className="p-2 rounded-full bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div
            ref={scrollRef}
            className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {DAYS_OF_WEEK.map((dayName, i) => {
              const dayData = days.find(d => d.day === dayName) || { day: dayName, exercises: [] };
              const isSelected = selectedDayIndex === i;
              return (
                <motion.button
                  key={dayName}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(i)}
                  className={`snap-center flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <div className="text-xs font-bold">{dayName.substring(0, 3)}</div>
                  <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-white/60'}`}>
                    {dayData.exercises.length} ex
                  </div>
                </motion.button>
              );
            })}
          </div>

          <button
            onClick={() => onSelect(Math.min(DAYS_OF_WEEK.length - 1, selectedDayIndex + 1))}
            disabled={selectedDayIndex === DAYS_OF_WEEK.length - 1}
            className="p-2 rounded-full bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchResults = ({ search, setSearch, results, loading, onAdd }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="bg-black/40 backdrop-blur-sm sticky top-0 z-10">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search exercises (e.g., bench press, squats...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/10 border border-white/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none text-white placeholder-white/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        {search && !loading && (
          <div className="mt-3 text-xs text-white/60">
            Found {results.length} exercise{results.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 max-h-72 overflow-y-auto">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-xl p-3 animate-pulse flex gap-3">
                <div className="w-16 h-16 bg-white/10 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : search.trim() === '' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/50 text-sm">Start typing to search</p>
            <p className="text-xs text-white/30 mt-1">10,000+ exercises available</p>
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-12 h-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/50 text-sm">No exercises found</p>
            <p className="text-xs text-white/30 mt-1">Try different keywords</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {results.map((ex, i) => (
              <motion.button
                key={`${ex.id}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAdd(ex)}
                className="w-full bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-left"
              >
                <img
                  src={ex.gifUrl || FALLBACK_GIF}
                  alt={ex.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={e => e.target.src = FALLBACK_GIF}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-white truncate">{ex.name}</h4>
                  <p className="text-xs text-white/50 mt-0.5 truncate">
                    {ex.muscles} • {ex.equipment}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-emerald-500/20 flex-shrink-0">
                  <Plus className="w-4 h-4 text-emerald-400" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ExerciseItem = ({ ex, index, onRemove }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all"
    >
      <div className="p-3 flex items-center gap-3">
        <div
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded transition-colors"
        >
          <GripVertical className="w-5 h-5 text-white/30" />
        </div>

        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-400 font-bold text-sm">{index + 1}</span>
        </div>

        <img
          src={ex.gifUrl || FALLBACK_GIF}
          alt={ex.name}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          onError={e => e.target.src = FALLBACK_GIF}
        />

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-white truncate">{ex.name}</div>
          <div className="text-xs text-white/50 mt-0.5">
            {ex.sets || 4} sets × {ex.reps || 10} reps • {ex.rest || 90}s rest
          </div>
        </div>

        <button
          onClick={() => onRemove(index)}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0 group"
        >
          <Trash2 className="w-4 h-4 text-red-400/70 group-hover:text-red-400" />
        </button>
      </div>
    </Reorder.Item>
  );
};

const PlanExerciseList = ({ exercises, dayName, onReorder, onRemove }) => (
  <div className="flex-1 overflow-y-auto p-4 bg-black/20">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-emerald-400" />
        {dayName}
      </h3>
      <span className="text-sm text-white/50">
        {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
      </span>
    </div>

    <Reorder.Group axis="y" values={exercises} onReorder={onReorder} className="space-y-2">
      {exercises.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/50">No exercises added yet</p>
          <p className="text-sm text-white/30 mt-2">Search above to add exercises</p>
        </motion.div>
      ) : (
        exercises.map((ex, i) => (
          <ExerciseItem 
            key={`${ex.id || ex.exerciseId}-${i}`} 
            ex={ex} 
            index={i} 
            onRemove={onRemove} 
          />
        ))
      )}
    </Reorder.Group>
  </div>
);

export const CreatePlanModal = ({
  showCreatePlan,
  setShowCreatePlan,
  newPlanName,
  setNewPlanName,
  planDays,
  selectedDayIndex,
  setSelectedDayIndex,
  planSearch,
  setPlanSearch,
  planResults,
  planLoading,
  addToPlanDay,
  removeFromPlanDay,
  reorderPlanDay,
  saveNewPlan,
  editingPlanId
}) => {
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

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
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClose = () => {
    const hasChanges = newPlanName.trim() || planDays.some(d => d.exercises.length > 0);
    if (hasChanges) {
      setShowUnsavedWarning(true);
    } else {
      setShowCreatePlan(false);
    }
  };

  const confirmClose = () => {
    setShowUnsavedWarning(false);
    setShowCreatePlan(false);
  };

  if (!showCreatePlan) return null;

  const hasChanges = newPlanName.trim() || planDays.some(d => d.exercises.length > 0);
  const totalExercises = planDays.reduce((sum, d) => sum + d.exercises.length, 0);
  const currentDayData = planDays.find(d => d.day === DAYS_OF_WEEK[selectedDayIndex]) || { 
    day: DAYS_OF_WEEK[selectedDayIndex], 
    exercises: [] 
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-gray-900 via-emerald-950/20 to-gray-900 rounded-3xl w-full max-w-7xl h-[95vh] overflow-hidden border border-emerald-500/30 shadow-2xl flex flex-col m-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-5 bg-gradient-to-b from-emerald-950/40 to-transparent border-b border-emerald-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  {editingPlanId ? '✏️ Edit Plan' : '✨ Create New Plan'}
                </h2>
                {totalExercises > 0 && (
                  <p className="text-sm text-emerald-400">
                    {totalExercises} exercise{totalExercises !== 1 ? 's' : ''} added
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Plan name (e.g., Upper/Lower Split)"
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none text-white placeholder-white/40 font-medium"
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
            <PlanDaySelector
              days={planDays}
              selectedDayIndex={selectedDayIndex}
              onSelect={setSelectedDayIndex}
            />
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <SearchResults
                search={planSearch}
                setSearch={setPlanSearch}
                results={planResults}
                loading={planLoading}
                onAdd={(ex) => addToPlanDay(selectedDayIndex, ex)}
              />
              <PlanExerciseList
                exercises={currentDayData.exercises}
                dayName={DAYS_OF_WEEK[selectedDayIndex]}
                onReorder={(newOrder) => reorderPlanDay(selectedDayIndex, newOrder)}
                onRemove={(i) => removeFromPlanDay(selectedDayIndex, i)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-5 bg-gradient-to-t from-black/50 to-transparent border-t border-emerald-500/20">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={saveNewPlan}
                disabled={!newPlanName.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Save className="w-5 h-5" />
                {editingPlanId ? 'Update Plan' : 'Save Plan'}
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>

        {/* Unsaved Changes Warning */}
        <AnimatePresence>
          {showUnsavedWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-10"
              onClick={() => setShowUnsavedWarning(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-red-500/30"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Unsaved Changes</h3>
                    <p className="text-white/70 text-sm">
                      You have unsaved changes. Are you sure you want to leave? All progress will be lost.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={confirmClose}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-all"
                  >
                    Leave
                  </button>
                  <button
                    onClick={() => setShowUnsavedWarning(false)}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
                  >
                    Stay
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};