// src/components/ui/PRBadge.jsx
import { Trophy } from 'lucide-react';

export const PRBadge = ({ pr }) => {
  if (!pr || pr <= 0) return null;
  return (
    <div className="inline-flex items-center gap-3 mt-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full px-6 py-3 shadow-2xl">
      <Trophy className="w-8 h-8 text-black" />
      <span className="text-2xl font-black text-black">PR: {pr}kg</span>
    </div>
  );
};