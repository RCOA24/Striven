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

  // Auto-scroll to next incomplete set (fixed: only target set buttons, not all children)
  useEffect(() => {
    if (!containerRef.current) return;
    const setButtons = containerRef.current.querySelectorAll('[data-set-button]');
    const targetIndex = logs.length < sets ? logs.length : sets - 1;
    const target = setButtons[targetIndex];
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [logs.length, sets]);

  return (
    <div ref={containerRef} className="space-y-6 mb-10 px-2">
      {/* Header */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-4"
      >
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text">
          Log Your Sets
        </h3>
        <p className="text-sm sm:text-base text-white/60 mt-1">
          Tap a card to log • PRs highlighted
        </p>
      </motion.div>

      {/* Sets Grid (responsive) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {[...Array(sets)].map((_, i) => {
          const setNum = i + 1;
          const log = logs.find(l => l.set === setNum && l.date === today);
          const isPR = log && log.oneRm > pr + 0.1;
          const isLogged = !!log;
          return (
            <motion.button
              data-set-button
              key={i}
              aria-label={isLogged ? `Set ${setNum} logged: ${log.weight}kg for ${log.reps} reps` : `Log set ${setNum}`}
              onClick={() => onLogSet(exId, i)}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`
                group relative rounded-xl p-4 sm:p-5 border backdrop-blur-md overflow-hidden
                transition-colors
                ${isPR
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-300/15 to-orange-600/15'
                  : isLogged
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-white/10 hover:border-emerald-400 hover:bg-white/5'}
              `}
            >
              {/* Subtle background accent */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl ${
                  isPR ? 'bg-yellow-400/30' : 'bg-emerald-400/20'
                }`} />
              </div>

              <div className="relative flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                      Set {setNum}
                    </span>
                    {isLogged ? (
                      <>
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {log.weight}kg × {log.reps}
                        </span>
                        <span className="text-[11px] text-white/50 font-medium">
                          {log.oneRm}kg 1RM
                        </span>
                      </>
                    ) : (
                      <span className="text-sm sm:text-base font-semibold text-white/60 group-hover:text-white/80">
                        Tap to log
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {isPR && <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-md" />}
                    {!isPR && isLogged && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                    {!isLogged && <Zap className="w-6 h-6 text-emerald-300/70" />}
                  </div>
                </div>

                {isPR && (
                  <motion.span
                    initial={{ scale: 0, y: -6 }}
                    animate={{ scale: 1, y: 0 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 border border-yellow-400/60 text-[10px] font-bold text-yellow-300 w-fit"
                  >
                    NEW PR!
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mt-6 max-w-4xl mx-auto">
        <div className="flex justify-between text-xs sm:text-sm text-white/50 mb-1">
          <span>Progress</span>
          <span>{logs.length} / {sets} sets</span>
        </div>
        <div className="h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(logs.length / sets) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-inner"
            aria-valuenow={(logs.length / sets) * 100}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      </div>

      <p className="text-center text-xs sm:text-sm text-white/40 mt-4">
        Sets update instantly • Long press device back to exit
      </p>
    </div>
  );
};

export default SetLogger;