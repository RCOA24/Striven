import React from 'react';

const MetricCard = ({ icon, label, value, unit }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4">
    <div className="text-4xl">{icon}</div>
    <div className="flex-1">
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-dark">
        {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
      </p>
    </div>
  </div>
);

const MetricsDisplay = ({ distance, calories, formattedTime }) => {
  return (
    <div className="grid grid-cols-1 gap-4 mb-6">
      <MetricCard 
        icon="📏" 
        label="Distance" 
        value={distance} 
        unit="km" 
      />
      <MetricCard 
        icon="🔥" 
        label="Calories" 
        value={calories} 
        unit="kcal" 
      />
      <MetricCard 
        icon="⏱️" 
        label="Active Time" 
        value={formattedTime} 
        unit="" 
      />
    </div>
  );
};

export default MetricsDisplay;
