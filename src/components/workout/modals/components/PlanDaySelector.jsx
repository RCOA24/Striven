import React, { useEffect, useRef, useCallback, useMemo } from 'react';
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
  
  const getWeekDates = useCallback(() => {
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
  }, []);

  const weekDates = useMemo(() => getWeekDates(), [getWeekDates]);
  const weekStart = useMemo(() => weekDates[0], [weekDates]);
  const weekEnd = useMemo(() => weekDates[6], [weekDates]);

  const scrollToDay = useCallback((i) => {
    if (scrollRef.current) {
      const el = scrollRef.current.children[i];
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);

  useEffect(() => scrollToDay(selectedDayIndex), [selectedDayIndex, scrollToDay]);

  const totalExercises = useMemo(() => 
    days.reduce((sum, d) => sum + (d.isRest ? 0 : d.exercises.length), 0),
    [days]
  );
  const activeDays = useMemo(() => 
    days.filter(d => !d.isRest && d.exercises.length > 0).length,
    [days]
  );

  const handleToggleRest = useCallback((e, i) => {
    e.stopPropagation();
    onToggleRest(i);
  }, [onToggleRest]);

  return (
    <div className="h-full flex flex-col bg-emerald-950/40">
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <div className="hidden lg:flex lg:flex-col h-full">
        <div className="flex-shrink-0 p-4 border-b border-emerald-500/20 space-y-2">
          <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-xs uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" /> 
            Schedule
          </h3>
          <p className="text-[11px] text-white/50">
            {weekStart.month} {weekStart.date} – {weekEnd.month} {weekEnd.date}
          </p>
          
          {totalExercises > 0 && (
            <div className="flex gap-2 text-[11px]">
              <div className="flex-1 bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                <span className="text-white/60">Days</span>
                <div className="font-bold text-emerald-300">{activeDays}/7</div>
              </div>
              <div className="flex-1 bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                <span className="text-white/60">Ex</span>
                <div className="font-bold text-emerald-300">{totalExercises}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20">
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
              <button
                key={d.name}
                onClick={() => !isRest && onSelect(i)}
                className={`
                  w-full text-left p-3 transition-colors
                  border-b border-white/5 relative flex items-center gap-2.5
                  ${isSel && !isRest
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isRest
                    ? 'bg-gray-900/50 text-gray-500 cursor-default opacity-60'
                    : 'hover:bg-white/5 text-white/80'
                  }
                `}
                style={{ touchAction: 'manipulation' }}
              >
                {isSel && !isRest && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    {d.name}
                    {d.isToday && (
                      <span className="ml-1.5 text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/40">
                    {d.month} {d.date}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isRest ? (
                    <div className="text-[11px] text-gray-500 px-2 py-0.5 bg-gray-800/50 rounded-full flex items-center gap-1">
                      <Moon className="w-3 h-3" />
                      Rest
                    </div>
                  ) : (
                    <>
                      <span className={`
                        text-[11px] px-2 py-0.5 rounded-full font-medium
                        ${hasExercises
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-white/40'
                        }
                      `}>
                        {dayData.exercises.length}
                      </span>
                      {hasExercises && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </>
                  )}
                </div>

                <button
                  onClick={(e) => handleToggleRest(e, i)}
                  className={`
                    p-1.5 rounded-lg transition-colors
                    ${isRest ? 'bg-gray-700/50 text-gray-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}
                  `}
                  style={{ touchAction: 'manipulation' }}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ MOBILE LIST VIEW ═══ */}
      <div className="lg:hidden flex-1 overflow-y-auto p-3 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="mb-3 text-center">
          <p className="text-xs text-white/60 mb-2">
            {weekStart.month} {weekStart.date} – {weekEnd.month} {weekEnd.date}
          </p>
          {totalExercises > 0 && (
            <div className="flex gap-2 justify-center text-[11px]">
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                {activeDays} days
              </span>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                {totalExercises} exercises
              </span>
            </div>
          )}
        </div>

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
            <button
              key={d.name}
              onClick={() => !isRest && onSelect(i)}
              className={`
                w-full p-4 rounded-lg transition-all border-2 flex items-center gap-3
                ${isSel && !isRest
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : isRest
                  ? 'bg-gray-900/50 border-gray-700/30 text-gray-500'
                  : 'bg-white/5 border-white/10 text-white/80 active:bg-white/10'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0
                ${isSel && !isRest
                  ? 'bg-emerald-500/30 border-2 border-emerald-400'
                  : isRest
                  ? 'bg-gray-800/50 border border-gray-700'
                  : 'bg-white/10 border border-white/20'
                }
              `}>
                <span className="text-[10px] uppercase font-bold opacity-70">
                  {d.short}
                </span>
                <span className="text-lg font-bold">
                  {d.date}
                </span>
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="font-semibold text-sm">
                  {d.name}
                  {d.isToday && (
                    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/50 mt-0.5">
                  {isRest ? (
                    <span className="flex items-center gap-1">
                      <Moon className="w-3 h-3" />
                      Rest Day
                    </span>
                  ) : (
                    <span>
                      {dayData.exercises.length} exercise{dayData.exercises.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleRest(i); }}
                className={`
                  p-2.5 rounded-lg transition-all flex-shrink-0
                  ${isRest ? 'bg-gray-700/50' : 'bg-white/10 active:bg-white/20'}
                `}
              >
                <Moon className="w-4 h-4" />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
};
