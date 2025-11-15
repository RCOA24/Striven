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
    <div className="flex flex-col h-full min-h-0 relative z-10 overflow-hidden">
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
      <div className="flex-1 overflow-y-auto px-2 pb-20 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent min-h-0 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
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
