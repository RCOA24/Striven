import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ExerciseModal } from '../modals/ExerciseModal';

const NO_GIF = 'https://via.placeholder.com/400x300/111/fff?text=No+GIF';

export const FavoritesTab = ({ fullFavorites, quickAdd }) => {
  const [modal, setModal] = useState(false);
  const [ex, setEx] = useState(null);

  if (!fullFavorites || fullFavorites.length === 0) {
    return (
      <div className="text-center py-32">
        <p className="text-4xl text-white/50">No favorites yet</p>
        <p className="text-2xl text-white/30 mt-4">Tap ❤️ on any exercise!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {fullFavorites.map(item => (
          <motion.div
            key={item.exerciseId || item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEx(item); setModal(true); }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-white/10 hover:border-emerald-500 cursor-pointer shadow-2xl"
          >
            <img 
              src={item.gifUrl || NO_GIF} 
              alt={item.name}
              className="w-full h-48 object-cover"
              onError={e => e.target.src = NO_GIF}
            />
            <div className="p-5">
              <h3 className="font-bold text-xl text-emerald-300 line-clamp-2">{item.name}</h3>
              <p className="text-sm text-white/60">{item.muscles}</p>
              <button
                onClick={(e) => { e.stopPropagation(); quickAdd(item); }}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 py-3 rounded-xl font-bold"
              >
                Quick Add
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <ExerciseModal isOpen={modal} exercise={ex} onClose={() => setModal(false)} onQuickAdd={quickAdd} />
    </>
  );
};