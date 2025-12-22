import React, { useState, useMemo, memo } from 'react';
import { 
  Footprints, 
  Flame, 
  Timer,
  MapPin,
  Target, 
  Check, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  TrendingUp,
  Map as MapIcon // NEW
} from 'lucide-react';
import LicenseModal from '../components/LicenseModal';
import LiveMap from '../components/LiveMap'; // NEW

// --- Components ---

const StepCounter = ({ steps, goal }) => {
  const percentage = Math.min((steps / goal) * 100, 100);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-full aspect-square max-w-[280px] lg:max-w-[400px] mx-auto mb-8 lg:mb-0 group">
      <svg className="transform -rotate-90 w-full h-full overflow-visible" viewBox="0 0 300 300">
        <circle cx="150" cy="150" r={radius} stroke="#27272a" strokeWidth="24" fill="none" className="opacity-50" />
        
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <circle
          cx="150" cy="150" r={radius}
          stroke="url(#appleGradient)" 
          strokeWidth="24" 
          fill="none"
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" 
          className="transition-[stroke-dashoffset] duration-[1.5s] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[stroke-dashoffset]"
          style={{ filter: 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.3))' }}
        />
        
        <defs>
          <linearGradient id="appleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center animate-fadeIn">
            <Footprints className="w-8 h-8 lg:w-12 lg:h-12 text-emerald-500 mb-2" />
            <div className="text-6xl lg:text-8xl font-bold text-white tracking-tight font-sans tabular-nums">
            {steps.toLocaleString()}
            </div>
            <div className="text-sm lg:text-lg text-zinc-400 font-medium uppercase tracking-wide mt-1">steps</div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = memo(({ icon: Icon, label, value, iconColor, bgColor }) => {
  const isLongText = value.length > 6;

  return (
    <div className="relative group h-full">
      <div className="bg-zinc-900 rounded-[2rem] p-4 sm:p-5 border border-zinc-800/50 hover:bg-zinc-800 transition-colors duration-300 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-full ${bgColor} bg-opacity-15`}>
            {Icon ? (
              <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
            ) : (
              <div className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <span 
            className={`
              font-bold text-white tabular-nums 
              ${isLongText ? 'text-xl tracking-tighter' : 'text-2xl tracking-tight'} 
              leading-none
            `}
          >
            {value}
          </span>
          <span className="text-[10px] sm:text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-2">{label}</span>
        </div>
      </div>
    </div>
  );
});

const ControlButton = ({ onClick, children, variant = 'primary', icon: Icon, disabled, isMain }) => {
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    success: "bg-blue-500 hover:bg-blue-400 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-full transition-all duration-200 ease-out
        flex items-center justify-center gap-2 font-bold tracking-wide
        active:scale-[0.98] transform-gpu
        ${variants[variant]} 
        ${isMain ? "py-5 text-lg w-full" : "py-4 text-sm w-full"}
        ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}
      `}
    >
      {Icon && <Icon className={isMain ? 'w-6 h-6' : 'w-5 h-5'} strokeWidth={2.5} />}
      <span>{children}</span>
    </button>
  );
};

const StatsSummary = ({ steps, goal }) => {
  const percentage = Math.min((steps / goal) * 100, 100);
  
  return (
    <div className="bg-zinc-900 rounded-[2rem] p-6 mb-6 border border-zinc-800/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          <span className="text-zinc-400 font-semibold text-sm">Daily Goal</span>
        </div>
        <span className="text-white font-bold">{percentage.toFixed(0)}%</span>
      </div>
      <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-1000 ease-out will-change-transform"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const Dashboard = ({ 
  steps = 0, 
  isTracking = false, 
  isPaused = false, 
  distance = 0, 
  calories = 0, 
  formattedTime = "00:00:00",
  startTracking = () => {}, 
  pauseTracking = () => {}, 
  resumeTracking = () => {}, 
  reset = () => {}, 
  stopAndSave = () => {},
  weeklyStats = { totalSteps: 0, activeDays: 0 },
  onNavigateToStats = () => {},
  currentLocation = null, // NEW
  route = [], // NEW
  locationError = null // NEW
}) => {
  const dailyStepsGoal = 10000;
  const [showLicense, setShowLicense] = useState(false);
  const [viewMode, setViewMode] = useState('steps'); // NEW: 'steps' or 'map'

  // Request notification permission when starting workout
  const handleStartWorkout = async () => {
    // PWAs can use local notifications! Request permission here.
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.error('Error requesting notification permission:', e);
      }
    }
    startTracking();
    setViewMode('map'); // Auto-switch to map when starting
  };

  const weeklyAverage = useMemo(() => 
    weeklyStats.activeDays > 0 
      ? Math.round(weeklyStats.totalSteps / weeklyStats.activeDays)
      : 0
  , [weeklyStats]);

  return (
    /* 
       UPDATED WRAPPER:
       Removed min-h-screen and bg-black as these are handled by MainLayout.
       The content will flow naturally within the MainLayout's scrollable area.
    */

       
    <div className="w-full font-sans selection:bg-emerald-500/30 flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        
        {/* Header */}
        <header className="flex md:hidden justify-center items-center gap-3 mb-8 py-2">
          
          <h1 className="text-3xl font-bold tracking-tight">Striven</h1>
          
          <img src="/StrivenLogo.png" alt="Striven Logo" className="w-10 h-10 rounded-xl shadow-lg" />
        </header>
        

        {/* Main Content - Responsive Grid */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          
          {/* Left Column: Step Counter OR Map (Centered on Desktop) */}
          <div className="flex flex-col items-center justify-center lg:h-full lg:sticky lg:top-8 relative">
            
            {/* View Toggle Button (Only visible when tracking) */}
            {isTracking && (
              <button 
                onClick={() => setViewMode(v => v === 'steps' ? 'map' : 'steps')}
                className="absolute top-0 right-4 z-10 bg-zinc-800/80 backdrop-blur-md p-2 px-4 rounded-full text-white text-xs font-bold flex items-center gap-2 border border-white/10 hover:bg-zinc-700 transition-colors"
              >
                {viewMode === 'steps' ? <MapIcon size={14} /> : <Footprints size={14} />}
                {viewMode === 'steps' ? 'Show Map' : 'Show Steps'}
              </button>
            )}

            {isTracking && viewMode === 'map' ? (
               <div className="w-full max-w-[280px] lg:max-w-[400px] mx-auto mb-8 lg:mb-0 rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-800 relative" style={{ width: 'clamp(280px, 100%, 400px)', height: 'clamp(280px, 100vw, 400px)' }}>
                  <div className="w-full h-full flex flex-col">
                    <LiveMap route={route} currentLocation={currentLocation} locationError={locationError} />
                    {/* Overlay Stats on Map */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-3 flex justify-between items-center border border-white/10 z-[400]">
                        <div>
                          <div className="text-xs text-zinc-400 font-bold uppercase">Steps</div>
                          <div className="text-lg font-bold text-white">{steps.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-zinc-400 font-bold uppercase">Dist</div>
                          <div className="text-lg font-bold text-emerald-400">{distance.toFixed(2)}km</div>
                        </div>
                    </div>
                  </div>
               </div>
            ) : (
               <StepCounter steps={steps} goal={dailyStepsGoal} />
            )}
          </div>

          {/* Right Column: Metrics & Controls */}
          <div className="flex flex-col gap-6 w-full max-w-md mx-auto lg:max-w-none">
            <div className="grid grid-cols-3 gap-3 h-32">
              <MetricCard 
                icon={MapPin} 
                label="Distance" 
                value={`${distance.toFixed(2)}km`}
                iconColor="text-white-400"
                bgColor="bg-cyan-500"
              />
              <MetricCard 
                icon={Flame} 
                label="Kcal" 
                value={`${calories.toFixed(0)}`}
                iconColor="text-white-400"
                bgColor="bg-rose-500"
              />
              <MetricCard 
                icon={Timer} 
                label="Time" 
                value={formattedTime}
                iconColor="text-white-400"
                bgColor="bg-orange-500"
              />
            </div>

            <StatsSummary steps={steps} goal={dailyStepsGoal} />

            <div className="space-y-3 mt-2">
              {!isTracking ? (
                <ControlButton onClick={handleStartWorkout} isMain icon={Play} variant="primary">
                  Start Workout
                </ControlButton>
              ) : (
                <div className="space-y-3 animate-slideUpFade">
                  {isPaused ? (
                    <ControlButton onClick={resumeTracking} isMain icon={Play} variant="primary">
                      Resume
                    </ControlButton>
                  ) : (
                    <ControlButton onClick={pauseTracking} isMain icon={Pause} variant="secondary">
                      Pause
                    </ControlButton>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <ControlButton onClick={stopAndSave} variant="success" icon={Check} disabled={steps === 0}>
                      Finish
                    </ControlButton>
                    <ControlButton onClick={reset} variant="danger" icon={RotateCcw}>
                      Reset
                    </ControlButton>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={onNavigateToStats}
              className="w-full bg-zinc-900 rounded-2xl p-4 flex items-center justify-between active:bg-zinc-800 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-500/20 p-2.5 rounded-full text-purple-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Weekly Trends</div>
                  <div className="text-xs text-zinc-500">Avg: {weeklyAverage.toLocaleString()} steps</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
            </button>
          </div>
        </main>

        {/* App Info Footer */}
        <div className="mt-12">
          <div className="px-4 text-center">
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-bold text-lg mb-1 font-apple">Striven</h3>
              <p className="text-zinc-500 text-sm mb-4">Version 1.0.0</p>
              <button
                onClick={() => setShowLicense(true)}
                className="text-emerald-500 text-sm font-medium hover:underline"
              >
                License & Credits
              </button>
              <p className="text-zinc-600 text-xs mt-4">
                Privacy-First Fitness Tracker<br/>
                © 2025 Rodney Austria
              </p>
            </div>
          </div>
        </div>

        
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-slideUpFade {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

      <LicenseModal isOpen={showLicense} onClose={() => setShowLicense(false)} />
    </div>

    
  );
};

export default Dashboard;