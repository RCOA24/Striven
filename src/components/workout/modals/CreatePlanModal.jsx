// src/components/plans/CreatePlanModal.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder, useDragControls } from 'framer-motion';
import { Search, Loader2, GripVertical, X, Plus, Save, AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PlanDayList = ({ days, selectedDayIndex, onSelect }) => (
  <div className="w-full bg-black/40 border-b border-white/10 sticky top-0 z-10 lg:border-b-0 lg:border-r lg:w-64">
    <div className="p-4 bg-gradient-to-b from-emerald-900/30 to-transparent">
      <h3 className="font-bold text-emerald-400 flex items-center gap-2">
        <Calendar className="w-5 h-5" /> Days
      </h3>
    </div>
    <div className="max-h-48 lg:max-h-full overflow-y-auto text-white">
      {DAYS_OF_WEEK.map((dayName, i) => {
        const dayData = days.find(d => d.day === dayName) || { day: dayName, exercises: [] };
        return (
          <motion.button
            key={dayName}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(i)}
            className={`w-full text-left p-4 transition-all border-b border-white/5 ${
              selectedDayIndex === i
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500/50'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">{dayName}</span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                {dayData.exercises.length}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  </div>
);

const SearchResults = ({ search, setSearch, results, loading, onAdd }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input when search is cleared or when component mounts
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="p-5 border-b border-white/10 sticky top-0 bg-black/60 backdrop-blur-lg z-10">
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/60" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search 10,000+ exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/10 border border-white/20 focus:border-emerald-500/70 focus:ring-4 focus:ring-emerald-500/30 transition-all outline-none text-white placeholder-white/50"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-3.5 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mt-5 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : search.trim() === '' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Search className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="text-white/60">Start typing to search exercises</p>
            <p className="text-sm text-white/40 mt-2">Try "bench press", "pull up", or "squat"</p>
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Search className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="text-white/60">No exercises found</p>
            <p className="text-sm text-white/40 mt-2">Try different keywords</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {results.map((ex, i) => (
              <motion.div
                key={`${ex.id}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAdd(ex)}
                className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/10 hover:border-emerald-500/60 cursor-pointer transition-all"
              >
                <img
                  src={ex.gifUrl || FALLBACK_GIF}
                  alt={ex.name}
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                  onError={e => e.target.src = FALLBACK_GIF}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm line-clamp-2 text-white">{ex.name}</h4>
                  <p className="text-xs text-white/60 mt-1">
                    {ex.muscles} • {ex.equipment}
                  </p>
                </div>
                <Plus className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              </motion.div>
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
      className="bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-4 mb-3 flex items-center gap-4 border border-white/10"
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-6 h-6 text-white/40 hover:text-emerald-400 transition-colors" />
      </div>

      <span className="text-emerald-400 font-bold text-lg w-10 text-center">
        {index + 1}
      </span>

      <img
        src={ex.gifUrl || FALLBACK_GIF}
        alt={ex.name}
        className="w-14 h-14 rounded-lg object-cover shadow-md"
        onError={e => e.target.src = FALLBACK_GIF}
      />

      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-white truncate">{ex.name}</div>
        <div className="text-xs text-white/60">
          {ex.sets || 4}×{ex.reps || 10} • Rest {ex.rest || 90}s
        </div>
      </div>

      <button
        onClick={() => onRemove(index)}
        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-5 h-5 text-red-400" />
      </button>
    </Reorder.Item>
  );
};

const PlanExerciseList = ({ exercises, onReorder, onRemove }) => (
  <div className="flex-1 p-5 overflow-y-auto bg-black/30">
    <Reorder.Group axis="y" values={exercises} onReorder={onReorder}>
      {exercises.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Dumbbell className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <p className="text-white/50 text-lg">No exercises yet</p>
          <p className="text-sm text-white/40 mt-2">Search above to add exercises</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <ExerciseItem 
              key={`${ex.id || ex.exerciseId}-${i}`} 
              ex={ex} 
              index={i} 
              onRemove={onRemove} 
            />
          ))}
        </div>
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
      if (confirm('Leave without saving? All changes will be lost.')) {
        setShowCreatePlan(false);
      }
    } else {
      setShowCreatePlan(false);
    }
  };

  if (!showCreatePlan) return null;

  const hasChanges = newPlanName.trim() || planDays.some(d => d.exercises.length > 0);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="bg-gradient-to-br from-gray-900 via-emerald-950/30 to-black rounded-3xl w-full max-w-7xl max-h-[95vh] overflow-hidden border-2 border-emerald-500/40 shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-b border-emerald-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {editingPlanId ? 'Edit Plan' : 'Create New Plan'}
              </h2>
              <button
                onClick={handleClose}
                className="p-3 hover:bg-white/10 rounded-full transition-all hover:scale-110"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="e.g. 5-Day Push/Pull/Legs Split"
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white/10 border-2 border-white/20 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30 transition-all outline-none text-lg font-medium text-white placeholder-white/50"
            />
          </div>

          {/* Body - Responsive Grid */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            <PlanDayList
              days={planDays}
              selectedDayIndex={selectedDayIndex}
              onSelect={setSelectedDayIndex}
            />
            <div className="flex-1 flex flex-col min-h-0">
              <SearchResults
                search={planSearch}
                setSearch={setPlanSearch}
                results={planResults}
                loading={planLoading}
                onAdd={(ex) => {
                  addToPlanDay(selectedDayIndex, ex);
                }}
              />
              <PlanExerciseList
                exercises={currentDayData.exercises}
                onReorder={(newOrder) => reorderPlanDay(selectedDayIndex, newOrder)}
                onRemove={(i) => removeFromPlanDay(selectedDayIndex, i)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-black/50 border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={saveNewPlan}
                disabled={!newPlanName.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed py-5 rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <Save className="w-6 h-6" />
                {editingPlanId ? 'Update Plan' : 'Save Plan'}
              </button>
              <button
                onClick={handleClose}
                className="px-8 py-5 bg-white/10 hover:bg-white/20 rounded-2xl font-medium transition-all"
              >
                Cancel
              </button>
            </div>
            {hasChanges && (
              <p className="text-center text-emerald-400 text-sm mt-3 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Add missing icons
const Calendar = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Dumbbell = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15h18M3 9h18m-2-6l-3 3m0 0l-3-3m3 3v12m0 0l3 3m-3-3l-3 3" />
  </svg>
);