// src/components/ui/PRBadge.jsx
import { Trophy } from 'lucide-react';

export const PRBadge = ({ pr }) => {
  if (!pr || pr <= 0) return null;
  return (
    <div
      aria-label={`Personal record ${pr} kilograms`}
      role="status"
      className="group relative inline-flex items-center p-[2px] rounded-full
                 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500
                 shadow-[0_4px_20px_rgba(251,191,36,0.25)] sm:shadow-[0_8px_30px_rgba(251,191,36,0.35)]
                 transition-all duration-300 motion-safe:hover:-translate-y-0.5"
    >
      <div
        className="flex items-center gap-2 sm:gap-3 rounded-full
                   bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md
                   ring-1 ring-white/40 dark:ring-white/10
                   px-3 py-1.5 sm:px-5 sm:py-2.5 md:px-6 md:py-3"
      >
        <span
          className="inline-flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full
                     bg-gradient-to-br from-amber-300 to-amber-600
                     ring-1 ring-inset ring-white/30 shadow-inner
                     transition-transform duration-300 group-hover:scale-105"
        >
          <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-black/80 dark:text-black" />
        </span>

        <span className="flex items-baseline gap-1.5 sm:gap-2 font-extrabold tracking-tight">
          <span className="text-sm sm:text-base bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
            PR
          </span>
          <span className="text-black/60 dark:text-white/50">•</span>
          <span className="text-base sm:text-lg md:text-2xl text-black dark:text-white">
            {pr}
            <span className="ml-0.5 sm:ml-1 text-xs sm:text-sm md:text-base text-black/60 dark:text-white/60">kg</span>
          </span>
        </span>
      </div>

      {/* Subtle outline and ambient glow */}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20 dark:ring-white/10" />
      <span className="pointer-events-none absolute -inset-1 rounded-full blur-xl sm:blur-2xl opacity-20 sm:opacity-30
                       bg-gradient-to-r from-amber-400/25 via-yellow-300/20 to-orange-500/25" />
    </div>
  );
};