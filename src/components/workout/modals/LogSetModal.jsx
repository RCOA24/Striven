// src/components/workout/modals/LogSetModal.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trophy, Zap, Target, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const LogSetModal = ({ 
  loggingSet, 
  exercise, 
  weightInput, 
  setWeightInput, 
  repInput, 
  setRepInput, 
  saveLog, 
  onClose 
}) => {
  const weightRef = useRef(null);
  const repRef = useRef(null);

  const weight = parseFloat(weightInput) || 0;
  const reps = parseInt(repInput) || 0;
  const estimated1RM = weight && reps ? (weight * (1 + reps / 30)).toFixed(1) : 0;

  useEffect(() => {
    weightRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter' && weight && reps) saveLog();
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && document.activeElement === weightRef.current) {
        e.preventDefault();
        repRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [weight, reps, saveLog, onClose]);

  if (!loggingSet) return null;

  return (
    <AnimatePresence>
      {loggingSet && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-3xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="
              w-full max-w-md sm:max-w-lg md:max-w-2xl 
              bg-gradient-to-b from-black via-emerald-950/95 to-black 
              rounded-2xl sm:rounded-3xl 
              border-2 sm:border-4 border-emerald-500/70 
              shadow-2xl 
              overflow-hidden 
              max-h-[95vh] sm:max-h-[96vh]
              flex flex-col
            ">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 sm:px-6 sm:pt-8 md:px-10 md:pt-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-teal-400 leading-tight">
                    Log Set {loggingSet.setIndex + 1}
                  </h3>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-emerald-300 mt-2 sm:mt-3 line-clamp-2 px-2">
                    {exercise?.name}
                  </p>
                </div>

                {/* Inputs */}
                <div className="space-y-6 sm:space-y-8 md:space-y-10 mb-6 sm:mb-8 md:mb-10">
                  {/* Weight */}
                  <div>
                    <label className="flex items-center justify-center gap-2 sm:gap-3 text-emerald-300 font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                      Weight (kg)
                    </label>
                    <input
                      ref={weightRef}
                      type="number"
                      inputMode="decimal"
                      placeholder="100"
                      value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                      className="
                        w-full px-4 py-4 sm:px-6 sm:py-5 md:py-6 
                        text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-center 
                        bg-white/10 border-2 sm:border-4 border-emerald-500/70 
                        rounded-2xl sm:rounded-3xl text-emerald-200 placeholder-white/30
                        focus:border-emerald-300 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-emerald-500/50
                        transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0
                      "
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                    />
                  </div>

                  {/* Reps */}
                  <div>
                    <label className="flex items-center justify-center gap-2 sm:gap-3 text-emerald-300 font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                      Reps
                    </label>
                    <input
                      ref={repRef}
                      type="number"
                      inputMode="numeric"
                      placeholder="10"
                      value={repInput}
                      onChange={e => setRepInput(e.target.value)}
                      className="
                        w-full px-4 py-4 sm:px-6 sm:py-5 md:py-6 
                        text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-center 
                        bg-white/10 border-2 sm:border-4 border-emerald-500/70 
                        rounded-2xl sm:rounded-3xl text-emerald-200 placeholder-white/30
                        focus:border-emerald-300 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-emerald-500/50
                        transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0
                      "
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                    />
                  </div>

                  {/* 1RM Preview */}
                  {estimated1RM > 0 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="
                        bg-gradient-to-r from-amber-600/40 via-orange-600/40 to-amber-600/40 
                        backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 
                        border-2 sm:border-4 border-amber-500/70 
                        text-center shadow-2xl
                      "
                    >
                      <Trophy className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-amber-400 mx-auto mb-3 sm:mb-4" />
                      <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-amber-300 mb-1 sm:mb-2">
                        Estimated 1RM
                      </p>
                      <p className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter">
                        {estimated1RM}
                        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl text-amber-300 ml-1 sm:ml-2">kg</span>
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Fixed Bottom Buttons */}
              <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 md:px-6 md:pb-8 bg-gradient-to-t from-black/80 to-transparent border-t border-white/5">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={saveLog}
                    disabled={!weight || !reps}
                    className="
                      flex-1 py-4 sm:py-5 md:py-6 lg:py-7 
                      bg-gradient-to-r from-emerald-500 to-teal-500 
                      hover:from-emerald-400 hover:to-teal-400 
                      disabled:from-gray-600 disabled:to-gray-700 
                      disabled:cursor-not-allowed disabled:opacity-50
                      rounded-2xl sm:rounded-3xl font-black 
                      text-xl sm:text-2xl md:text-3xl lg:text-4xl 
                      text-black shadow-2xl 
                      hover:shadow-emerald-500/80 
                      transition-all hover:scale-[1.02] active:scale-95
                      flex items-center justify-center gap-2 sm:gap-3 md:gap-4
                      min-h-[56px] sm:min-h-[64px] md:min-h-[70px]
                    "
                  >
                    <Save className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
                    SAVE SET
                  </button>

                  <button
                    onClick={onClose}
                    className="
                      px-6 py-4 sm:px-8 sm:py-5 md:py-6 lg:py-7 
                      bg-white/10 hover:bg-white/20 
                      backdrop-blur-xl 
                      rounded-2xl sm:rounded-3xl font-bold 
                      text-lg sm:text-xl md:text-2xl lg:text-3xl 
                      text-white/90 hover:text-white 
                      transition-all hover:scale-[1.02] active:scale-95
                      flex items-center justify-center gap-2 sm:gap-3
                      min-h-[56px] sm:min-h-[64px] md:min-h-[70px]
                      sm:w-auto
                    "
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                    Cancel
                  </button>
                </div>

                <p className="text-center text-white/50 text-xs sm:text-sm mt-3 sm:mt-4 px-2">
                  Enter to save • Esc to cancel • Tab to switch
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};