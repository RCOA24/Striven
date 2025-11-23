import React from 'react';
import { Home, Activity, TrendingUp, User, Dumbbell, Settings, Scan } from 'lucide-react'; // +Scan

const MainLayout = ({ children, currentPage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'food', label: 'Food', icon: Scan }, // NEW
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="h-screen w-full bg-black flex flex-col overflow-hidden text-white">
  
      {/* Top Navigation Bar - Desktop */}
      <nav className="hidden md:block bg-zinc-900/50 backdrop-blur-xl border-b border-white/10 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-xl shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Striven</span>
            </div>

            {/* Navigation Links */}
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Settings Icon */}
            <button className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
        <div className="w-full min-h-full">
          {children}
        </div>
        {/* Spacer for mobile bottom nav */}
        <div className="md:hidden h-24"></div>
      </main>

      {/* Bottom Navigation Bar - Mobile */}
      <nav className="md:hidden bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                currentPage === item.id
                  ? 'text-emerald-500'
                  : 'text-zinc-500'
              }`}
            >
              <item.icon className={`w-6 h-6 ${currentPage === item.id ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
