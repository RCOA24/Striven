import { motion } from 'framer-motion';
import { Save } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gradient-to-br from-black/95 via-emerald-950/60 to-black/95 rounded-3xl p-8 max-w-md w-full border border-emerald-500/40 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <h3 className="text-3xl font-extrabold text-white mb-2">Log Set {loggingSet.setIndex + 1}</h3>
          <p className="text-emerald-400 font-bold">{exercise?.name}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm text-white/60 ml-1">Weight (kg)</label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              className="w-full px-6 py-5 rounded-2xl bg-white/10 border-2 border-emerald-500/50 text-3xl text-center font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-white/60 ml-1">Reps</label>
            <input
              type="number"
              placeholder="e.g. 8"
              value={repInput}
              onChange={e => setRepInput(e.target.value)}
              className="w-full px-6 py-5 rounded-2xl bg-white/10 border-2 border-emerald-500/50 text-3xl text-center font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none transition-all"
            />
          </div>

          {estimated1RM > 0 && (
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-2xl p-6 border border-amber-500/40">
              <p className="text-sm text-amber-300 mb-1">Estimated 1RM</p>
              <p className="text-5xl font-black text-white">{estimated1RM}kg</p>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={saveLog} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 py-5 rounded-2xl font-bold text-xl text-black shadow-xl hover:shadow-emerald-500/50 transition-all">
              <Save className="w-7 h-7 inline mr-2" /> Save Set
            </button>
            <button onClick={onClose} className="px-8 py-5 bg-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};