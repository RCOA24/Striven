// src/components/workout/tabs/FavoritesTab.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';
import { ExerciseModal } from '../modals/ExerciseModal';

const NO_GIF = 'https://via.placeholder.com/400x300/111/fff?text=No+GIF';

export const FavoritesTab = ({ fullFavorites, quickAdd }) => {
  const [modalState, setModalState] = useState({ isOpen: false, exercise: null });

  const openModal = (exercise) => {
    setModalState({ isOpen: true, exercise });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, exercise: null });
  };

  if (!fullFavorites || fullFavorites.length === 0) {
    return (
      <div className="text-center py-32">
        <p className="text-5xl font-bold text-white/50 mb-4">No favorites yet</p>
        <p className="text-2xl text-white/30">Tap ❤️ on any exercise to save it here!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {fullFavorites.map((item) => (
          <motion.div
            key={item.exerciseId || item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal(item)}
            className="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-white/10 hover:border-emerald-500 cursor-pointer shadow-2xl relative group"
          >
            <div className="relative">
              <img
                src={item.gifUrl || NO_GIF}
                alt={item.name}
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.src = NO_GIF; }}
              />
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md rounded-full p-2">
                <Heart className="w-8 h-8 text-rose-500 fill-current" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="p-6">
              <h3 className="font-bold text-2xl text-emerald-300 line-clamp-2 mb-2">
                {item.name}
              </h3>
              <p className="text-white/60 text-sm mb-4">{item.muscles || 'Full Body'}</p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  quickAdd(item);
                  toast.success(`✅ ${item.name} added!`, {
                    icon: '💪',
                    style: { background: '#10b981', color: 'white' }
                  });
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-4 rounded-2xl font-bold text-black shadow-lg hover:shadow-emerald-500/50 transition-all"
              >
                Quick Add 💪
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* MODAL NOW WORKS 100% */}
      <ExerciseModal
        isOpen={modalState.isOpen}
        exercise={modalState.exercise}
        onClose={closeModal}
        onQuickAdd={quickAdd}
      />
    </>
  );
};