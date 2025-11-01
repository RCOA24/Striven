import React from 'react';
import { Calendar, Footprints, Clock, Flame, TrendingUp } from 'lucide-react';

const ActivityCard = ({ date, steps, distance, calories, duration }) => (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/30 transition-all hover:scale-102 transform duration-200">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-xl">
          <Footprints className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Walking</h3>
          <p className="text-sm text-white/60">{date}</p>
        </div>
      </div>
      <div className="bg-green-500/20 px-3 py-1 rounded-full">
        <span className="text-sm font-medium text-green-300">Completed</span>
      </div>
    </div>
    
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white/5 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Footprints className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-white/60">Steps</span>
        </div>
        <p className="text-xl font-bold text-white">{steps.toLocaleString()}</p>
      </div>
      
      <div className="bg-white/5 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-1">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/60">Distance</span>
        </div>
        <p className="text-xl font-bold text-white">{distance} km</p>
      </div>
      
      <div className="bg-white/5 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-white/60">Calories</span>
        </div>
        <p className="text-xl font-bold text-white">{calories}</p>
      </div>
      
      <div className="bg-white/5 rounded-xl p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Clock className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-white/60">Time</span>
        </div>
        <p className="text-xl font-bold text-white">{duration}</p>
      </div>
    </div>
  </div>
);

const ActivityPage = ({ activities = [] }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-2xl shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Activity History</h1>
        </div>
        <p className="text-white/70 ml-14">Your recent walking sessions</p>
      </div>

      {/* Activity List */}
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} {...activity} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20">
          <div className="bg-white/5 p-6 rounded-full w-fit mx-auto mb-4">
            <Calendar className="w-12 h-12 text-white/40" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Activities Yet</h2>
          <p className="text-white/60">Start tracking to see your activity history here</p>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;