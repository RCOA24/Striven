import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Edit2, Trash2, Dumbbell, Calendar, TrendingUp, ChevronRight, Zap, Target } from 'lucide-react';
import { useState } from 'react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, planName }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-500/20 rounded-full flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Plan?</h3>
              <p className="text-white/70 text-sm">
                Are you sure you want to delete <span className="font-semibold text-white">"{planName}"</span>? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-all active:scale-95"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const PlanCard = ({ plan, isActive, onActivate, onEdit, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const totalExercises = plan.days.reduce((sum, d) => sum + d.exercises.length, 0);
  const activeDays = plan.days.filter(d => d.exercises.length > 0).length;

  const handleDelete = () => {
    setShowDeleteModal(false);
    onDelete(plan.id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -4 }}
        className={`relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border transition-all ${
          isActive 
            ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/20' 
            : 'border-white/10 hover:border-emerald-500/30'
        }`}
      >
        {/* Active Badge */}
        {isActive && (
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute top-4 right-4 z-10"
          >
            <div className="bg-emerald-500 text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
              <Check className="w-4 h-4" />
              Active
            </div>
          </motion.div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2 pr-20">{plan.name}</h3>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-emerald-400">
                <Dumbbell className="w-4 h-4" />
                <span className="font-semibold">{totalExercises}</span>
                <span className="text-white/60">exercises</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">{activeDays}</span>
                <span className="text-white/60">active days</span>
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {plan.days.map((day, i) => {
              const hasExercises = day.exercises.length > 0;
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className={`relative rounded-lg p-3 text-center transition-all ${
                    hasExercises
                      ? 'bg-emerald-500/20 border border-emerald-500/40'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className={`text-xs font-bold mb-1 ${
                    hasExercises ? 'text-emerald-400' : 'text-white/40'
                  }`}>
                    {DAYS_OF_WEEK[i]}
                  </div>
                  <div className={`text-sm font-bold ${
                    hasExercises ? 'text-white' : 'text-white/30'
                  }`}>
                    {day.exercises.length || '—'}
                  </div>
                  {hasExercises && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isActive && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onActivate(plan.id)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Zap className="w-4 h-4" />
                Activate Plan
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEdit(plan)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-white/20 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteModal(true)}
              className="bg-white/10 hover:bg-red-500/20 text-red-400 px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center border border-white/20 hover:border-red-500/40 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Gradient Overlay */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        )}
      </motion.div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        planName={plan.name}
      />
    </>
  );
};

const EmptyState = ({ onCreate }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-20"
  >
    <motion.div
      animate={{ 
        rotate: [0, -10, 10, -10, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3
      }}
      className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl flex items-center justify-center"
    >
      <Dumbbell className="w-12 h-12 text-emerald-400" />
    </motion.div>
    
    <h3 className="text-2xl font-bold text-white mb-3">No Workout Plans Yet</h3>
    <p className="text-white/60 mb-8 max-w-md mx-auto">
      Create your first customized workout plan to start tracking your fitness journey
    </p>
    
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onCreate}
      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-3 mx-auto"
    >
      <Plus className="w-6 h-6" />
      Create Your First Plan
    </motion.button>
  </motion.div>
);

export const PlansTab = ({ plans, activePlan, activatePlan, openEditPlan, deletePlan, setShowCreatePlan }) => {
  const sortedPlans = [...plans].sort((a, b) => {
    // Active plan first
    if (activePlan?.id === a.id) return -1;
    if (activePlan?.id === b.id) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-transparent rounded-2xl p-6 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Target className="w-8 h-8 text-emerald-400" />
              Workout Plans
            </h2>
            <p className="text-white/60">
              {plans.length > 0 
                ? `${plans.length} plan${plans.length !== 1 ? 's' : ''} created`
                : 'Create and manage your workout routines'
              }
            </p>
          </div>
        </div>

        {/* Create Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            console.log('PlansTab: Create New Plan clicked');
            openEditPlan({ id: null, name: '', days: [] });
            // fallback: ensure modal is shown if parent setter was passed directly
            try { setShowCreatePlan?.(true); } catch { /* noop */ }
          }}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-xl p-6 text-white font-bold text-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-3"
        >
          <Plus className="w-6 h-6" />
          Create New Plan
          <ChevronRight className="w-5 h-5 ml-auto" />
        </motion.button>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <EmptyState onCreate={() => {
          console.log('PlansTab: EmptyState Create button clicked');
          openEditPlan({ id: null, name: '', days: [] });
          try { setShowCreatePlan?.(true); } catch { /* noop */ }
        }} />
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

      {/* Tips Section */}
      {plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-cyan-950/20 to-blue-950/20 rounded-xl p-5 border border-cyan-500/20"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-bold text-cyan-400 mb-1">Pro Tip</h4>
              <p className="text-sm text-white/70">
                Activate a plan to track your workouts and monitor progress. You can switch between plans anytime!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};