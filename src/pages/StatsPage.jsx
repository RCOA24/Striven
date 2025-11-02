import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TrendingUp, Award, Target, Zap, Calendar, Edit2, Trash2, Save, X } from 'lucide-react';
import { db } from '../utils/db';

const StatCard = ({ icon: Icon, label, value, change, gradient }) => (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
          change > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
          <span className="text-xs font-medium">{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-white/60 font-medium">{label}</div>
  </div>
);

const ProgressBar = ({ label, current, goal, color, onEdit, onDelete }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-white">{current.toLocaleString()} / {goal.toLocaleString()}</span>
          {onEdit && (
            <div className="flex space-x-1">
              <button
                onClick={onEdit}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Edit goal"
              >
                <Edit2 className="w-3 h-3 text-white/60 hover:text-blue-400" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Delete goal"
              >
                <Trash2 className="w-3 h-3 text-white/60 hover:text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {percentage >= 100 && (
        <div className="text-xs text-green-400 mt-1 flex items-center space-x-1">
          <Award className="w-3 h-3" />
          <span>Goal achieved! 🎉</span>
        </div>
      )}
    </div>
  );
};

const GoalEditModal = ({ goal, onSave, onClose }) => {
  const [value, setValue] = useState(goal.value);

  const handleSave = () => {
    if (value > 0) {
      onSave({ ...goal, value: Number(value) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Edit2 className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Edit Goal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/80 mb-2">
            {goal.label}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
            placeholder="Enter goal value"
            min="1"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteGoalModal = ({ goal, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/20 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-500/20 p-3 rounded-xl">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Delete Goal?</h3>
        </div>
        
        <p className="text-white/70 mb-6">
          Are you sure you want to delete the "{goal.label}" goal? This will reset it to the default value.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const StatsPage = ({ weeklyStats = {}, activities = [] }) => {
  const { 
    totalSteps = 0, 
    totalDistance = 0, 
    totalCalories = 0, 
    activeDays = 0 
  } = weeklyStats;

  // Default goals
  const defaultGoals = {
    steps: 70000,
    distance: 50,
    calories: 2500
  };

  // Real-time goals from Dexie using useLiveQuery
  const goalsFromDb = useLiveQuery(
    () => db.goals.toArray(),
    []
  );

  // State for modals
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);

  // Get goal value by key
  const getGoalValue = (key) => {
    if (!goalsFromDb) return defaultGoals[key];
    const goal = goalsFromDb.find(g => g.key === key);
    return goal ? goal.value : defaultGoals[key];
  };

  // Handle goal edit
  const handleEditGoal = (goalKey, label, color) => {
    setEditingGoal({
      key: goalKey,
      label,
      color,
      value: getGoalValue(goalKey)
    });
  };

  // Handle goal save
  const handleSaveGoal = async (goal) => {
    try {
      // Check if goal exists
      const existingGoal = await db.goals.where('key').equals(goal.key).first();
      
      if (existingGoal) {
        // Update existing goal
        await db.goals.update(existingGoal.id, { value: goal.value });
      } else {
        // Create new goal
        await db.goals.add({
          key: goal.key,
          value: goal.value,
          createdAt: new Date().toISOString()
        });
      }
      
      setEditingGoal(null);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  // Handle goal delete
  const handleDeleteGoal = (goalKey, label) => {
    setDeletingGoal({ key: goalKey, label });
  };

  // Confirm goal deletion
  const confirmDeleteGoal = async () => {
    if (deletingGoal) {
      try {
        const goalToDelete = await db.goals.where('key').equals(deletingGoal.key).first();
        if (goalToDelete) {
          await db.goals.delete(goalToDelete.id);
        }
        setDeletingGoal(null);
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate personal bests
  const personalBests = React.useMemo(() => {
    if (activities.length === 0) {
      return {
        mostSteps: 0,
        longestDistance: 0,
        mostStepsDate: 'N/A',
        longestDistanceDate: 'N/A',
      };
    }

    const mostStepsActivity = activities.reduce((max, a) => 
      (a.steps || 0) > (max.steps || 0) ? a : max
    , activities[0]);

    const longestDistanceActivity = activities.reduce((max, a) => 
      (a.distance || 0) > (max.distance || 0) ? a : max
    , activities[0]);

    return {
      mostSteps: mostStepsActivity.steps || 0,
      longestDistance: longestDistanceActivity.distance || 0,
      mostStepsDate: formatDate(mostStepsActivity.date),
      longestDistanceDate: formatDate(longestDistanceActivity.date),
    };
  }, [activities]);

  // Get current goal values
  const goals = {
    steps: getGoalValue('steps'),
    distance: getGoalValue('distance'),
    calories: getGoalValue('calories')
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-2xl shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Statistics</h1>
        </div>
        <p className="text-white/70 ml-14">Your progress and insights</p>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">This Week</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label="Total Steps"
            value={totalSteps >= 1000 ? `${(totalSteps / 1000).toFixed(1)}K` : totalSteps}
            gradient="from-green-500 to-emerald-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Distance"
            value={`${totalDistance.toFixed(1)} km`}
            gradient="from-blue-500 to-cyan-600"
          />
          <StatCard
            icon={Zap}
            label="Calories"
            value={Math.round(totalCalories).toLocaleString()}
            gradient="from-orange-500 to-red-600"
          />
          <StatCard
            icon={Award}
            label="Active Days"
            value={`${activeDays}/7`}
            gradient="from-purple-500 to-pink-600"
          />
        </div>
      </div>

      {/* Goals Progress */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Weekly Goals</h2>
          </div>
          <div className="text-xs text-white/50">Click edit to customize</div>
        </div>
        <ProgressBar 
          label="Steps Goal"
          current={Math.round(totalSteps)}
          goal={goals.steps}
          color="from-green-500 to-emerald-600"
          onEdit={() => handleEditGoal('steps', 'Steps Goal', 'from-green-500 to-emerald-600')}
          onDelete={() => handleDeleteGoal('steps', 'Steps Goal')}
        />
        <ProgressBar 
          label="Distance Goal (km)"
          current={parseFloat(totalDistance.toFixed(1))}
          goal={goals.distance}
          color="from-blue-500 to-cyan-600"
          onEdit={() => handleEditGoal('distance', 'Distance Goal (km)', 'from-blue-500 to-cyan-600')}
          onDelete={() => handleDeleteGoal('distance', 'Distance Goal')}
        />
        <ProgressBar 
          label="Calories Goal"
          current={Math.round(totalCalories)}
          goal={goals.calories}
          color="from-orange-500 to-red-600"
          onEdit={() => handleEditGoal('calories', 'Calories Goal', 'from-orange-500 to-red-600')}
          onDelete={() => handleDeleteGoal('calories', 'Calories Goal')}
        />
      </div>

      {/* Personal Bests */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Personal Bests</h2>
        </div>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <p>Complete your first activity to see personal bests!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center bg-white/5 rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-1">
                {personalBests.mostSteps.toLocaleString()}
              </div>
              <div className="text-sm text-white/60">Most Steps (Single Day)</div>
              <div className="text-xs text-green-400 mt-1">{personalBests.mostStepsDate}</div>
            </div>
            <div className="text-center bg-white/5 rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-1">
                {personalBests.longestDistance.toFixed(2)} km
              </div>
              <div className="text-sm text-white/60">Longest Distance</div>
              <div className="text-xs text-green-400 mt-1">{personalBests.longestDistanceDate}</div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <GoalEditModal
          goal={editingGoal}
          onSave={handleSaveGoal}
          onClose={() => setEditingGoal(null)}
        />
      )}

      {/* Delete Goal Modal */}
      {deletingGoal && (
        <DeleteGoalModal
          goal={deletingGoal}
          onConfirm={confirmDeleteGoal}
          onClose={() => setDeletingGoal(null)}
        />
      )}
    </div>
  );
};

export default StatsPage;