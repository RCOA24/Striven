import React from 'react';
import { User, Target, Bell, Moon, Info, Shield, LogOut } from 'lucide-react';

const SettingItem = ({ icon: Icon, label, value, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/30 transition-all hover:bg-white/15 text-left"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{label}</h3>
          {value && <p className="text-sm text-white/60">{value}</p>}
        </div>
      </div>
      <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
);

const ProfilePage = () => {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-3 rounded-2xl shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Profile</h1>
        </div>
        <p className="text-white/70 ml-14">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl">
          <User className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Active Walker</h2>
        <p className="text-white/60 mb-4">Member since Nov 2025</p>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-2xl font-bold text-white">127</div>
            <div className="text-xs text-white/60">Total Activities</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-2xl font-bold text-white">1.2M</div>
            <div className="text-xs text-white/60">Total Steps</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-2xl font-bold text-white">45</div>
            <div className="text-xs text-white/60">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 px-1">Settings</h3>
        <div className="space-y-3">
          <SettingItem 
            icon={Target}
            label="Daily Goal"
            value="10,000 steps"
            onClick={() => console.log('Set goal')}
          />
          <SettingItem 
            icon={Bell}
            label="Notifications"
            value="Enabled"
            onClick={() => console.log('Notifications')}
          />
          <SettingItem 
            icon={Moon}
            label="Dark Mode"
            value="Always on"
            onClick={() => console.log('Theme')}
          />
        </div>
      </div>

      {/* Account Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 px-1">Account</h3>
        <div className="space-y-3">
          <SettingItem 
            icon={Shield}
            label="Privacy & Security"
            onClick={() => console.log('Privacy')}
          />
          <SettingItem 
            icon={Info}
            label="About Striven"
            value="Version 1.0.0"
            onClick={() => console.log('About')}
          />
        </div>
      </div>

      {/* Logout Button */}
      <button className="w-full bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl rounded-2xl p-5 border border-red-400/30 hover:border-red-400/50 transition-all text-left">
        <div className="flex items-center space-x-4">
          <div className="bg-red-500/30 p-3 rounded-xl">
            <LogOut className="w-5 h-5 text-red-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-200">Log Out</h3>
            <p className="text-sm text-red-300/60">Sign out of your account</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ProfilePage;