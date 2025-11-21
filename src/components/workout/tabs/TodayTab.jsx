import { Reorder, motion } from 'framer-motion';
import { Play, Plus, Trash2, Dumbbell, Clock, Flame, Target, GripVertical, CheckCircle2 } from 'lucide-react';
import { DraggableExerciseItem } from '../ui/DraggableExerciseItem'; // Ensure this matches your file export type
import { useRef, memo, useCallback } from 'react';

// --- Memoized Sub-Components (Keep these memoized for internal performance) ---

const WorkoutStats = memo(({ exercises }) => {
  const totalExercises = exercises.length;
  const estimatedTime = totalExercises * 3; // 3 min per exercise
  const estimatedCalories = totalExercises * 15; // rough estimate

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 w-full">
      <StatCard 
        icon={Target} 
        label="Exercises" 
        value={totalExercises} 
        colorClass="emerald" 
      />
      <StatCard 
        icon={Clock} 
        label="Duration" 
        value={estimatedTime} 
        suffix="m"
        colorClass="blue" 
        delay={0.1}
      />
      <StatCard 
        icon={Flame} 
        label="Est. Calories" 
        value={estimatedCalories} 
        colorClass="orange" 
        delay={0.2}
      />
    </div>
  );
});

// Simple component, no need for heavy memoization unless props change often
const StatCard = ({ icon: Icon, label, value, suffix, colorClass, delay = 0 }) => {
  const colors = {
    emerald: { bg: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30", iconBg: "bg-emerald-500/30", text: "text-emerald-400" },
    blue: { bg: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30", iconBg: "bg-blue-500/30", text: "text-blue-400" },
    orange: { bg: "from-orange-500/20 to-red-500/20", border: "border-orange-500/30", iconBg: "bg-orange-500/30", text: "text-orange-400" }
  };
  
  const theme = colors[colorClass];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`min-w-0 bg-gradient-to-br ${theme.bg} backdrop-blur-xl rounded-2xl p-3 sm:p-4 border ${theme.border} transform-gpu`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${theme.iconBg} rounded-xl`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${theme.text}`} />
        </div>
        <div className="min-w-0">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-white text-xl sm:text-2xl font-bold leading-tight truncate">
            {value}
            {suffix && <span className="text-xs sm:text-sm text-white/60 ml-0.5 font-medium">{suffix}</span>}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = memo(({ onBrowse }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-16 sm:py-24 px-4"
  >
    <motion.div
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="relative w-32 h-32 mx-auto mb-8 transform-gpu"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-2xl" />
      <div className="relative bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full w-full h-full flex items-center justify-center border border-emerald-500/30 shadow-2xl">
        <Dumbbell className="w-14 h-14 text-emerald-400 drop-shadow-lg" />
      </div>
    </motion.div>
    
    <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Ready to Crush It?</h3>
    <p className="text-white/60 text-lg mb-10 max-w-md mx-auto leading-relaxed">
      Your workout is empty. Build your perfect routine by adding exercises from our extensive library.
    </p>
    
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onBrowse}
      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all inline-flex items-center gap-3"
    >
      <Plus className="w-6 h-6 stroke-[3]" />
      Browse Exercise Library
    </motion.button>

    <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
      {[
        { icon: Target, text: "Track Progress", color: "emerald" },
        { icon: Flame, text: "Burn Calories", color: "orange" },
        { icon: CheckCircle2, text: "Stay Consistent", color: "blue" }
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className="bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 transition-colors"
        >
          <item.icon className={`w-8 h-8 text-${item.color}-400 mx-auto mb-3`} strokeWidth={1.5} />
          <p className="text-white/80 text-sm font-semibold">{item.text}</p>
        </motion.div>
      ))}
    </div>
  </motion.div>
));

// --- Main Component (REMOVED 'memo' WRAPPER HERE) ---
// Why? Because WorkoutOrganizer is likely doing: const MemoizedTodayTab = memo(TodayTab)
// Wrapping it twice triggers "Component is not a function".

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
  const orderRef = useRef(todayExercises);

  // Memoize handlers to prevent re-renders in child components
  const handleReorder = useCallback((newOrder) => {
    // Immediate UI update
    setTodayExercises(newOrder);
    orderRef.current = newOrder;
  }, [setTodayExercises]);

  const handleDragEnd = useCallback(() => {
    // Database update only on drop
    const ids = (orderRef.current || []).map(e => e.id);
    if (ids.length > 0) {
      reorderTodayWorkout(ids);
    }
  }, [reorderTodayWorkout]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-950/80 via-teal-950/50 to-black/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              Today's <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Workout</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              {hasExercises 
                ? `${todayExercises.length} exercise${todayExercises.length !== 1 ? 's' : ''} planned for today` 
                : 'Start building your routine'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {hasExercises && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startWorkout}
                  className="flex-1 lg:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentPage('exercises')}
                  className="flex-1 lg:flex-none bg-white/10 hover:bg-white/15 text-white border border-white/10 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  Add
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearTodayWorkout}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-3.5 rounded-xl transition-all group"
                  title="Clear all"
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
        <div className="space-y-4 relative">
          {/* Drag Instruction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-white/40 text-xs font-medium uppercase tracking-widest mb-4"
          >
            <GripVertical className="w-3 h-3" />
            <span>Drag items to reorder</span>
          </motion.div>

          <Reorder.Group 
            values={todayExercises}
            axis="y"
            onReorder={handleReorder}
            className="space-y-3"
          >
            {todayExercises.map((ex, i) => (
              <DraggableExerciseItem
                key={ex.id || ex.exerciseId}
                exercise={ex}
                index={i}
                onRemove={removeFromToday}
                onDragEnd={handleDragEnd}
              />
            ))}
          </Reorder.Group>

          {/* Sticky Bottom Action Bar */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="sticky bottom-6 z-50"
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-4 border border-emerald-500/30 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2 bg-emerald-500/20 rounded-xl shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold leading-tight">Ready to go!</p>
                  <p className="text-zinc-400 text-sm">{todayExercises.length} exercises queued</p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startWorkout}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
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