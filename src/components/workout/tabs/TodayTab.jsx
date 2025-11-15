import { Reorder, motion } from 'framer-motion';
import { Play, Plus, Trash2, Dumbbell, Clock, Flame, Target, GripVertical, X, CheckCircle2 } from 'lucide-react';
import { DraggableExerciseItem } from '../ui/DraggableExerciseItem';
import { useRef } from 'react';

const WorkoutStats = ({ exercises }) => {
  const totalExercises = exercises.length;
  const estimatedTime = totalExercises * 3; // 3 min per exercise
  const estimatedCalories = totalExercises * 15; // rough estimate

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="min-w-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-emerald-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/30 rounded-xl">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white/60 text-xs font-medium">Exercises</p>
            <p className="text-white text-xl sm:text-2xl font-bold leading-tight truncate">{totalExercises}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="min-w-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-blue-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/30 rounded-xl">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white/60 text-xs font-medium">Duration</p>
            <p className="text-white text-xl sm:text-2xl font-bold leading-tight">
              {estimatedTime}
              <span className="text-xs sm:text-sm text-white/60 ml-0.5">m</span>
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="min-w-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-orange-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/30 rounded-xl">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white/60 text-xs font-medium">Est. Calories</p>
            <p className="text-white text-xl sm:text-2xl font-bold leading-tight truncate">{estimatedCalories}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const EmptyState = ({ onBrowse }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-16"
  >
    <motion.div
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="relative w-32 h-32 mx-auto mb-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-xl" />
      <div className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full w-full h-full flex items-center justify-center border border-emerald-500/30">
        <Dumbbell className="w-16 h-16 text-emerald-400" />
      </div>
    </motion.div>
    
    <h3 className="text-3xl font-bold text-white mb-3">Ready to Crush It?</h3>
    <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
      Build your perfect workout by adding exercises from our extensive library
    </p>
    
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onBrowse}
      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all inline-flex items-center gap-3"
    >
      <Plus className="w-6 h-6" />
      Browse Exercise Library
    </motion.button>

    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
      {[
        { icon: Target, text: "Track Progress", color: "emerald" },
        { icon: Flame, text: "Burn Calories", color: "orange" },
        { icon: CheckCircle2, text: "Stay Consistent", color: "blue" }
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10"
        >
          <item.icon className={`w-8 h-8 text-${item.color}-400 mx-auto mb-2`} />
          <p className="text-white/70 text-sm font-medium">{item.text}</p>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export const TodayTab = ({
  todayExercises,
  setTodayExercises,
  startWorkout,
  clearTodayWorkout,
  reorderTodayWorkout,
  removeFromToday,
  setCurrentPage
}) => {
  const hasExercises = todayExercises && todayExercises.length > 0;

  // Track latest order to persist on drag end
  const orderRef = useRef(todayExercises);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-transparent backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/20 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Today's Workout
            </h2>
            <p className="text-white/60">
              {hasExercises 
                ? `${todayExercises.length} exercise${todayExercises.length !== 1 ? 's' : ''} planned` 
                : 'Build your perfect routine'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {hasExercises && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startWorkout}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Workout
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage('exercises')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add More
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={clearTodayWorkout}
                  className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/30 p-3 rounded-xl transition-all group"
                  title="Clear all exercises"
                >
                  <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {hasExercises && <WorkoutStats exercises={todayExercises} />}
      </motion.div>

      {/* Exercise List */}
      {!hasExercises ? (
        <EmptyState onBrowse={() => setCurrentPage('exercises')} />
      ) : (
        <div className="space-y-4">
          {/* Drag Instruction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-white/50 text-sm bg-white/5 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10"
          >
            <GripVertical className="w-4 h-4" />
            <span>Drag to reorder exercises</span>
          </motion.div>

          <Reorder.Group 
            values={todayExercises}
            axis="y"
            onReorder={(newOrder) => {
              orderRef.current = newOrder;
              setTodayExercises(newOrder);
              // NOTE: persist only on drag end to prevent jitter
            }}
            className="space-y-3"
          >
            {todayExercises.map((ex, i) => (
              <DraggableExerciseItem
                key={ex.id || ex.exerciseId}
                exercise={ex}
                index={i}
                onRemove={removeFromToday}
                onDragEnd={() => {
                  const ids = (orderRef.current || []).map(e => e.id);
                  if (ids.length) reorderTodayWorkout(ids);
                }}
              />
            ))}
          </Reorder.Group>

          {/* Bottom Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sticky bottom-6 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 backdrop-blur-2xl rounded-2xl p-4 border border-emerald-500/30 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Ready to go!</p>
                  <p className="text-white/60 text-sm">{todayExercises.length} exercises queued</p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startWorkout}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                Begin Workout
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};