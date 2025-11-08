// src/components/workout/WorkoutModeOverlay.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pause, SkipForward, TrendingUp, Trash2, X, AlertTriangle, 
  Play, Timer, Zap, Award, Calendar, Target, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PRBadge } from '../ui/PRBadge';
import { TimerDisplay } from '../ui/TimerDisplay';
import SetLogger from '../ui/SetLogger';
import { clearExercisePR } from '../../../utils/db';

const FALLBACK_GIF = 'https://via.placeholder.com/600x400/111/fff?text=No+GIF';

// Animated Progress Ring
const ProgressRing = ({ progress, total }) => {
  const percentage = (progress / total) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="56"
          cy="56"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-white/10"
        />
        {/* Progress circle */}
        <motion.circle
          cx="56"
          cy="56"
          r="45"
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{progress}</span>
        <span className="text-xs text-white/60 font-semibold">of {total}</span>
      </div>
    </div>
  );
};

// Exercise Stats Card
const StatCard = ({ icon: Icon, label, value, color = "emerald" }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`bg-gradient-to-br from-${color}-500/20 to-${color}-600/10 backdrop-blur-xl rounded-2xl p-4 border border-${color}-500/30`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 bg-${color}-500/30 rounded-xl`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <div>
        <p className="text-white/60 text-xs font-medium">{label}</p>
        <p className="text-white text-lg font-bold">{value}</p>
      </div>
    </div>
  </motion.div>
);

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
  refreshHistory
}) => {
  const containerRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Safe access to current exercise
  const currentEx = todayExercises?.[currentExerciseIndex];
  
  // FIX: Try both ID formats and find which one has data
  let currentExId = currentEx?.exerciseId || currentEx?.id;
  let currentHistory = exerciseHistory?.[currentExId];

  // If no history found, try the alternate ID format
  if (!currentHistory || !currentHistory.logs) {
    const alternateId = currentEx?.id || currentEx?.exerciseId;
    if (alternateId !== currentExId && exerciseHistory?.[alternateId]) {
      currentExId = alternateId;
      currentHistory = exerciseHistory[alternateId];
    }
  }

  // Provide safe defaults if still no history
  if (!currentHistory || !currentHistory.logs) {
    currentHistory = { logs: [], pr: 0 };
  }
    
  // FIX: PR can be stored as string or number - parse it safely
  const safePR = (() => {
    const pr = currentHistory.pr;
    if (pr === null || pr === undefined || pr === '') return 0;
    const parsed = typeof pr === 'string' ? parseFloat(pr) : pr;
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  })();
    
  const sortedLogs = Array.isArray(currentHistory.logs) 
    ? [...currentHistory.logs].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  console.log('🔍 WorkoutModeOverlay Debug:', {
    currentExerciseIndex,
    currentEx: currentEx?.name,
    currentExId,
    exerciseHistoryKeys: Object.keys(exerciseHistory || {}),
    currentHistory,
    safePR,
    sortedLogs: sortedLogs.length
  });

  // Auto-scroll to top on exercise change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentExerciseIndex]);

  // CLEAR PR with beautiful confirmation
  const handleClearPR = async () => {
    if (!currentExId) {
      toast.error('No exercise selected');
      setShowClearConfirm(false);
      return;
    }
    
    try {
      await clearExercisePR(currentExId);
      
      if (typeof refreshHistory === 'function') {
        await refreshHistory();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast.success('All logs cleared!', {
        icon: '🗑️',
        style: {
          background: 'linear-gradient(to right, #10b981, #34d399)',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
        },
      });
      
      setShowClearConfirm(false);
      
    } catch (error) {
      console.error('❌ Error in handleClearPR:', error);
      toast.error(`Failed to clear PR: ${error.message}`, {
        style: {
          background: 'linear-gradient(to right, #ef4444, #f87171)',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '16px',
        },
      });
      setShowClearConfirm(false);
    }
  };

  if (!isWorkoutStarted || !currentEx) return null;

  return (
    <AnimatePresence>
      {isWorkoutStarted && (
        <>
          {/* Solid Backdrop with Animated Particles Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-slate-950"
          >
            {/* Animated gradient orbs - decorative only */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-teal-500/20 rounded-full blur-3xl"
              />
            </div>
          </motion.div>

          {/* Scrollable Container */}
          <motion.div
            ref={containerRef}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto"
          >
            {/* Top Navigation Bar - Solid Background */}
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              className="sticky top-0 z-50 bg-slate-950 backdrop-blur-2xl border-b border-white/10"
            >
              <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ProgressRing 
                    progress={currentExerciseIndex + 1} 
                    total={todayExercises.length} 
                  />
                  <div>
                    <p className="text-white/60 text-sm font-medium">Workout Session</p>
                    <p className="text-white text-xl font-bold">Exercise {currentExerciseIndex + 1}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsWorkoutStarted(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all hover:scale-110 group"
                >
                  <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </motion.div>

            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="max-w-5xl mx-auto">

                {/* Exercise Header Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl mb-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <motion.h1
                        key={currentEx.name}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-3xl sm:text-5xl font-black text-white leading-tight mb-3"
                      >
                        {currentEx.name}
                      </motion.h1>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-400 font-bold text-lg">
                          {currentEx.sets} sets
                        </span>
                        <X className="w-4 h-4 text-white/40" />
                        <span className="px-4 py-2 bg-teal-500/20 rounded-full text-teal-400 font-bold text-lg">
                          {currentEx.reps} reps
                        </span>
                      </div>
                    </div>
                    <PRBadge pr={safePR} size="lg" />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard 
                      icon={Target} 
                      label="Target" 
                      value={currentEx.muscles || "Full Body"} 
                      color="emerald"
                    />
                    <StatCard 
                      icon={Award} 
                      label="Best" 
                      value={safePR > 0 ? `${safePR.toFixed(1)}kg` : "No PR"} 
                      color="amber"
                    />
                    <StatCard 
                      icon={Calendar} 
                      label="Sessions" 
                      value={sortedLogs.length} 
                      color="blue"
                    />
                  </div>
                </motion.div>

                {/* Exercise GIF Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative mb-6 rounded-3xl overflow-hidden shadow-2xl"
                >
                  {/* Glowing border effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-50 blur-xl" />
                  <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-emerald-500/30">
                    <img
                      src={currentEx.gifUrl || FALLBACK_GIF}
                      alt={currentEx.name}
                      className="w-full aspect-video object-contain"
                      onError={e => e.target.src = FALLBACK_GIF}
                    />
                    {/* Corner accents */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-emerald-400 rounded-tl-2xl" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-teal-400 rounded-br-2xl" />
                  </div>
                </motion.div>

                {/* Timer Display */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <TimerDisplay seconds={secondsLeft} isResting={isResting} formatTime={formatTime} />
                </motion.div>

                {/* Set Logger */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <SetLogger
                    exercise={currentEx}
                    sets={currentEx.sets || 4}
                    history={currentHistory}
                    onLogSet={(_, setIndex) => {
                      // FIX: Use the already-resolved currentExId
                      console.log('🔍 Opening log modal:', { currentExId, setIndex, currentEx });
                      openLogModal(currentExId, setIndex);
                    }}
                  />
                </motion.div>

                {/* Recent Performance Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-white">Performance History</h4>
                        <p className="text-white/60 text-sm">Track your progress over time</p>
                      </div>
                    </div>
                    {sortedLogs.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowClearConfirm(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-400 px-4 py-3 rounded-xl font-bold text-sm border border-red-500/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </motion.button>
                    )}
                  </div>
                  
                  {sortedLogs.length > 0 ? (
                    <div className="space-y-3">
                      {sortedLogs.slice(0, 5).map((log, i) => (
                        <motion.div
                          key={i}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="group bg-gradient-to-r from-white/5 to-white/10 hover:from-emerald-500/10 hover:to-teal-500/10 rounded-2xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-white/40" />
                                <span className="text-white/80 text-sm font-medium">
                                  {new Date(log.date).toLocaleDateString()}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/20" />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-black text-white text-lg">
                                  {log.weight}kg × {log.reps}
                                </p>
                                <p className="text-amber-400 text-sm font-bold">
                                  1RM: {log.oneRm.toFixed(1)}kg
                                </p>
                              </div>
                              {log.oneRm === safePR && safePR > 0 && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="p-2 bg-amber-500/20 rounded-lg"
                                >
                                  <Award className="w-5 h-5 text-amber-400" />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-10 h-10 text-emerald-400" />
                      </div>
                      <p className="text-white/60 text-lg font-semibold">No logs yet</p>
                      <p className="text-white/40 text-sm mt-2">Start logging to track your progress!</p>
                    </motion.div>
                  )}
                </motion.div>

                {/* Control Buttons */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center items-center gap-6 mt-10 mb-6"
                >
                  {/* Pause/Resume Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsPaused(!isPaused)}
                    className="relative p-6 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full shadow-2xl border-2 border-white/20 group overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <Pause className="w-10 h-10 text-white relative z-10" />
                  </motion.button>

                  {/* Next Exercise Button - Large & Prominent */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={nextExercise}
                    className="relative p-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-2xl shadow-emerald-500/50 group overflow-hidden"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-white rounded-full"
                    />
                    <SkipForward className="w-14 h-14 text-white relative z-10 drop-shadow-lg" />
                  </motion.button>

                  {/* Exit Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsWorkoutStarted(false)}
                    className="p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-2xl shadow-red-500/30 border-2 border-red-400/20 group overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <X className="w-10 h-10 text-white relative z-10" />
                  </motion.button>
                </motion.div>

                {/* Progress Bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="mb-8"
                >
                  <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-xl">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentExerciseIndex + 1) / todayExercises.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-500/50"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-white/60 text-sm font-medium">
                      {currentExerciseIndex + 1} of {todayExercises.length} exercises
                    </p>
                    <p className="text-emerald-400 text-sm font-bold">
                      {Math.round(((currentExerciseIndex + 1) / todayExercises.length) * 100)}% Complete
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Clear PR Confirmation Modal */}
          <AnimatePresence>
            {showClearConfirm && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl"
                  onClick={() => setShowClearConfirm(false)}
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
                >
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border-2 border-red-500/30 shadow-2xl shadow-red-500/20">
                    {/* Animated Warning Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="flex justify-center mb-6"
                    >
                      <motion.div
                        animate={{
                          rotate: [0, -10, 10, -10, 0],
                        }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full" />
                        <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-full shadow-lg">
                          <AlertTriangle className="w-12 h-12 text-white" />
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-3xl font-black text-white text-center mb-2">
                      Clear All History?
                    </h3>
                    <p className="text-white/60 text-center text-sm mb-6">
                      This action is permanent and cannot be undone
                    </p>

                    {/* Exercise Info */}
                    <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-red-500/30 mb-6">
                      <p className="text-white font-bold text-xl text-center mb-3">
                        {currentEx.name}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <p className="text-white/60 text-xs mb-1">Current PR</p>
                          <p className="text-amber-400 font-black text-lg">
                            {safePR > 0 ? `${safePR.toFixed(1)}kg` : "None"}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <p className="text-white/60 text-xs mb-1">Total Logs</p>
                          <p className="text-white font-black text-lg">{sortedLogs.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Warning Message */}
                    <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-semibold mb-8 bg-red-500/10 rounded-xl p-3">
                      <Zap className="w-4 h-4" />
                      <span>All performance data will be deleted</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-lg transition-all border border-white/20"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClearPR}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-red-500/30"
                      >
                        Delete All
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};