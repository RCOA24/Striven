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
    <div ref={containerRef} className="space-y-4 mb-6 px-1 sm:px-2">
      {/* Header */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-3"
      >
        <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text">
          Log Your Sets
        </h3>
        <p className="text-xs sm:text-sm text-white/60 mt-0.5">
          Tap a card to log • PRs highlighted
        </p>
      </motion.div>

      {/* Sets Grid (responsive) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto">
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
                group relative rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border backdrop-blur-md overflow-hidden
                transition-colors min-h-[80px] sm:min-h-[90px]
                ${isPR
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-300/15 to-orange-600/15'
                  : isLogged
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-white/10 hover:border-emerald-400 hover:bg-white/5'}
              `}
            >
              {/* Subtle background accent */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`absolute -top-6 -right-6 w-16 sm:w-20 h-16 sm:h-20 rounded-full blur-2xl ${
                  isPR ? 'bg-yellow-400/30' : 'bg-emerald-400/20'
                }`} />
              </div>

              <div className="relative flex flex-col gap-1.5 sm:gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-white/40">
                      Set {setNum}
                    </span>
                    {isLogged ? (
                      <>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-white leading-tight">
                          {log.weight}kg × {log.reps}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-white/50 font-medium">
                          {log.oneRm}kg 1RM
                        </span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold text-white/60 group-hover:text-white/80">
                        Tap to log
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {isPR && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-md" />}
                    {!isPR && isLogged && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
                    {!isLogged && <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300/70" />}
                  </div>
                </div>

                {isPR && (
                  <motion.span
                    initial={{ scale: 0, y: -6 }}
                    animate={{ scale: 1, y: 0 }}
                    className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 border border-yellow-400/60 text-[9px] sm:text-[10px] font-bold text-yellow-300 w-fit"
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
      <div className="mt-4 sm:mt-6 max-w-4xl mx-auto px-1">
        <div className="flex justify-between text-[10px] sm:text-xs md:text-sm text-white/50 mb-1">
          <span>Progress</span>
          <span>{logs.length} / {sets} sets</span>
        </div>
        <div className="h-2.5 sm:h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
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

      <p className="text-center text-[10px] sm:text-xs md:text-sm text-white/40 mt-3 sm:mt-4 px-2">
        Sets update instantly • Long press device back to exit
      </p>
    </div>
  );
};

export default SetLogger;