// src/components/workout/WorkoutModeOverlay.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, SkipForward, TrendingUp, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PRBadge } from '../ui/PRBadge';
import { TimerDisplay } from '../ui/TimerDisplay';
import  SetLogger  from '../ui/SetLogger';

const FALLBACK_GIF = 'https://via.placeholder.com/600x400/111/fff?text=No+GIF';

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
  const containerRef = useRef(null);
  const currentEx = todayExercises[currentExerciseIndex];
  const currentExId = currentEx?.exerciseId || currentEx?.id;
  const currentHistory = exerciseHistory[currentExId] || { logs: [], pr: 0 };
  const sortedLogs = [...currentHistory.logs].sort((a, b) => b.date.localeCompare(a.date));

  // Auto-scroll to top on exercise change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentExerciseIndex]);

  // CLEAR PR — NOW WORKS
  const handleClearPR = () => {
    if (!currentExId) return;
    
    clearPR(currentExId);
    toast.success('PR cleared!', {
      icon: 'Cross',
      style: {
        background: 'linear-gradient(to right, #ef4444, #f87171)',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
      },
    });
  };

  if (!isWorkoutStarted || !currentEx) return null;

  return (
    <AnimatePresence>
      {isWorkoutStarted && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/95 backdrop-blur-3xl"
          />

          {/* Scrollable Container */}
          <motion.div
            ref={containerRef}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto"
          >
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <motion.h1
                    key={currentEx.name}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-teal-400 leading-tight"
                  >
                    {currentEx.name}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl sm:text-4xl font-bold text-emerald-300 mt-3"
                  >
                    {currentEx.sets} × {currentEx.reps}
                  </motion.p>
                  <div className="flex justify-center mt-4">
                    <PRBadge pr={currentHistory.pr} size="lg" />
                  </div>
                </div>

                {/* GIF */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 sm:mb-8 rounded-3xl overflow-hidden border-4 border-emerald-500/50 shadow-2xl bg-black/40"
                >
                  <img
                    src={currentEx.gifUrl || FALLBACK_GIF}
                    alt={currentEx.name}
                    className="w-full aspect-video object-contain"
                    onError={e => e.target.src = FALLBACK_GIF}
                  />
                </motion.div>

                {/* Timer */}
                <div className="mb-8">
                  <TimerDisplay seconds={secondsLeft} isResting={isResting} formatTime={formatTime} />
                </div>

                {/* Set Logger */}
                <div className="mb-8">
                  <SetLogger
                    exercise={currentEx}
                    history={currentHistory}
                    onLogSet={openLogModal}
                  />
                </div>

                {/* Recent Logs + Clear PR */}
                {sortedLogs.length > 0 && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-5">
                      <h4 className="text-xl sm:text-2xl font-bold text-amber-400 flex items-center gap-3">
                        <TrendingUp className="w-7 h-7" />
                        Recent Logs
                      </h4>
                      <button
                        onClick={handleClearPR}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded-xl font-bold text-sm sm:text-base transition-all hover:scale-105 active:scale-95"
                      >
                        <Trash2 className="w-5 h-5" />
                        Clear PR
                      </button>
                    </div>
                    <div className="space-y-3">
                      {sortedLogs.slice(0, 5).map((log, i) => (
                        <motion.div
                          key={i}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex justify-between items-center bg-white/5 rounded-xl p-4"
                        >
                          <span className="text-white/80 text-sm sm:text-base">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                          <span className="font-black text-emerald-300 text-lg sm:text-xl">
                            {log.weight}kg × {log.reps}
                            <span className="text-amber-400 ml-2">
                              → {log.oneRm}kg
                            </span>
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center gap-6 sm:gap-10 mt-10 sm:mt-12">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsWorkoutStarted(false)}
                    className="p-6 sm:p-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full shadow-2xl hover:shadow-red-600/50 transition-all hover:scale-110"
                  >
                    <Pause className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={nextExercise}
                    className="p-8 sm:p-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-2xl hover:shadow-emerald-500/80 transition-all hover:scale-110"
                  >
                    <SkipForward className="w-12 h-12 sm:w-16 sm:h-16 text-black" />
                  </motion.button>
                </div>

                {/* Progress */}
                <div className="mt-8 text-center">
                  <p className="text-white/60 text-sm sm:text-base">
                    Exercise {currentExerciseIndex + 1} of {todayExercises.length}
                  </p>
                  <div className="mt-3 bg-white/10 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentExerciseIndex + 1) / todayExercises.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsWorkoutStarted(false)}
              className="fixed top-4 right-4 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all hover:scale-110"
            >
              <X className="w-7 h-7 text-white" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};