import React from 'react';
import { TrendingUp, Award, Target, Zap, Calendar } from 'lucide-react';

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

const ProgressBar = ({ label, current, goal, color }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <span className="text-sm font-bold text-white">{current.toLocaleString()} / {goal.toLocaleString()}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const StatsPage = ({ weeklyStats = {}, activities = [] }) => {
  const { totalSteps = 0, totalDistance = 0, totalCalories = 0, activeDays = 0 } = weeklyStats;

  // Calculate personal bests
  const personalBests = {
    mostSteps: activities.length > 0 ? Math.max(...activities.map(a => a.steps)) : 0,
    longestDistance: activities.length > 0 ? Math.max(...activities.map(a => a.distance)) : 0,
    mostStepsDate: activities.length > 0 ? activities.reduce((max, a) => a.steps > max.steps ? a : max, activities[0])?.date : 'N/A',
    longestDistanceDate: activities.length > 0 ? activities.reduce((max, a) => a.distance > max.distance ? a : max, activities[0])?.date : 'N/A',
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
            value={totalCalories.toLocaleString()}
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
        <div className="flex items-center space-x-2 mb-6">
          <Target className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">Weekly Goals</h2>
        </div>
        <ProgressBar 
          label="Steps Goal"
          current={totalSteps}
          goal={70000}
          color="from-green-500 to-emerald-600"
        />
        <ProgressBar 
          label="Distance Goal"
          current={totalDistance}
          goal={50}
          color="from-blue-500 to-cyan-600"
        />
        <ProgressBar 
          label="Calories Goal"
          current={totalCalories}
          goal={2500}
          color="from-orange-500 to-red-600"
        />
      </div>

      {/* Personal Bests */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Personal Bests</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="text-center bg-white/5 rounded-xl p-4">
            <div className="text-3xl font-bold text-white mb-1">{personalBests.mostSteps.toLocaleString()}</div>
            <div className="text-sm text-white/60">Most Steps (Single Day)</div>
            <div className="text-xs text-green-400 mt-1">{personalBests.mostStepsDate}</div>
          </div>
          <div className="text-center bg-white/5 rounded-xl p-4">
            <div className="text-3xl font-bold text-white mb-1">{personalBests.longestDistance.toFixed(2)} km</div>
            <div className="text-sm text-white/60">Longest Distance</div>
            <div className="text-xs text-green-400 mt-1">{personalBests.longestDistanceDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;