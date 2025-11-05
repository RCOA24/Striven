// pages/ExerciseLibrary.jsx

import React from 'react';

const exercises = [
  {
    id: 1,
    name: "Push-Up",
    imageUrl: "https://via.placeholder.com/128x128?text=Push-Up",
    category: "Strength",
    description: "Classic upper body move targeting chest, shoulders, and triceps."
  },
  {
    id: 2,
    name: "Bodyweight Squat",
    imageUrl: "https://via.placeholder.com/128x128?text=Squat",
    category: "Legs",
    description: "Lower body move for quads, hamstrings, and glutes."
  },
];


export default function ExerciseLibrary() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-emerald-900 px-4 py-6">
      <h2 className="text-3xl font-bold text-white mb-4">🏋️ Exercise Library</h2>
      {/* Category filter row */}
      <div className="flex overflow-x-auto mb-6 space-x-2">
        <button className="bg-white/20 px-4 py-2 rounded-full text-white">All</button>
        <button className="bg-white/10 px-4 py-2 rounded-full text-white">Strength</button>
        <button className="bg-white/10 px-4 py-2 rounded-full text-white">Legs</button>
        <button className="bg-white/10 px-4 py-2 rounded-full text-white">Cardio</button>
        {/* Add more categories */}
      </div>
      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {exercises.map(ex => (
          <div
            key={ex.id}
            className="bg-white/10 rounded-2xl shadow-lg p-4 flex flex-col items-center transition-transform hover:scale-105"
          >
            <img src={ex.imageUrl} alt={ex.name}
              className="w-32 h-32 object-cover rounded-xl mb-4 shadow-md bg-white/20" />
            <h3 className="text-xl font-semibold text-white mb-2">{ex.name}</h3>
            <span className="bg-emerald-500/20 px-4 py-1 rounded-full text-white text-xs mb-2">{ex.category}</span>
            <p className="text-white/70 text-sm text-center">{ex.description}</p>
            <button className="mt-3 bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2 rounded-xl text-white font-bold shadow-lg">
              Start Exercise
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
