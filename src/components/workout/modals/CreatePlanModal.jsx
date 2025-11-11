import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Search, Loader2, GripVertical, X, Plus, Save, AlertCircle,
  ChevronLeft, ChevronRight, Dumbbell, Calendar, Trash2, Check, 
  Moon, Sparkles, TrendingUp, Target, Zap
} from 'lucide-react';

const STATIC_FALLBACK = '/fallback-exercise.gif';
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MAX_VISIBLE_EXERCISES = 10;

// ══════════════════════════════════════════════════════════════
// SAFE IMAGE COMPONENT
// ══════════════════════════════════════════════════════════════
const SafeExerciseImage = ({ src, alt, className }) => {
  const imgRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const handleError = (e) => {
    const t = e.currentTarget;
    if (t.dataset.fallback === 'true') return;
    t.dataset.fallback = 'true';
    t.src = STATIC_FALLBACK;
  };
  
  const finalSrc = src && src.trim() ? src : STATIC_FALLBACK;
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/5 animate-pulse rounded" />
      )}
      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ENHANCED WEEKLY SCHEDULE SELECTOR
// ══════════════════════════════════════════════════════════════
const PlanDaySelector = ({ days, selectedDayIndex, onSelect, onToggleRest }) => {
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

// ══════════════════════════════════════════════════════════════
// ENHANCED SEARCH RESULTS
// ══════════════════════════════════════════════════════════════
const SearchResults = ({
  search, setSearch, results, totalCount,
  currentPage, totalPages, loading, onAdd, onPageChange
}) => {
  const inputRef = useRef(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  useEffect(() => { 
    setTimeout(() => inputRef.current?.focus(), 100); 
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 relative z-10">
      {/* ═══ STICKY SEARCH BAR ═══ */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-b from-black/80 via-black/60 to-transparent backdrop-blur-xl sticky top-0 z-30 border-b border-white/10">
        <div className="relative">
          <motion.div
            animate={{ scale: searchFocused ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Search className={`
              absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors
              ${searchFocused ? 'text-emerald-400' : 'text-white/40'}
            `} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search 10,000+ exercises..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="
                w-full pl-12 pr-12 py-3.5 rounded-xl
                bg-white/10 border-2 border-white/20
                focus:border-emerald-500 focus:bg-white/15
                focus:ring-4 focus:ring-emerald-500/20
                transition-all duration-200 outline-none
                text-white placeholder-white/40 font-medium
              "
            />
            {search && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Search Results Info */}
        {search && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-between text-xs text-white/70 px-1"
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">{results.length}</span> of {totalCount} results
            </span>
            {totalPages > 1 && (
              <span className="font-medium text-emerald-400">
                Page {currentPage} / {totalPages}
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* ═══ SEARCH RESULTS LIST ═══ */}
      <div className="flex-1 overflow-y-auto px-2 pb-20 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
        {loading && results.length === 0 ? (
          // Loading Skeleton
          <div className="space-y-2 p-2">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse"
              >
                <div className="w-14 h-14 bg-white/10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/10 rounded w-1/2" />
                </div>
                <div className="w-9 h-9 bg-white/10 rounded-full" />
              </motion.div>
            ))}
          </div>
        ) : search.trim() === '' ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-4"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Search Exercises
            </h3>
            <p className="text-sm text-white/50">
              Type to search from our database of 10,000+ exercises
            </p>
          </motion.div>
        ) : results.length === 0 ? (
          // No Results
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-4"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Results Found
            </h3>
            <p className="text-sm text-white/50">
              Try different keywords or check your spelling
            </p>
          </motion.div>
        ) : (
          // Results Grid
          <div className="space-y-2 p-2">
            {results.map((ex, i) => (
              <motion.button
                key={`${ex.id}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ x: 2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAdd(ex)}
                className="
                  w-full flex items-center gap-3 p-3 rounded-xl
                  bg-gradient-to-r from-white/5 to-white/8
                  hover:from-emerald-500/10 hover:to-emerald-500/5
                  border border-white/10 hover:border-emerald-500/30
                  transition-all duration-200 text-left group
                  shadow-sm hover:shadow-emerald-500/10
                "
              >
                {/* Exercise Image */}
                <SafeExerciseImage
                  src={ex.gifUrl}
                  alt={ex.name}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-md border border-white/10 group-hover:border-emerald-500/30 transition-colors"
                />

                {/* Exercise Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">
                    {ex.name}
                  </h4>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    <span className="text-emerald-400">{ex.muscles}</span> • {ex.equipment}
                  </p>
                </div>

                {/* Add Button */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-emerald-500/30"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                </motion.div>
              </motion.button>
            ))}

            {/* Inline Loading */}
            {loading && results.length > 0 && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ STICKY PAGINATION ═══ */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 sticky bottom-0 bg-gradient-to-t from-black via-black/95 to-transparent p-4 border-t border-white/10 z-40 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="
                flex items-center gap-2 px-4 py-2.5 rounded-lg
                bg-white/10 hover:bg-white/20
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all font-medium border border-white/20
                text-white
              "
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </motion.button>
            
            <div className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
              <span className="text-sm font-bold text-emerald-300">
                {currentPage} / {totalPages}
              </span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="
                flex items-center gap-2 px-4 py-2.5 rounded-lg
                bg-white/10 hover:bg-white/20
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all font-medium border border-white/20
                text-white
              "
            >
              Next <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ENHANCED EXERCISE ITEM
// ══════════════════════════════════════════════════════════════
const ExerciseItem = ({ ex, index, onRemove }) => {
  const controls = useDragControls();
  
  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      className="bg-gradient-to-r from-white/8 to-white/5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-emerald-500/10"
    >
      <div className="p-3.5 flex items-center gap-3">
        {/* Drag Handle */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          onPointerDown={e => controls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <GripVertical className="w-5 h-5 text-white/30" />
        </motion.div>

        {/* Order Badge */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-emerald-300 font-bold text-sm">{index + 1}</span>
        </div>

        {/* Exercise Image */}
        <SafeExerciseImage 
          src={ex.gifUrl} 
          alt={ex.name} 
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-white/10 shadow-md" 
        />

        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-white truncate">
            {ex.name}
          </div>
          <div className="text-xs text-white/50 mt-1 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">
              {ex.sets || 4} × {ex.reps || 10}
            </span>
            <span>•</span>
            <span>{ex.rest || 90}s rest</span>
          </div>
        </div>

        {/* Remove Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(index)}
          className="p-2.5 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0 group border border-transparent hover:border-red-500/30"
        >
          <Trash2 className="w-4 h-4 text-red-400/70 group-hover:text-red-400 transition-colors" />
        </motion.button>
      </div>
    </Reorder.Item>
  );
};

// ══════════════════════════════════════════════════════════════
// ENHANCED EXERCISE LIST
// ══════════════════════════════════════════════════════════════
const PlanExerciseList = ({ exercises, dayName, isRest, onReorder, onRemove }) => {
  const visible = exercises.slice(0, MAX_VISIBLE_EXERCISES);
  const hiddenCount = exercises.length - MAX_VISIBLE_EXERCISES;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gradient-to-b from-black/20 to-transparent min-h-0 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
      {/* Header */}
     <div className="mb-5 flex items-center justify-between sticky top-0 bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-transparent backdrop-blur-sm pb-3 z-10">
  <div>
    <h3 className="text-xl font-bold text-white flex items-center gap-2.5 mb-1">
      <div className="p-2 bg-emerald-500/20 rounded-lg">
        <Dumbbell className="w-5 h-5 text-emerald-400" />
      </div>
      {dayName}
    </h3>
    {!isRest && exercises.length > 0 && (
      <p className="text-sm text-white/60 ml-11">
        {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} • ~{exercises.length * 5} min
      </p>
    )}
  </div>

  {isRest ? (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <Moon className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-400 font-medium">Rest Day</span>
    </motion.div>
  ) : exercises.length > 0 && (
    // Sparkles + "Ready" removed
    null
  )}
</div>

      {/* Content */}
      {isRest ? (
        // Rest Day State
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-24"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center border border-gray-700/50">
            <Moon className="w-12 h-12 text-gray-500" />
          </div>
          <h4 className="text-xl font-semibold text-gray-400 mb-2">Rest Day</h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Recovery is essential for muscle growth and preventing injury
          </p>
        </motion.div>
      ) : exercises.length === 0 ? (
        // Empty State
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-24"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
            <Dumbbell className="w-12 h-12 text-emerald-400/40" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">No Exercises Yet</h4>
          <p className="text-sm text-white/50 max-w-xs mx-auto">
            Search and add exercises from the search panel
          </p>
        </motion.div>
      ) : (
        // Exercise List
        <div className="space-y-3">
          <Reorder.Group axis="y" values={exercises} onReorder={onReorder} className="space-y-2.5">
            {visible.map((ex, i) => (
              <ExerciseItem 
                key={`${ex.id || ex.exerciseId}-${i}`} 
                ex={ex} 
                index={i} 
                onRemove={onRemove} 
              />
            ))}
          </Reorder.Group>

          {/* Hidden Exercises Indicator */}
          {hiddenCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <p className="text-emerald-300 text-sm font-semibold">
                  +{hiddenCount} more exercise{hiddenCount !== 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-xs text-emerald-400/60 mt-1">
                Scroll to see all exercises in this workout
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ══════════════════════════════════════════════════════════════
export const CreatePlanModal = ({
  showCreatePlan,
  setShowCreatePlan,
  newPlanName,
  setNewPlanName,
  planDays,
  setPlanDays,
  selectedDayIndex,
  setSelectedDayIndex,
  planSearch,
  setPlanSearch,
  planResults,
  planLoading,
  planTotalCount,
  planCurrentPage,
  planTotalPages,
  addToPlanDay,
  removeFromPlanDay,
  reorderPlanDay,
  saveNewPlan,
  editingPlanId,
  onPlanPageChange
}) => {
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const toggleRestDay = (index) => {
    setPlanDays(prev => {
      const newDays = [...prev];
      const day = newDays[index];
      const willBeRest = !day.isRest;
      newDays[index] = {
        ...day,
        isRest: willBeRest,
        exercises: willBeRest ? [] : day.exercises
      };
      if (willBeRest && selectedDayIndex === index) {
        const next = newDays.findIndex((d, i) => i > index && !d.isRest);
        setSelectedDayIndex(next !== -1 ? next : newDays.findIndex(d => !d.isRest));
      }
      return newDays;
    });
  };

  useEffect(() => {
    if (showCreatePlan) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => nameInputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCreatePlan]);

  useEffect(() => {
    const esc = e => e.key === 'Escape' && handleClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const handleClose = () => {
    const hasChanges = newPlanName.trim() || planDays.some(d => d.exercises.length > 0 || d.isRest);
    if (hasChanges) setShowUnsavedWarning(true);
    else setShowCreatePlan(false);
  };

  const confirmClose = () => {
    setShowUnsavedWarning(false);
    setShowCreatePlan(false);
  };

  if (!showCreatePlan) return null;

  const totalExercises = planDays.reduce((s, d) => s + (d.isRest ? 0 : d.exercises.length), 0);
  const activeDays = planDays.filter(d => !d.isRest && d.exercises.length > 0).length;
  const currentDay = planDays.find(d => d.day === DAYS_OF_WEEK[selectedDayIndex]) || {
    day: DAYS_OF_WEEK[selectedDayIndex],
    exercises: [],
    isRest: false
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-4"
        onClick={e => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="
            bg-gradient-to-br from-gray-900 via-emerald-950/30 to-gray-900
            rounded-2xl lg:rounded-3xl w-full max-w-7xl h-[98vh] lg:h-[95vh]
            overflow-hidden border-2 border-emerald-500/30
            shadow-2xl shadow-emerald-500/20
            flex flex-col
          "
          onClick={e => e.stopPropagation()}
        >
          {/* ═══ HEADER ═══ */}
          <div className="flex-shrink-0 p-4 lg:p-6 bg-gradient-to-b from-emerald-950/60 via-emerald-950/30 to-transparent border-b border-emerald-500/20">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30"
                  >
                    <Dumbbell className="w-6 h-6 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">
                      {editingPlanId ? 'Edit Workout Plan' : 'Create New Plan'}
                    </h2>
                    {totalExercises > 0 && (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm text-emerald-400 mt-1 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {activeDays} day{activeDays !== 1 ? 's' : ''} • {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-all border border-white/10 hover:border-white/20"
              >
                <X className="w-6 h-6 text-white/70" />
              </motion.button>
            </div>

            {/* Plan Name Input */}
            <motion.div
              animate={{ scale: nameFocused ? 1.01 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="Enter plan name (e.g., Upper/Lower Split, Push/Pull/Legs)"
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  maxLength={50}
                  className="
                    w-full px-5 py-4 rounded-xl
                    bg-white/10 border-2 border-white/20
                    focus:border-emerald-500 focus:bg-white/15
                    focus:ring-4 focus:ring-emerald-500/20
                    transition-all duration-200 outline-none
                    text-white placeholder-white/40 font-semibold text-lg
                  "
                />
                {newPlanName && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
                  >
                    <span className="text-xs text-white/40">
                      {newPlanName.length}/50
                    </span>
                    <Check className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ═══ BODY ═══ */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Day Selector Sidebar */}
            <div className="flex-shrink-0">
              <PlanDaySelector
                days={planDays}
                selectedDayIndex={selectedDayIndex}
                onSelect={setSelectedDayIndex}
                onToggleRest={toggleRestDay}
              />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Search Panel */}
              <div className="flex-shrink-0 lg:w-96 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-white/10">
                <SearchResults
                  search={planSearch}
                  setSearch={setPlanSearch}
                  results={planResults}
                  totalCount={planTotalCount}
                  currentPage={planCurrentPage}
                  totalPages={planTotalPages}
                  loading={planLoading}
                  onAdd={ex => !currentDay.isRest && addToPlanDay(selectedDayIndex, ex)}
                  onPageChange={onPlanPageChange}
                />
              </div>

              {/* Exercise List Panel */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <PlanExerciseList
                  exercises={currentDay.exercises}
                  dayName={DAYS_OF_WEEK[selectedDayIndex]}
                  isRest={currentDay.isRest}
                  onReorder={newOrder => reorderPlanDay(selectedDayIndex, newOrder)}
                  onRemove={i => removeFromPlanDay(selectedDayIndex, i)}
                />
              </div>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="flex-shrink-0 p-4 lg:p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent border-t border-emerald-500/20 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveNewPlan}
                disabled={!newPlanName.trim()}
                className="
                  flex-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600
                  hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500
                  disabled:from-gray-700 disabled:to-gray-800
                  disabled:cursor-not-allowed
                  py-4 px-6 rounded-xl font-bold text-lg
                  shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50
                  transition-all duration-200
                  flex items-center justify-center gap-3
                  border-2 border-emerald-400/30
                  disabled:border-gray-700
                  relative overflow-hidden
                  group
                "
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <Save className="w-5 h-5 relative z-10" />
                <span className="relative z-10">
                  {editingPlanId ? 'Update Plan' : 'Save Plan'}
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="
                  px-8 py-4 bg-white/10 hover:bg-white/20
                  rounded-xl font-semibold text-lg
                  transition-all border-2 border-white/20 hover:border-white/30
                "
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ═══ UNSAVED WARNING DIALOG ═══ */}
        <AnimatePresence>
          {showUnsavedWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[110]"
              onClick={() => setShowUnsavedWarning(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
                className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-red-500/30 shadow-2xl shadow-red-500/20"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start gap-4 mb-6">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="p-3 bg-red-500/20 rounded-xl border border-red-500/30"
                  >
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Unsaved Changes
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      You have unsaved changes to your workout plan. Are you sure you want to leave? All progress will be lost.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmClose}
                    className="
                      flex-1 py-3.5 px-4
                      bg-gradient-to-r from-red-500 to-red-600
                      hover:from-red-600 hover:to-red-700
                      rounded-xl font-semibold
                      transition-all shadow-lg shadow-red-500/30
                      border border-red-400/30
                    "
                  >
                    Leave Anyway
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUnsavedWarning(false)}
                    className="
                      flex-1 py-3.5 px-4
                      bg-white/10 hover:bg-white/20
                      rounded-xl font-semibold
                      transition-all border-2 border-white/20 hover:border-white/30
                    "
                  >
                    Keep Editing
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

// Demo wrapper for testing
export default function App() {
  const [showModal, setShowModal] = useState(true);
  const [planName, setPlanName] = useState('');
  const [days, setDays] = useState(
    DAYS_OF_WEEK.map(day => ({ day, exercises: [], isRest: false }))
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const mockExercises = [
    { id: 1, name: 'Barbell Bench Press', muscles: 'Chest', equipment: 'Barbell', gifUrl: '/api/placeholder/100/100' },
    { id: 2, name: 'Squat', muscles: 'Legs', equipment: 'Barbell', gifUrl: '/api/placeholder/100/100' },
    { id: 3, name: 'Deadlift', muscles: 'Back', equipment: 'Barbell', gifUrl: '/api/placeholder/100/100' },
    { id: 4, name: 'Pull-ups', muscles: 'Back', equipment: 'Body Weight', gifUrl: '/api/placeholder/100/100' },
    { id: 5, name: 'Shoulder Press', muscles: 'Shoulders', equipment: 'Dumbbell', gifUrl: '/api/placeholder/100/100' },
  ];

  useEffect(() => {
    if (search.trim()) {
      setLoading(true);
      setTimeout(() => {
        setResults(mockExercises.filter(e => 
          e.name.toLowerCase().includes(search.toLowerCase())
        ));
        setLoading(false);
      }, 500);
    } else {
      setResults([]);
    }
  }, [search]);

  const addExercise = (ex) => {
    setDays(prev => {
      const newDays = [...prev];
      newDays[selectedDay].exercises.push({ ...ex, sets: 4, reps: 10, rest: 90 });
      return newDays;
    });
  };

  const removeExercise = (dayIndex, exIndex) => {
    setDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex].exercises.splice(exIndex, 1);
      return newDays;
    });
  };

  const reorderExercises = (dayIndex, newOrder) => {
    setDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex].exercises = newOrder;
      return newDays;
    });
  };

  const savePlan = () => {
    alert(`Plan "${planName}" saved with ${days.reduce((s, d) => s + d.exercises.length, 0)} exercises!`);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-white transition-all"
      >
        Open Plan Modal
      </button>

      <CreatePlanModal
        showCreatePlan={showModal}
        setShowCreatePlan={setShowModal}
        newPlanName={planName}
        setNewPlanName={setPlanName}
        planDays={days}
        setPlanDays={setDays}
        selectedDayIndex={selectedDay}
        setSelectedDayIndex={setSelectedDay}
        planSearch={search}
        setPlanSearch={setSearch}
        planResults={results}
        planLoading={loading}
        planTotalCount={mockExercises.length}
        planCurrentPage={1}
        planTotalPages={1}
        addToPlanDay={addExercise}
        removeFromPlanDay={removeExercise}
        reorderPlanDay={reorderExercises}
        saveNewPlan={savePlan}
        editingPlanId={null}
        onPlanPageChange={() => {}}
      />
    </div>
  );
}