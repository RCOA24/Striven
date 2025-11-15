import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Loader2, X, Plus, ChevronLeft, ChevronRight, TrendingUp, AlertCircle
} from 'lucide-react';
import { SafeExerciseImage } from './SafeExerciseImage';

/**
 * Enhanced search results component with pagination
 * Displays exercise search results with add functionality
 */
export const SearchResults = ({
  search, setSearch, results, totalCount,
  currentPage, totalPages, loading, onAdd, onPageChange
}) => {
  const inputRef = useRef(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  useEffect(() => { 
    setTimeout(() => inputRef.current?.focus(), 100); 
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 bg-gradient-to-b from-black/40 to-transparent">
      {/* ═══ COMPACT SEARCH BAR ═══ */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-xl border-b border-white/10">
        <div className="relative">
          <Search className={`
            absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors
            ${searchFocused ? 'text-emerald-400' : 'text-white/40'}
          `} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="
              w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg
              bg-white/10 border border-white/20
              focus:border-emerald-500 focus:bg-white/15
              focus:ring-2 focus:ring-emerald-500/20
              transition-all duration-200 outline-none
              text-white placeholder-white/40 font-medium text-sm
            "
          />
          {search && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white/60" />
            </motion.button>
          )}
        </div>

        {/* Compact Results Info */}
        {search && !loading && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/60 px-0.5">
            <span>{results.length} of {totalCount}</span>
            {totalPages > 1 && (
              <span className="text-emerald-400 font-medium">
                Page {currentPage}/{totalPages}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══ RESULTS LIST ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {loading && results.length === 0 ? (
          <div className="space-y-2 p-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 animate-pulse">
                <div className="w-12 h-12 bg-white/10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : search.trim() === '' ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Search Exercises
            </h3>
            <p className="text-xs text-white/50">
              10,000+ exercises available
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              No Results
            </h3>
            <p className="text-xs text-white/50">
              Try different keywords
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 p-2 pb-20">
            {results.map((ex, i) => (
              <motion.button
                key={`${ex.id}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAdd(ex)}
                className="
                  w-full flex items-center gap-2.5 p-2.5 rounded-lg
                  bg-white/5 active:bg-emerald-500/10
                  border border-white/10 active:border-emerald-500/30
                  transition-all text-left
                "
              >
                <SafeExerciseImage
                  src={ex.gifUrl}
                  alt={ex.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/10"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-white truncate">
                    {ex.name}
                  </h4>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">
                    <span className="text-emerald-400">{ex.muscles}</span>
                  </p>
                </div>

                <Plus className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ COMPACT PAGINATION ═══ */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 bg-gradient-to-t from-black to-black/80 p-2 border-t border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="
                p-2 rounded-lg bg-white/10 active:bg-white/20
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all border border-white/20
              "
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg min-w-[60px] text-center">
              <span className="text-xs font-bold text-emerald-300">
                {currentPage}/{totalPages}
              </span>
            </div>
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="
                p-2 rounded-lg bg-white/10 active:bg-white/20
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all border border-white/20
              "
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
