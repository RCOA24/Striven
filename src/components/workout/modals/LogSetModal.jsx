import { motion } from 'framer-motion';
import { Save, Trophy, Zap, Target } from 'lucide-react';
import toast from 'react-hot-toast';

export const LogSetModal = ({ loggingSet, exercise, weightInput, setWeightInput, repInput, setRepInput, saveLog, onClose }) => {
  const estimated1RM = weightInput && repInput
    ? (parseFloat(weightInput) * (1 + parseInt(repInput) / 30)).toFixed(1)
    : 0;

  if (!loggingSet) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 100 }}
        className="bg-gradient-to-br from-black via-emerald-950/80 to-black rounded-3xl p-8 max-w-lg w-full border-4 border-emerald-500/60 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏋️‍♂️</div>
          <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-2">
            Log Set {loggingSet.setIndex + 1}
          </h3>
          <p className="text-2xl font-bold text-emerald-300">{exercise?.name}</p>
        </div>

        <div className="space-y-8">
          <div>
            <label className="text-lg text-emerald-300 font-bold flex items-center gap-3 mb-3">
              <Zap className="w-7 h-7" /> Weight (kg)
            </label>
            <input
              type="number"
              placeholder="100"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              className="w-full px-8 py-6 rounded-2xl bg-white/10 border-4 border-emerald-500/50 text-5xl text-center font-black text-emerald-300 focus:border-emerald-300 focus:outline-none transition-all placeholder-white/30"
              autoFocus
            />
          </div>

          <div>
            <label className="text-lg text-emerald-300 font-bold flex items-center gap-3 mb-3">
              <Target className="w-7 h-7" /> Reps
            </label>
            <input
              type="number"
              placeholder="8"
              value={repInput}
              onChange={e => setRepInput(e.target.value)}
              className="w-full px-8 py-6 rounded-2xl bg-white/10 border-4 border-emerald-500/50 text-5xl text-center font-black text-emerald-300 focus:border-emerald-300 focus:outline-none transition-all placeholder-white/30"
            />
          </div>

          {estimated1RM > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-3xl p-8 border-4 border-amber-500/60 text-center"
            >
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <p className="text-2xl text-amber-300 font-bold mb-2">Estimated 1RM</p>
              <p className="text-7xl font-black text-white">{estimated1RM}kg</p>
            </motion.div>
          )}

          <div className="flex gap-6">
            <button 
              onClick={saveLog} 
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-6 rounded-2xl font-bold text-3xl text-black shadow-2xl hover:shadow-emerald-500/80 transition-all hover:scale-105 flex items-center justify-center gap-4"
            >
              <Save className="w-10 h-10" /> SAVE SET
            </button>
            <button 
              onClick={onClose} 
              className="px-10 py-6 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-2xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};