import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, Moon, Check, Target, Zap
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Enhanced weekly schedule selector component
 * Displays desktop sidebar and mobile horizontal scroll
 */
export const PlanDaySelector = ({ days, selectedDayIndex, onSelect, onToggleRest }) => {
  const scrollRef = useRef(null);

  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        name: DAYS_OF_WEEK[i],
        short: DAYS_OF_WEEK[i].substring(0, 3),
        date: d.getDate(),
        month: d.toLocaleString('en-US', { month: 'short' }),
        isToday: d.toDateString() === today.toDateString(),
      };
    });
  };

  const weekDates = getWeekDates();
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const scrollToDay = (i) => {
    if (scrollRef.current) {
      const el = scrollRef.current.children[i];
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  useEffect(() => scrollToDay(selectedDayIndex), [selectedDayIndex]);

  // Calculate total exercises for progress indication
  const totalExercises = days.reduce((sum, d) => sum + (d.isRest ? 0 : d.exercises.length), 0);
  const activeDays = days.filter(d => !d.isRest && d.exercises.length > 0).length;

  return (
    <div className="bg-gradient-to-b from-emerald-950/60 via-emerald-950/30 to-transparent border-b lg:border-b-0 lg:border-r border-emerald-500/20">
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <div className="hidden lg:block w-72">
        {/* Header with Stats */}
        <div className="p-5 border-b border-emerald-500/20 space-y-3">
          <div>
            <h3 className="font-bold text-emerald-400 flex items-center gap-2.5 text-sm uppercase tracking-wider">
              <Calendar className="w-4 h-4" /> 
              Weekly Schedule
            </h3>
            <p className="text-xs text-white/50 mt-1.5">
              {weekStart.month} {weekStart.date} – {weekEnd.month} {weekEnd.date}
            </p>
          </div>
          
          {/* Progress Stats */}
          {totalExercises > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="flex-1 bg-emerald-500/10 rounded-lg p-2.5 border border-emerald-500/20">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-white/60">Days</span>
                </div>
                <div className="text-lg font-bold text-emerald-300 mt-0.5">{activeDays}/7</div>
              </div>
              <div className="flex-1 bg-emerald-500/10 rounded-lg p-2.5 border border-emerald-500/20">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-white/60">Exercises</span>
                </div>
                <div className="text-lg font-bold text-emerald-300 mt-0.5">{totalExercises}</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Day List */}
        <div className="overflow-y-auto max-h-[calc(100vh-480px)] scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
          {weekDates.map((d, i) => {
            const dayData = days.find(dd => dd.day === d.name) || { 
              day: d.name, 
              exercises: [], 
              isRest: false 
            };
            const isSel = selectedDayIndex === i;
            const isRest = dayData.isRest;
            const hasExercises = dayData.exercises.length > 0;

            return (
              <motion.button
                key={d.name}
                whileHover={{ x: isRest ? 0 : 2 }}
                whileTap={{ scale: isRest ? 1 : 0.98 }}
                onClick={() => !isRest && onSelect(i)}
                className={`
                  w-full text-left p-4 transition-all duration-200
                  border-b border-white/5 relative flex items-center gap-3
                  ${isSel && !isRest
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-300'
                    : isRest
                    ? 'bg-gray-900/50 text-gray-500 cursor-default opacity-60'
                    : 'hover:bg-white/5 text-white/80'
                  }
                `}
              >
                {/* Active Indicator */}
                {isSel && !isRest && (
                  <motion.div
                    layoutId="dayIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className={`
                        font-semibold text-sm truncate
                        ${isSel && !isRest ? 'text-emerald-300' : ''}
                        ${d.isToday && !isRest ? 'text-emerald-400' : ''}
                      `}>
                        {d.name}
                        {d.isToday && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">
                        {d.month} {d.date}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2">
                      {isRest ? (
                        <div className="flex items-center gap-1 text-xs text-gray-500 px-2 py-1 bg-gray-800/50 rounded-full">
                          <Moon className="w-3 h-3" />
                          Rest
                        </div>
                      ) : (
                        <>
                          <motion.span 
                            animate={{ scale: hasExercises ? [1, 1.1, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                            className={`
                              text-xs px-2.5 py-1 rounded-full font-medium
                              ${hasExercises
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/5 text-white/40 border border-white/10'
                              }
                            `}
                          >
                            {dayData.exercises.length}
                          </motion.span>
                          {hasExercises && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                              <Check className="w-4 h-4 text-emerald-400" />
                            </motion.div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rest Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); onToggleRest(i); }}
                  className={`
                    p-2 rounded-lg transition-all
                    ${isRest 
                      ? 'bg-gray-700/50 text-gray-400' 
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                    }
                  `}
                  title={isRest ? 'Make workout day' : 'Make rest day'}
                >
                  <Moon className="w-4 h-4" />
                </motion.button>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ═══ MOBILE HORIZONTAL SCROLL ═══ */}
      <div className="lg:hidden">
        <div className="px-4 pt-4 pb-2 space-y-2">
          <p className="text-xs text-white/60 text-center font-medium">
            {weekStart.month} {weekStart.date} – {weekEnd.month} {weekEnd.date}
          </p>
          {totalExercises > 0 && (
            <div className="flex gap-2 justify-center">
              <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                {activeDays} days • {totalExercises} exercises
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 pb-3">
          <button
            onClick={() => onSelect(Math.max(0, selectedDayIndex - 1))}
            disabled={selectedDayIndex === 0}
            className="p-2 rounded-lg bg-white/10 disabled:opacity-20 hover:bg-white/20 transition-all disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {weekDates.map((d, i) => {
              const dayData = days.find(dd => dd.day === d.name) || { 
                day: d.name, 
                exercises: [], 
                isRest: false 
              };
              const isSel = selectedDayIndex === i;
              const isRest = dayData.isRest;
              const hasExercises = dayData.exercises.length > 0;

              return (
                <motion.button
                  key={d.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !isRest && onSelect(i)}
                  className={`
                    snap-center flex-shrink-0 w-20 py-3 rounded-xl text-center 
                    transition-all shadow-sm relative border
                    ${isRest
                      ? 'bg-gray-900/70 text-gray-500 border-gray-700/50'
                      : isSel
                      ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-400'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/20'
                    }
                  `}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                    {d.short}
                  </div>
                  <div className={`
                    text-lg font-bold mt-0.5
                    ${isSel && !isRest ? 'text-white' : ''}
                    ${d.isToday && !isRest ? 'text-emerald-300' : ''}
                  `}>
                    {d.date}
                  </div>

                  {isRest ? (
                    <Moon className="absolute top-1 right-1 w-3 h-3 text-gray-500" />
                  ) : hasExercises && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-gray-900"
                    >
                      {dayData.exercises.length}
                    </motion.div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onToggleRest(i); }}
                    className="absolute bottom-1 right-1 p-1 rounded-full bg-black/20 backdrop-blur-sm"
                  >
                    <Moon className="w-2.5 h-2.5" />
                  </motion.button>
                </motion.button>
              );
            })}
          </div>

          <button
            onClick={() => onSelect(Math.min(6, selectedDayIndex + 1))}
            disabled={selectedDayIndex === 6}
            className="p-2 rounded-lg bg-white/10 disabled:opacity-20 hover:bg-white/20 transition-all disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
