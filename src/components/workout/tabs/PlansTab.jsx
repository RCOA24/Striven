import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Edit2, Trash2, Dumbbell, Calendar, TrendingUp, ChevronRight, Zap, Target, X } from 'lucide-react';
import { useState, useMemo, memo, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Hook to lock body scroll when modal is open ---
const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isLocked]);
};

// --- Optimized Modal using Portal ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, planName }) => {
  useBodyScrollLock(isOpen);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="relative w-full max-w-md bg-[#1c1c1e] rounded-3xl overflow-hidden border border-white/10 shadow-2xl z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-500/10 rounded-2xl flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Delete Plan?</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-white">"{planName}"</span>? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98]"
                >
                  Delete Plan
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// --- Memoized Plan Card to prevent unnecessary re-renders ---
const PlanCard = memo(({ plan, isActive, onActivate, onEdit, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Memoize stats calculations
  const { totalExercises, activeDays } = useMemo(() => ({
    totalExercises: plan.days.reduce((sum, d) => sum + d.exercises.length, 0),
    activeDays: plan.days.filter(d => d.exercises.length > 0).length
  }), [plan.days]);

  const handleDelete = () => {
    setShowDeleteModal(false);
    // Small delay to allow modal to close smoothly before item is removed from DOM
    setTimeout(() => onDelete(plan.id), 200);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`group relative bg-zinc-900/80 backdrop-blur-md rounded-3xl overflow-hidden border transition-all duration-300 transform-gpu ${
          isActive 
            ? 'border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]' 
            : 'border-white/5 hover:border-white/10 hover:bg-zinc-800/80'
        }`}
      >
        {/* Active Indicator */}
        {isActive && (
          <div className="absolute top-0 right-0 p-4 z-20">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              Active
            </motion.div>
          </div>
        )}

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="mb-6 relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 pr-20 line-clamp-1" title={plan.name}>
              {plan.name}
            </h3>
            
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/10">
                <Dumbbell className="w-3.5 h-3.5" />
                <span className="font-bold tabular-nums">{totalExercises}</span>
                <span className="text-emerald-400/70 text-xs uppercase tracking-wide">Ex</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-lg border border-cyan-400/10">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-bold tabular-nums">{activeDays}</span>
                <span className="text-cyan-400/70 text-xs uppercase tracking-wide">Days</span>
              </div>
            </div>
          </div>

          {/* Days Visualization */}
          <div className="grid grid-cols-7 gap-1.5 mb-6">
            {plan.days.map((day, i) => {
              const count = day.exercises.length;
              return (
                <div key={i} className="flex flex-col gap-1 group/day">
                  <div 
                    className={`h-10 sm:h-12 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                      count > 0
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-transparent text-white/20'
                    }`}
                  >
                    {count > 0 ? (
                      <span className="font-bold text-sm tabular-nums">{count}</span>
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                    )}
                  </div>
                  <span className={`text-[10px] text-center uppercase font-bold tracking-wider transition-colors ${
                    count > 0 ? 'text-emerald-500/80' : 'text-white/20'
                  }`}>
                    {DAYS_OF_WEEK[i].charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex gap-2 mt-auto">
            {!isActive && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onActivate(plan.id)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4 fill-current" />
                Activate
              </motion.button>
            )}
            
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onEdit(plan)}
              className={`flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors ${isActive ? 'w-full' : ''}`}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </motion.button>
            
            <motion.button
              aria-label="Delete plan"
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
              className="w-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        planName={plan.name}
      />
    </>
  );
});

// --- Empty State Component ---
const EmptyState = ({ onCreate }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="col-span-full flex flex-col items-center justify-center py-24 px-4 text-center bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed"
  >
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
      <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-3xl border border-white/10 shadow-2xl">
        <Dumbbell className="w-12 h-12 text-emerald-500" />
      </div>
    </div>
    
    <h3 className="text-2xl font-bold text-white mb-3">No Plans Created</h3>
    <p className="text-zinc-400 max-w-sm mb-8 leading-relaxed">
      Start your journey by creating a custom workout schedule tailored to your goals.
    </p>
    
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onCreate}
      className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-2xl font-bold text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
    >
      <Plus className="w-5 h-5 stroke-[3]" />
      Create First Plan
    </motion.button>
  </motion.div>
);

// --- Main Component ---
export const PlansTab = ({ plans, activePlan, activatePlan, openEditPlan, deletePlan, setShowCreatePlan }) => {
  // Memoize sorting to avoid calculation on every render
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      if (activePlan?.id === a.id) return -1;
      if (activePlan?.id === b.id) return 1;
      return 0;
    });
  }, [plans, activePlan]);

  // Handler for creating new plan
  const handleCreate = () => {
    if (openEditPlan) openEditPlan({ id: null, name: '', days: [] });
    if (setShowCreatePlan) setShowCreatePlan(true);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/20 via-zinc-900 to-zinc-900 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              My Plans
              <span className="text-sm bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-medium border border-white/5">
                {plans.length}
              </span>
            </h2>
            <p className="text-zinc-400">Manage your weekly routines and training splits</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            className="group bg-white/5 text-white px-6 py-3 rounded-xl font-bold text-sm border border-white/10 transition-all flex items-center gap-2 sm:w-auto w-full justify-center"
          >
            <Plus className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
            New Plan
          </motion.button>
        </div>
      </div>

      {/* Grid Layout with Pop Animation */}
      <div className="min-h-[400px]">
        {plans.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {sortedPlans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isActive={activePlan?.id === plan.id}
                  onActivate={activatePlan}
                  onEdit={openEditPlan}
                  onDelete={deletePlan}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Pro Tip Footer */}
      {plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl"
        >
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm text-blue-200/70">
            <span className="font-bold text-blue-400">Tip:</span> Activating a plan automatically queues your workouts on the Today tab based on the day of the week.
          </p>
        </motion.div>
      )}
    </div>
  );
};