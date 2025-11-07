import { Reorder } from 'framer-motion';
import { Play, Plus, Trash2, Dumbbell } from 'lucide-react';
import { DraggableExerciseItem } from '../ui/DraggableExerciseItem';

export const TodayTab = ({
  todayExercises,
  setTodayExercises,
  startWorkout,
  clearTodayWorkout,
  reorderTodayWorkout,
  removeFromToday,
  setCurrentPage
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h2 className="text-3xl font-bold">Today’s Workout</h2>
        <div className="flex gap-2">
          <button onClick={startWorkout} className="bg-emerald-500 hover:bg-emerald-400 px-5 py-3 rounded-xl font-bold flex items-center gap-2">
            <Play className="w-5 h-5" /> Start
          </button>
          <button onClick={() => setCurrentPage('exercises')} className="bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add
          </button>
          <button onClick={clearTodayWorkout} className="text-red-400 hover:text-red-300 p-3">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Reorder.Group values={todayExercises} onReorder={(newOrder) => {
        setTodayExercises(newOrder);
        reorderTodayWorkout(newOrder.map(e => e.id || e.exerciseId));
      }}>
        {todayExercises.length === 0 ? (
          <div className="text-center py-20">
            <Dumbbell className="w-20 h-20 text-white/20 mx-auto mb-6" />
            <p className="text-2xl text-white/60 mb-6">No exercises yet</p>
            <button onClick={() => setCurrentPage('exercises')} className="bg-emerald-500 px-8 py-4 rounded-xl font-bold">
              Browse Library
            </button>
          </div>
        ) : (
          todayExercises.map((ex, i) => (
            <DraggableExerciseItem
              key={ex.id || ex.exerciseId}
              exercise={ex}
              index={i}
              onRemove={removeFromToday}
            />
          ))
        )}
      </Reorder.Group>
    </div>
  );
};