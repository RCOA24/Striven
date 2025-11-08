// src/components/workout/tabs/FavoritesTab.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Heart, Plus, Sparkles, Search, X, TrendingUp, Zap } from 'lucide-react';

// CORRECT: Default import (no curly braces)
import ExerciseModal from '../modals/ExerciseModal';

const NO_GIF = 'https://via.placeholder.com/400x300/111/fff?text=No+GIF';

const FavoriteCard = ({ item, onOpenModal, onQuickAdd, onUnfavorite }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      onClick={() => onOpenModal(item)}
      className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 to-gray-900/20 animate-pulse" />
        )}
        <img
          src={item.gifUrl || NO_GIF}
          alt={item.name}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => { 
            e.target.src = NO_GIF;
            setImageLoaded(true);
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {/* Heart Badge - NOW CLICKABLE TO UNFAVORITE */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onUnfavorite(item);
          }}
          className="absolute top-3 right-3 bg-black/80 backdrop-blur-md rounded-full p-2 shadow-lg hover:bg-black/90 transition-all z-10"
        >
          <Heart className="w-5 h-5 text-rose-500 fill-current" />
        </motion.button>

        {/* Hover Quick View */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm"
        >
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">View Details</p>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-white line-clamp-2 mb-2 group-hover:text-emerald-400 transition-colors">
          {item.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2 py-1 bg-emerald-500/20 rounded-full">
            <p className="text-emerald-400 text-xs font-semibold">{item.muscles || 'Full Body'}</p>
          </div>
          {item.equipment && (
            <div className="px-2 py-1 bg-white/10 rounded-full">
              <p className="text-white/60 text-xs truncate">{item.equipment}</p>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(item);
          }}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-3 rounded-xl font-bold text-white text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Quick Add 💪
        </motion.button>
      </div>
    </motion.div>
  );
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-20 max-w-lg mx-auto"
  >
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        repeatDelay: 2
      }}
      className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-full flex items-center justify-center"
    >
      <Heart className="w-16 h-16 text-rose-400" />
    </motion.div>
    
    <h3 className="text-3xl font-bold text-white mb-4">No Favorites Yet</h3>
    <p className="text-white/60 text-lg mb-8">
      Start building your personal collection by tapping the <Heart className="inline w-5 h-5 text-rose-500 fill-current" /> on any exercise
    </p>
    
    <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 rounded-xl p-6 border border-emerald-500/20">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-500/20 rounded-full flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-left">
          <h4 className="font-bold text-emerald-400 mb-2">Pro Tip</h4>
          <p className="text-sm text-white/70">
            Save your go-to exercises here for quick access during workouts. Perfect for building custom routines!
          </p>
        </div>
      </div>
    </div>
  </motion.div>
);

const FilterBar = ({ searchTerm, onSearchChange, totalCount }) => {
  return (
    <div className="bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-transparent rounded-2xl p-5 border border-emerald-500/20 mb-8">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Heart className="w-5 h-5 text-emerald-400 fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Favorite Exercises</h2>
            <p className="text-white/60 text-sm">{totalCount} saved exercise{totalCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none text-white placeholder-white/40"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const FavoritesTab = ({ fullFavorites, quickAdd, toggleFavorite }) => {
  const [modalState, setModalState] = useState({ isOpen: false, exercise: null });
  const [searchTerm, setSearchTerm] = useState('');

  const openModal = (exercise) => {
    setModalState({ isOpen: true, exercise });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, exercise: null });
  };

  const handleQuickAdd = (item) => {
    quickAdd(item);
    toast.success(`✅ ${item.name} added!`, {
      icon: '💪',
      style: { background: '#10b981', color: 'white' }
    });
  };

  const handleUnfavorite = (item) => {
    console.log('🔍 Unfavoriting item:', item); // Debug log
    console.log('🔍 Item ID:', item.exerciseId || item.id); // Debug log
    
    if (toggleFavorite) {
      toggleFavorite(item);
      toast.success(`💔 Removed from favorites`, {
        icon: '👋',
        style: { background: '#ef4444', color: 'white' }
      });
    } else {
      console.error('❌ toggleFavorite function not provided!');
      toast.error('Unable to remove favorite', {
        style: { background: '#ef4444', color: 'white' }
      });
    }
  };

  // Filter favorites based on search
  const filteredFavorites = fullFavorites?.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.muscles?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!fullFavorites || fullFavorites.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <FilterBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCount={fullFavorites.length}
      />

      {filteredFavorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Search className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <p className="text-xl text-white/50">No matches found</p>
          <p className="text-white/30 mt-2">Try different keywords</p>
        </motion.div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-cyan-950/20 to-blue-950/20 rounded-xl p-5 border border-cyan-500/20"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Quick Tip</p>
                <p className="text-white font-semibold">Tap any card to view details • Click ❤️ to unfavorite</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs">Showing</p>
              <p className="text-emerald-400 font-bold text-lg">{filteredFavorites.length} of {fullFavorites.length}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* MODAL WITH UNFAVORITE SUPPORT */}
      <ExerciseModal
        isOpen={modalState.isOpen}
        exercise={modalState.exercise}
        onClose={closeModal}
        onQuickAdd={quickAdd}
        toggleFavorite={toggleFavorite}
      />
    </>
  );
};