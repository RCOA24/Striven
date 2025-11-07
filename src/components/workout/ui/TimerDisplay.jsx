// src/components/ui/TimerDisplay.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Zap } from 'lucide-react';

export const TimerDisplay = ({ seconds, isResting, formatTime }) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (seconds <= 10 && seconds > 0) {
      setPulse(true);
    } else {
      setPulse(false);
    }
  }, [seconds]);

  if (seconds <= 0) return null;

  const progress = (seconds / (isResting ? 90 : 60)) * 100;
  const isLow = seconds <= 10;

  return (
    <>
      {/* Main Timer */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl mx-auto mb-12"
      >
        {/* Glass Card */}
        <div className="
          relative overflow-hidden rounded-3xl 
          bg-gradient-to-b from-white/5 via-white/10 to-white/5 
          backdrop-blur-3xl 
          border-4 border-white/20 
          shadow-2xl p-10
        ">
          {/* Subtle Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-3xl" />

          <div className="relative z-10 text-center">
            {/* Mode Label */}
            <motion.p
              key={isResting ? 'rest' : 'work'}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl sm:text-3xl font-bold text-emerald-300 mb-4 tracking-wider"
            >
              {isResting ? 'REST' : 'WORK'}
            </motion.p>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-xl">
                {isResting ? (
                  <Flame className="w-12 h-12 text-orange-400" />
                ) : (
                  <Zap className="w-12 h-12 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Time */}
            <motion.div
              key={seconds}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`
                text-8xl sm:text-9xl lg:text-[10rem] 
                font-black tracking-tight
                ${isLow ? 'text-red-400' : 'text-white'}
                drop-shadow-2xl
              `}
              style={{
                textShadow: isLow 
                  ? '0 0 40px rgba(248, 113, 113, 0.8)' 
                  : '0 0 30px rgba(255, 255, 255, 0.4)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTime(seconds)}
            </motion.div>

            {/* Progress Bar */}
            <div className="mt-8 h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${100 - progress}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' }}
              />
            </div>

            {/* Pulse Effect (under 10s) */}
            {isLow && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl border-4 border-red-500/50 blur-xl"
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Mini Timer (Mobile Only) */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/90 backdrop-blur-2xl rounded-full px-8 py-4 border-4 border-emerald-500 shadow-2xl">
          <p className="text-4xl font-black text-emerald-400">
            {formatTime(seconds)}
          </p>
        </div>
      </div>
    </>
  );
};