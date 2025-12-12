import React from 'react';

const BMIIndicator = ({ height, weight }) => {
  const heightM = parseFloat(height) / 100;
  const bmi = parseFloat(weight) / (heightM * heightM);
  
  let bmiCategory = 'Normal';
  let bmiColor = 'text-emerald-400';
  
  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = 'text-blue-400';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Overweight';
    bmiColor = 'text-yellow-400';
  } else if (bmi >= 30) {
    bmiCategory = 'Obese';
    bmiColor = 'text-orange-400';
  }
  
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-zinc-500">Body Mass Index</p>
        <p className={`text-sm font-bold ${bmiColor}`}>
          {bmi.toFixed(1)} - {bmiCategory}
        </p>
      </div>
      <div className="text-xs text-zinc-600">
        Height: {height}cm • Weight: {weight}kg
      </div>
    </div>
  );
};

export default BMIIndicator;
