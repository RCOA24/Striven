import { CheckCircle2 } from 'lucide-react';

export const SetLogger = ({ exercise, sets = 4, history, onLogSet }) => {
  const exId = exercise.exerciseId || exercise.id;
  const today = new Date().toISOString().split('T')[0];
  const logs = history.logs || [];

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-amber-400">🏆</span> Log Sets
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {[...Array(sets)].map((_, i) => {
          const log = logs.find(l => l.set === i + 1 && l.date === today);
          return (
            <button
              key={i}
              onClick={() => onLogSet(exId, i)}
              className={`py-5 rounded-2xl font-bold text-xl transition-all ${
                log
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {log ? (
                <>✓ {log.weight}kg × {log.reps} {log.oneRm > history.pr ? '🏆 NEW PR!' : ''}</>
              ) : (
                `Set ${i + 1}`
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};