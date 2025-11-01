import React from 'react';

const StepCounter = ({ steps }) => {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
      <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-2">
        Steps Today
      </h2>
      <div className="text-6xl font-bold text-primary mb-2">
        {steps.toLocaleString()}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
        <div
          className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300"
          style={{ width: `${Math.min((steps / 10000) * 100, 100)}%` }}
        />
      </div>
      <p className="text-gray-500 text-sm mt-2">Goal: 10,000 steps</p>
    </div>
  );
};

export default StepCounter;
