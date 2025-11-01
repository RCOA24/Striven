import React, { useEffect, useState } from 'react';
import { Activity, Footprints, Zap } from 'lucide-react';

const Intro = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Stage 0: Initial logo appearance
    const timer1 = setTimeout(() => setStage(1), 800);
    
    // Stage 1: Show app name
    const timer2 = setTimeout(() => setStage(2), 1800);
    
    // Stage 2: Show tagline
    const timer3 = setTimeout(() => setStage(3), 2600);
    
    // Stage 3: Fade out and complete
    const timer4 = setTimeout(() => setFadeOut(true), 3800);
    
    const timer5 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 transition-opacity duration-600 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center px-6">
          {/* Logo container with animated icons */}
          <div
            className={`relative mb-12 transition-all duration-1000 ${
              stage >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          >
            {/* Center icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-3xl shadow-2xl">
                <Activity className="w-20 h-20 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Orbiting icons */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${
                stage >= 1 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="relative w-48 h-48">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" style={{ animationDuration: '2s' }}>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-lg">
                    <Footprints className="w-7 h-7 text-purple-300" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-lg">
                    <Zap className="w-7 h-7 text-blue-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App name */}
          <h1
            className={`text-7xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6 transition-all duration-1000 ${
              stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Striven
          </h1>

          {/* Tagline */}
          <p
            className={`text-2xl md:text-3xl text-white/70 font-light tracking-wide transition-all duration-1000 ${
              stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Track Your Journey
          </p>

          {/* Loading indicator */}
          <div
            className={`mt-12 transition-all duration-500 ${
              stage >= 2 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex space-x-3">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;