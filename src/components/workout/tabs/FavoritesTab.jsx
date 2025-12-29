// src/components/favorites/FavoritesTab.jsx
import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Sparkles, Search, X, TrendingUp, Zap, Loader2 } from 'lucide-react';
import ExerciseModal from '../modals/ExerciseModal'; // Ensure path is correct

// ✅ FIX: Use local fallback GIF
const FALLBACK_GIF = '/fallback-exercise.gif';

/**
 * Memoized Favorite Card
 */
const FavoriteCard = memo(React.forwardRef(({ item, onOpenModal, onQuickAdd, onUnfavorite }, ref) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine image source priority: Preview > GIF > Local Fallback
  const displayImage = hasError 
    ? FALLBACK_GIF 
    : (item.previewImage || item.gifUrl || FALLBACK_GIF);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onClick={() => onOpenModal(item)}
      className="group relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/40 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 transform-gpu"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
        
        {/* Skeleton Loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 z-10">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin opacity-50" />
          </div>
        )}
        
        <img
          src={displayImage}
          alt={item.name}
          // loading="lazy"
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoad={() => setImageLoaded(true)}
          // ✅ CRITICAL FIX: Switch to local GIF on error
          onError={(e) => { 
            e.target.onerror = null; 
            if (!hasError) setHasError(true);
            setImageLoaded(true);
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Unfavorite Button */}
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onUnfavorite(item);
          }}
          className="absolute top-3 right-3 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full p-2.5 transition-colors z-20 border border-white/10"
        >
          <Heart className="w-5 h-5 text-rose-500 fill-current" />
        </motion.button>

        {/* Hover Quick View Text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-semibold text-sm">View Details</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col h-[160px]">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white leading-tight line-clamp-2 mb-3 group-hover:text-emerald-400 transition-colors">
            {item.name}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-wide">
              {item.muscles || 'Full Body'}
            </span>
            {item.equipment && (
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-400 text-xs font-medium truncate max-w-[120px]">
                {item.equipment}
              </span>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(item);
          }}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Quick Add 
        </motion.button>
      </div>
    </motion.div>
  );
}));

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-24 max-w-lg mx-auto px-4"
  >
    <div className="relative w-32 h-32 mx-auto mb-8">
      <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full animate-pulse" />
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full w-full h-full flex items-center justify-center border border-white/10 shadow-2xl"
      >
        <Heart className="w-14 h-14 text-rose-500 fill-rose-500/20" />
      </motion.div>
    </div>
    
    <h3 className="text-3xl font-bold text-white mb-3">No Favorites Yet</h3>
    <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
      Start building your collection by tapping the <Heart className="inline w-5 h-5 text-rose-500 fill-current mx-1" /> on any exercise.
    </p>
    
    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5 text-left">
      <div className="flex gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-xl h-fit">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h4 className="font-bold text-white mb-1">Pro Tip</h4>
          <p className="text-sm text-zinc-400">
            Save your go-to exercises here for instant access during workouts. It's perfect for building custom routines quickly!
          </p>
        </div>
      </div>
    </div>
  </motion.div>
);

const FilterBar = memo(({ searchTerm, onSearchChange, totalCount }) => {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-6 border border-white/5 mb-8">
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="p-3 bg-rose-500/10 rounded-2xl">
            <Heart className="w-6 h-6 text-rose-500 fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Favorites</h2>
            <p className="text-zinc-400 text-sm font-medium">{totalCount} saved items</p>
          </div>
        </div>

        <div className="relative w-full sm:max-w-xs group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-black/40 border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none text-white placeholder-zinc-600 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export const FavoritesTab = ({ fullFavorites, quickAdd, toggleFavorite, showToast }) => {
  const [modalState, setModalState] = useState({ isOpen: false, exercise: null });
  const [searchTerm, setSearchTerm] = useState('');

  const openModal = useCallback((exercise) => {
    setModalState({ isOpen: true, exercise });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, exercise: null });
  }, []);

  const handleQuickAdd = useCallback((item) => {
    quickAdd(item);
  }, [quickAdd]);

  const handleUnfavorite = useCallback((item) => {
    if (toggleFavorite) {
      toggleFavorite(item);
    }
  }, [toggleFavorite]);

  const filteredFavorites = useMemo(() => {
    if (!searchTerm) return fullFavorites || [];
    const lowerTerm = searchTerm.toLowerCase();
    return fullFavorites?.filter(item => 
      item.name?.toLowerCase().includes(lowerTerm) ||
      item.muscles?.toLowerCase().includes(lowerTerm)
    ) || [];
  }, [fullFavorites, searchTerm]);

  if (!fullFavorites || fullFavorites.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen pb-20">
      <FilterBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCount={fullFavorites.length}
      />

      {filteredFavorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <Search className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-xl font-bold text-white mb-1">No matches found</p>
          <p className="text-zinc-500">Try searching for a different muscle group or exercise</p>
        </motion.div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredFavorites.map((item) => (
              <FavoriteCard
                key={item.exerciseId || item.id}
                item={item}
                onOpenModal={openModal}
                onQuickAdd={handleQuickAdd}
                onUnfavorite={handleUnfavorite}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Quick Stats Footer */}
      {filteredFavorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-sm text-blue-200/80 font-medium">
              <span className="text-blue-400 font-bold">Tip:</span> Tap cards for details or use <span className="inline-block border border-blue-400/30 rounded px-1 text-[10px] font-bold">QUICK ADD</span> to build today's workout.
            </p>
          </div>
          <div className="text-xs font-bold text-blue-400/60 uppercase tracking-wider whitespace-nowrap">
            Showing {filteredFavorites.length} of {fullFavorites.length}
          </div>
        </motion.div>
      )}

      <ExerciseModal
        isOpen={modalState.isOpen}
        exercise={modalState.exercise}
        onClose={closeModal}
        onQuickAdd={quickAdd}
        toggleFavorite={toggleFavorite}
        showToast={showToast}
      />
    </div>
  );
};