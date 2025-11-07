import { motion } from 'framer-motion';
import { Reorder } from 'framer-motion';
import { Search, Loader2, GripVertical, X } from 'lucide-react';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';

const PlanDayList = ({ days, selectedDayIndex, onSelect }) => (
  <div className="w-full lg:w-60 bg-white/5 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto">
    {days.map((day, i) => (
      <button
        key={i}
        onClick={() => onSelect(i)}
        className={`w-full text-left p-5 border-b border-white/10 transition-all ${
          selectedDayIndex === i ? 'bg-emerald-500 text-black font-bold' : 'hover:bg-white/10'
        }`}
      >
        <div className="font-bold">{day.day}</div>
        <div className="text-sm opacity-80">{day.exercises.length} exercises</div>
      </button>
    ))}
  </div>
);

const PlanSearchResults = ({ search, setSearch, results, loading, onAdd }) => (
  <div className="p-5 border-b border-white/10">
    <div className="relative">
      <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/60" />
      <input
        type="text"
        placeholder="Search exercises..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20"
      />
    </div>
    {loading ? (
      <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-emerald-400 animate-spin" /></div>
    ) : results.length === 0 ? (
      <p className="text-center text-white/60 py-20">Type to search exercises</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-h-96 overflow-y-auto">
        {results.map(ex => (
          <motion.div
            key={ex.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => onAdd(ex)}
            className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/10 hover:border-emerald-500/50 cursor-pointer"
          >
            <img src={ex.gifUrl || FALLBACK_GIF} alt={ex.name} className="w-20 h-20 rounded-xl object-cover" onError={e => e.target.src = FALLBACK_GIF} />
            <div>
              <h4 className="font-bold">{ex.name}</h4>
              <p className="text-sm text-white/60">{ex.muscles} • {ex.equipment}</p>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

const PlanExerciseList = ({ exercises, onReorder, onRemove }) => (
  <div className="flex-1 p-5 overflow-y-auto bg-black/20">
    <Reorder.Group values={exercises} onReorder={onReorder}>
      {exercises.length === 0 ? (
        <p className="text-white/50 text-center py-20">Search and add exercises</p>
      ) : (
        exercises.map((ex, i) => (
          <Reorder.Item key={ex.id || ex.exerciseId} value={ex}>
            <motion.div layout className="bg-white/10 rounded-xl p-4 mb-3 flex items-center gap-3">
              <GripVertical className="text-white/30 cursor-grab" />
              <span className="text-emerald-400 font-bold w-8">{i + 1}</span>
              <img src={ex.gifUrl || FALLBACK_GIF} alt="" className="w-16 h-16 rounded-lg object-cover" onError={e => e.target.src = FALLBACK_GIF} />
              <div className="flex-1 text-sm">
                <div className="font-bold">{ex.name}</div>
                <div className="text-white/60">{ex.sets || 4}×{ex.reps || 10} • Rest {ex.rest || 90}s</div>
              </div>
              <button onClick={() => onRemove(i)} className="text-red-400">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </Reorder.Item>
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
  if (!showCreatePlan) return null;

  return (
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
          <h2 className="text-2xl font-bold mb-4">{editingPlanId ? 'Edit Plan' : 'Create New Plan'}</h2>
          <input
            type="text"
            placeholder="Plan Name (e.g. Push Pull Legs)"
            value={newPlanName}
            onChange={e => setNewPlanName(e.target.value)}
            className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20"
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <PlanDayList days={planDays} selectedDayIndex={selectedDayIndex} onSelect={setSelectedDayIndex} />
          <div className="flex-1 flex flex-col">
            <PlanSearchResults search={planSearch} setSearch={setPlanSearch} results={planResults} loading={planLoading} onAdd={addToPlanDay} />
            <PlanExerciseList
              exercises={planDays[selectedDayIndex].exercises}
              onReorder={(newOrder) => reorderPlanDay(selectedDayIndex, newOrder)}
              onRemove={(i) => removeFromPlanDay(selectedDayIndex, i)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row gap-4">
          <button onClick={saveNewPlan} className="flex-1 bg-emerald-500 hover:bg-emerald-400 py-4 rounded-xl font-bold text-lg">
            {editingPlanId ? 'Update Plan' : 'Save Plan'}
          </button>
          <button onClick={() => setShowCreatePlan(false)} className="px-8 py-4 bg-white/10 rounded-xl">
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};