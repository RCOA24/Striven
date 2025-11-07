import { motion } from 'framer-motion';
import { Pause, SkipForward, TrendingUp, Trash2 } from 'lucide-react';
import { PRBadge } from '../ui/PRBadge';
import { TimerDisplay } from '../ui/TimerDisplay';
import { SetLogger } from '../ui/SetLogger';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';

export const WorkoutModeOverlay = ({
  isWorkoutStarted,
  todayExercises,
  currentExerciseIndex,
  secondsLeft,
  isResting,
  formatTime,
  nextExercise,
  setIsWorkoutStarted,
  exerciseHistory,
  openLogModal,
  clearPR
}) => {
  if (!isWorkoutStarted || todayExercises.length === 0) return null;

  const currentEx = todayExercises[currentExerciseIndex];
  const currentExId = currentEx.exerciseId || currentEx.id;
  const currentHistory = exerciseHistory[currentExId] || { logs: [], pr: 0 };
  const sortedLogs = [...currentHistory.logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col p-8"
    >
      <div className="max-w-6xl w-full mx-auto">
        <motion.div key={currentExerciseIndex} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6">
          <h1 className="text-6xl font-bold">{currentEx.name}</h1>
          <p className="text-4xl text-emerald-400 mt-2">
            {currentEx.sets} × {currentEx.reps}
          </p>
          <PRBadge pr={currentHistory.pr} />
        </motion.div>

        <div className="mb-8 rounded-3xl overflow-hidden bg-black/40 border-4 border-emerald-500/50">
          <img
            src={currentEx.gifUrl || FALLBACK_GIF}
            alt=""
            className="w-full aspect-video object-contain"
            onError={e => e.target.src = FALLBACK_GIF}
          />
        </div>

        <TimerDisplay seconds={secondsLeft} isResting={isResting} formatTime={formatTime} />

        <SetLogger exercise={currentEx} history={currentHistory} onLogSet={openLogModal} />

        {sortedLogs.length > 0 && (
          <div className="mt-8 bg-white/5 rounded-3xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-amber-400">Recent Logs</h4>
              <button onClick={() => clearPR(currentExId)} className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 text-sm">
                <Trash2 size={14} /> Clear PR
              </button>
            </div>
            <div className="space-y-3">
              {sortedLogs.slice(0, 5).map((log, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{log.date}</span>
                  <span className="font-bold">{log.weight}kg × {log.reps} <span className="text-amber-400">→ {log.oneRm}kg</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-8 mt-10">
          <button onClick={() => setIsWorkoutStarted(false)} className="p-8 bg-red-600 rounded-full hover:bg-red-500">
            <Pause className="w-12 h-12" />
          </button>
          <button onClick={nextExercise} className="p-8 bg-emerald-500 rounded-full hover:bg-emerald-400">
            <SkipForward className="w-12 h-12" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};