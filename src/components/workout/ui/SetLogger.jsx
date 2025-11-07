// src/components/workout/ui/SetLogger.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Trophy, Zap, Target, Flame } from 'lucide-react';

const SetLogger = ({ exercise, sets = 4, history, onLogSet }) => {
  const exId = exercise.exerciseId || exercise.id;
  const today = new Date().toISOString().split('T')[0];
  const logs = history.logs || [];
  const pr = parseFloat(history.pr) || 0;
  const containerRef = useRef(null);

  // Auto-scroll to next incomplete set
  useEffect(() => {
    const nextIncomplete = logs.length < sets ? logs.length : sets - 1;
    containerRef.current?.children[nextIncomplete]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, [logs.length, sets]);

  return (
    <div ref={containerRef} className="space-y-5 mb-10 px-2">
      {/* Header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8"
      >
        <h3 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">
          Log Your Sets
        </h3>
        <p className="text-lg text-white/70 mt-2 font-medium">
          Tap to log • PRs glow gold
        </p>
      </motion.div>

      {/* Sets Grid */}
      <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
        {[...Array(sets)].map((_, i) => {
          const setNum = i + 1;
          const log = logs.find(l => l.set === setNum && l.date === today);
          const isPR = log && log.oneRm > pr + 0.1;
          const isLogged = !!log;

          return (
            <motion.button
              key={i}
              onClick={() => onLogSet(exId, i)}
              whileTap={{ scale: 0.95 }}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`
                relative overflow-hidden rounded-3xl p-6 shadow-2xl transition-all
                ${isPR 
                  ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 text-black border-4 border-yellow-300' 
                  : isLogged
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black border-4 border-emerald-400'
                  : 'bg-white/10 hover:bg-white/20 backdrop-blur-xl border-4 border-white/20 hover:border-emerald-400'
                }
                ${isPR ? 'animate-pulse ring-4 ring-yellow-400/50' : ''}
              `}
            >
              {/* Background Glow */}
              {isPR && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-600/30 blur-xl" />
              )}

              <div className="relative flex items-center justify-between">
                {/* Left: Set Number + Status */}
                <div className="flex items-center gap-4">
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-xl
                    ${isPR ? 'bg-black/30 text-yellow-300' : isLogged ? 'bg-black/20 text-white' : 'bg-white/20 text-white/70'}
                  `}>
                    {setNum}
                  </div>

                  <div className="text-left">
                    {isLogged ? (
                      <>
                        <p className="font-black text-2xl sm:text-3xl">
                          {log.weight}kg × {log.reps}
                        </p>
                        <p className="text-sm font-bold opacity-90">
                          → {log.oneRm}kg 1RM
                        </p>
                      </>
                    ) : (
                      <p className="text-xl font-bold opacity-80">
                        Set {setNum}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center gap-3">
                  {isPR && (
                    <>
                      <Trophy className="w-10 h-10 animate-bounce" />
                      <Flame className="w-8 h-8 text-orange-300 animate-pulse" />
                    </>
                  )}
                  {isLogged && !isPR && (
                    <CheckCircle2 className="w-10 h-10" />
                  )}
                  {!isLogged && (
                    <Zap className="w-8 h-8 text-emerald-300 opacity-60" />
                  )}
                </div>
              </div>

              {/* PR Badge */}
              {isPR && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-yellow-400"
                >
                  <p className="text-yellow-300 font-black text-xs tracking-wider">
                    NEW PR!
                  </p>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="flex justify-between text-sm text-white/60 mb-2">
          <span>Progress</span>
          <span>{logs.length} / {sets} sets</span>
        </div>
        <div className="h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(logs.length / sets) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-lg"
          />
        </div>
      </div>

      {/* Tip */}
      <p className="text-center text-white/50 text-sm mt-6 italic">
        Tap any set to log • PRs auto-detected
      </p>
    </div>
  );
};

export default SetLogger;