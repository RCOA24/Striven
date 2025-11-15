// src/components/workout/WorkoutModeOverlay.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pause, SkipForward, TrendingUp, Trash2, X, AlertTriangle, 
  Play, Timer, Zap, Award, Calendar, Target, ChevronRight, ImageOff
} from 'lucide-react';
import { PRBadge } from '../ui/PRBadge';
import { TimerDisplay } from '../ui/TimerDisplay';
import SetLogger from '../ui/SetLogger';
import { clearExercisePR } from '../../../utils/db';

// Inline SVG Fallback (No external request, no spam)
const FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
  <rect width="600" height="400" fill="%23111111"/>
  <path d="M150 100 L450 100 L450 300 L150 300 Z" stroke="%23ffffff" stroke-width="4" fill="none"/>
  <circle cx="300" cy="200" r="60" stroke="%23ffffff" stroke-width="4" fill="none"/>
  <path d="M270 180 L270 220 M330 180 L330 220" stroke="%23ffffff" stroke-width="6" stroke-linecap="round"/>
  <text x="300" y="350" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="%23ffffff" text-anchor="middle">No GIF Available</text>
  <text x="300" y="380" font-family="system-ui, sans-serif" font-size="18" fill="%23666" text-anchor="middle">Exercise demo not found</text>
</svg>`;

// Animated Progress Ring
const ProgressRing = ({ progress, total }) => {
  const percentage = (progress / total) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
        <motion.circle
          cx="56" cy="56" r="45" stroke="url(#gradient)" strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={circumference}
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
  <motion.div whileHover={{ scale: 1.05 }} className={`bg-gradient-to-br from-${color}-500/20 to-${color}-600/10 backdrop-blur-xl rounded-2xl p-4 border border-${color}-500/30`}>
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

// Beautiful Skip Confirmation Modal
const SkipConfirmModal = ({ isOpen, onClose, onConfirm, current, next }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10002]"
          />
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 top-24 max-w-md mx-auto z-[10003]"
          >
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <SkipForward className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Skip to next exercise?</h2>
              </div>
              <div className="px-6 pb-4 text-white/80 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Current:</span> {current}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Next:</span> {next}
                </p>
              </div>
              <div className="flex gap-3 p-6 bg-white/5">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  Yes, Skip
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

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
  refreshHistory,
  showToast // NEW PROP
}) => {
  const containerRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentEx = todayExercises?.[currentExerciseIndex];
  let currentExId = currentEx?.exerciseId || currentEx?.id;
  let currentHistory = exerciseHistory?.[currentExId];

  if (!currentHistory || !currentHistory.logs) {
    const alternateId = currentEx?.id || currentEx?.exerciseId;
    if (alternateId !== currentExId && exerciseHistory?.[alternateId]) {
      currentExId = alternateId;
      currentHistory = exerciseHistory[alternateId];
    }
  }

  if (!currentHistory || !currentHistory.logs) {
    currentHistory = { logs: [], pr: 0 };
  }

  const safePR = (() => {
    const pr = currentHistory.pr;
    if (pr === null || pr === undefined || pr === '') return 0;
    const parsed = typeof pr === 'string' ? parseFloat(pr) : pr;
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  })();

  const sortedLogs = Array.isArray(currentHistory.logs) 
    ? [...currentHistory.logs].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  // Memoized safe GIF URL
  const gifSrc = useMemo(() => {
    const url = currentEx?.gifUrl;
    if (typeof url === 'string' && url.trim() !== '' && url.startsWith('http')) {
      return url;
    }
    return FALLBACK_SVG;
  }, [currentEx?.gifUrl]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentExerciseIndex]);

  const handleClearPR = async () => {
    if (!currentExId) {
      if (showToast) showToast('No exercise selected', 'error');
      setShowClearConfirm(false);
      return;
    }
    
    try {
      await clearExercisePR(currentExId);
      if (typeof refreshHistory === 'function') {
        await refreshHistory();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (showToast) {
        showToast('All logs cleared!', 'success', 'trash');
      }
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error in handleClearPR:', error);
      if (showToast) {
        showToast(`Failed to clear PR: ${error.message}`, 'error');
      }
      setShowClearConfirm(false);
    }
  };

  if (!isWorkoutStarted || !currentEx) return null;

  const nextExerciseName = todayExercises[currentExerciseIndex + 1]?.name || 'Workout Complete';

  return (
    <AnimatePresence>
      {isWorkoutStarted && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] bg-slate-950">
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-teal-500/20 rounded-full blur-3xl"
              />
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            ref={containerRef}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto"
          >
            {/* Top Bar */}
            <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className="sticky top-0 z-50 bg-slate-950 backdrop-blur-2xl border-b border-white/10">
              <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ProgressRing progress={currentExerciseIndex + 1} total={todayExercises.length} />
                  <div>
                    <p className="text-white/60 text-sm font-medium">Workout Session</p>
                    <p className="text-white text-xl font-bold">Exercise {currentExerciseIndex + 1}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSkipConfirm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-xl font-bold text-white shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
                  >
                    <SkipForward className="w-5 h-5" />
                    Next
                  </motion.button>
                  
                  <button
                    onClick={() => setIsWorkoutStarted(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all hover:scale-110 group"
                  >
                    <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="max-w-5xl mx-auto">
                {/* Exercise Header */}
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <motion.h1 key={currentEx.name} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-3xl sm:text-5xl font-black text-white leading-tight mb-3">
                        {currentEx.name}
                      </motion.h1>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-400 font-bold text-lg">{currentEx.sets} sets</span>
                        <X className="w-4 h-4 text-white/40" />
                        <span className="px-4 py-2 bg-teal-500/20 rounded-full text-teal-400 font-bold text-lg">{currentEx.reps} reps</span>
                      </div>
                    </div>
                    <PRBadge pr={safePR} size="lg" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard icon={Target} label="Target" value={currentEx.muscles || "Full Body"} color="emerald" />
                    <StatCard icon={Award} label="Best" value={safePR > 0 ? `${safePR.toFixed(1)}kg` : "No PR"} color="amber" />
                    <StatCard icon={Calendar} label="Sessions" value={sortedLogs.length} color="blue" />
                  </div>
                </motion.div>

                {/* GIF - Now Safe with Inline SVG Fallback */}
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-6 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-50 blur-xl" />
                  <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-emerald-500/30">
                    <img 
                      src={gifSrc} 
                      alt={currentEx.name} 
                      className="w-full aspect-video object-contain"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_SVG) {
                          e.currentTarget.src = FALLBACK_SVG;
                        }
                      }}
                    />
                    <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-emerald-400 rounded-tl-2xl" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-teal-400 rounded-br-2xl" />
                  </div>
                </motion.div>

                {/* Timer */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
                  <TimerDisplay seconds={secondsLeft} isResting={isResting} formatTime={formatTime} />
                </motion.div>

                {/* Set Logger */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
                  <SetLogger
                    exercise={currentEx}
                    sets={currentEx.sets || 4}
                    history={currentHistory}
                    onLogSet={(_, setIndex) => openLogModal(currentExId, setIndex)}
                  />
                </motion.div>

                {/* Performance History */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
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
                  {/* Logs */}
                  {sortedLogs.length > 0 ? (
                    <div className="space-y-3">
                      {sortedLogs.slice(0, 5).map((log, i) => (
                        <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} className="group bg-gradient-to-r from-white/5 to-white/10 hover:from-emerald-500/10 hover:to-teal-500/10 rounded-2xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-white/40" />
                                <span className="text-white/80 text-sm font-medium">{new Date(log.date).toLocaleDateString()}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/20" />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-black text-white text-lg">{log.weight}kg × {log.reps}</p>
                                <p className="text-amber-400 text-sm font-bold">1RM: {log.oneRm.toFixed(1)}kg</p>
                              </div>
                              {log.oneRm === safePR && safePR > 0 && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-2 bg-amber-500/20 rounded-lg">
                                  <Award className="w-5 h-5 text-amber-400" />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-10 h-10 text-emerald-400" />
                      </div>
                      <p className="text-white/60 text-lg font-semibold">No logs yet</p>
                      <p className="text-white/40 text-sm mt-2">Start logging to track your progress!</p>
                    </motion.div>
                  )}
                </motion.div>

                {/* Big Next Button */}
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center items-center gap-6 mt-10 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSkipConfirm(true)}
                    className="relative px-12 py-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-2xl shadow-emerald-500/50 group overflow-hidden"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-white rounded-2xl"
                    />
                    <div className="relative z-10 flex items-center gap-3">
                      <SkipForward className="w-8 h-8 text-white drop-shadow-lg" />
                      <span className="text-2xl font-black text-white">Next Exercise</span>
                    </div>
                  </motion.button>
                </motion.div>

                {/* Progress Bar */}
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="mb-8">
                  <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-xl">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentExerciseIndex + 1) / todayExercises.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-500/50"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-white/60 text-sm font-medium">{currentExerciseIndex + 1} of {todayExercises.length} exercises</p>
                    <p className="text-emerald-400 text-sm font-bold">{Math.round(((currentExerciseIndex + 1) / todayExercises.length) * 100)}% Complete</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Skip Confirmation Modal */}
          <SkipConfirmModal
            isOpen={showSkipConfirm}
            onClose={() => setShowSkipConfirm(false)}
            onConfirm={nextExercise}
            current={currentEx.name}
            next={nextExerciseName}
          />

          {/* Clear PR Modal */}
          <AnimatePresence>
            {showClearConfirm && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl" onClick={() => setShowClearConfirm(false)} />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
                >
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border-2 border-red-500/30 shadow-2xl shadow-red-500/20">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="flex justify-center mb-6">
                      <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.3 }} className="relative">
                        <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full" />
                        <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-full shadow-lg">
                          <AlertTriangle className="w-12 h-12 text-white" />
                        </div>
                      </motion.div>
                    </motion.div>
                    <h3 className="text-3xl font-black text-white text-center mb-2">Clear All History?</h3>
                    <p className="text-white/60 text-center text-sm mb-6">This action is permanent and cannot be undone</p>
                    <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-red-500/30 mb-6">
                      <p className="text-white font-bold text-xl text-center mb-3">{currentEx.name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <p className="text-white/60 text-xs mb-1">Current PR</p>
                          <p className="text-amber-400 font-black text-lg">{safePR > 0 ? `${safePR.toFixed(1)}kg` : "None"}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <p className="text-white/60 text-xs mb-1">Total Logs</p>
                          <p className="text-white font-black text-lg">{sortedLogs.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-semibold mb-8 bg-red-500/10 rounded-xl p-3">
                      <Zap className="w-4 h-4" />
                      <span>All performance data will be deleted</span>
                    </div>
                    <div className="flex gap-3">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowClearConfirm(false)} className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-lg transition-all border border-white/20">
                        Cancel
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleClearPR} className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-red-500/30">
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