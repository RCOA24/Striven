import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Notification = ({ 
  type = 'success', 
  title, 
  message, 
  onClose, 
  duration = 4000,
  isVisible 
}) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: {
      bg: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-400/20',
      iconColor: 'text-green-100',
      border: 'border-green-400/30'
    },
    error: {
      bg: 'from-red-500 to-pink-600',
      iconBg: 'bg-red-400/20',
      iconColor: 'text-red-100',
      border: 'border-red-400/30'
    },
    warning: {
      bg: 'from-yellow-500 to-orange-600',
      iconBg: 'bg-yellow-400/20',
      iconColor: 'text-yellow-100',
      border: 'border-yellow-400/30'
    },
    info: {
      bg: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-400/20',
      iconColor: 'text-blue-100',
      border: 'border-blue-400/30'
    }
  };

  const Icon = icons[type];
  const colorScheme = colors[type];

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className={`bg-gradient-to-r ${colorScheme.bg} backdrop-blur-xl rounded-2xl shadow-2xl border ${colorScheme.border} p-4 min-w-[320px] max-w-md transform transition-all duration-300`}>
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`${colorScheme.iconBg} p-2 rounded-xl flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${colorScheme.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base mb-1">{title}</h3>
            {message && (
              <p className="text-white/90 text-sm leading-relaxed">{message}</p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0 hover:bg-white/10 rounded-lg p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {duration > 0 && (
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full animate-progress"
              style={{ animationDuration: `${duration}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;