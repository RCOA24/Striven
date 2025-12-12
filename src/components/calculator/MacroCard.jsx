import React from 'react';

const MacroCard = ({ label, value, color, icon }) => (
  <div className="bg-[#1C1C1E] rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden group">
    <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
    <div className={`mb-2 p-2 rounded-full ${color} bg-opacity-20`}>
      {icon}
    </div>
    <span className="text-xl font-bold text-white mb-0.5">{value}</span>
    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{label}</span>
  </div>
);

export default MacroCard;
