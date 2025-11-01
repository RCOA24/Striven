import React from 'react';
import { Footprints, Flame, Clock } from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, gradient }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl blur-sm group-hover:blur-md transition-all"></div>
    <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/30 transition-all hover:scale-105 transform duration-200">
      <div className={`bg-gradient-to-br ${gradient} p-3 rounded-xl mb-3 w-fit shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/60 font-medium">{label}</div>
    </div>
  </div>
);

const MetricsDisplay = ({ distance, calories, formattedTime }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <MetricCard 
        icon={Footprints} 
        label="Distance" 
        value={`${distance.toFixed(2)} km`}
        gradient="from-blue-500 to-cyan-600"
      />
      <MetricCard 
        icon={Flame} 
        label="Calories" 
        value={`${calories.toFixed(0)}`}
        gradient="from-orange-500 to-red-600"
      />
      <MetricCard 
        icon={Clock} 
        label="Active Time" 
        value={formattedTime}
        gradient="from-purple-500 to-pink-600"
      />
    </div>
  );
};

export default MetricsDisplay;