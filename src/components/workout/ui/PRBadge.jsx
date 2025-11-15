// src/components/ui/PRBadge.jsx
import { Trophy } from 'lucide-react';

export const PRBadge = ({ pr }) => {
  if (!pr || pr <= 0) return null;
  return (
    <div
      aria-label={`Personal record ${pr} kilograms`}
      role="status"
      className="group relative inline-flex items-center p-[1px] sm:p-[2px] rounded-full
                 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500
                 shadow-[0_2px_15px_rgba(251,191,36,0.2)] sm:shadow-[0_4px_20px_rgba(251,191,36,0.25)] md:shadow-[0_8px_30px_rgba(251,191,36,0.35)]
                 transition-all duration-300 motion-safe:hover:-translate-y-0.5 max-w-full"
    >
      <div
        className="flex items-center gap-1.5 sm:gap-2 md:gap-3 rounded-full
                   bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md
                   ring-1 ring-white/40 dark:ring-white/10
                   px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3"
      >
        <span
          className="inline-flex h-6 w-6 sm:h-7 sm:w-7 md:h-10 md:w-10 items-center justify-center rounded-full
                     bg-gradient-to-br from-amber-300 to-amber-600
                     ring-1 ring-inset ring-white/30 shadow-inner
                     transition-transform duration-300 group-hover:scale-105 flex-shrink-0"
        >
          <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-6 md:w-6 text-black/80 dark:text-black" />
        </span>

        <span className="flex items-baseline gap-1 sm:gap-1.5 md:gap-2 font-extrabold tracking-tight whitespace-nowrap">
          <span className="text-xs sm:text-sm md:text-base bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
            PR
          </span>
          <span className="text-black/60 dark:text-white/50 hidden sm:inline">•</span>
          <span className="text-sm sm:text-base md:text-lg lg:text-2xl text-black dark:text-white">
            {pr}
            <span className="ml-0.5 text-[10px] sm:text-xs md:text-sm lg:text-base text-black/60 dark:text-white/60">kg</span>
          </span>
        </span>
      </div>

      {/* Subtle outline and ambient glow */}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20 dark:ring-white/10" />
      <span className="pointer-events-none absolute -inset-0.5 sm:-inset-1 rounded-full blur-lg sm:blur-xl md:blur-2xl opacity-15 sm:opacity-20 md:opacity-30
                       bg-gradient-to-r from-amber-400/25 via-yellow-300/20 to-orange-500/25" />
    </div>
  );
};