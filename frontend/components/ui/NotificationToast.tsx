"use client";

import React, { useEffect, useState } from 'react';
import { Trophy, X, Star, Zap, Gift, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  type: 'achievement_unlocked' | 'level_up' | 'streak_milestone' | 'xp_earned' | 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  created_at: string;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: number) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close if specified
    if (notification.autoClose !== false) {
      const duration = notification.duration || 5000;
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(autoCloseTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [notification.autoClose, notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'achievement_unlocked':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'level_up':
        return <Star className="w-6 h-6 text-purple-500" />;
      case 'streak_milestone':
        return <Zap className="w-6 h-6 text-orange-500" />;
      case 'xp_earned':
        return <Gift className="w-6 h-6 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'achievement_unlocked':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'level_up':
        return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'streak_milestone':
        return 'bg-gradient-to-r from-orange-400 to-red-500';
      case 'xp_earned':
        return 'bg-gradient-to-r from-blue-400 to-indigo-500';
      case 'success':
        return 'bg-gradient-to-r from-green-400 to-emerald-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getCelebrationEmoji = () => {
    switch (notification.type) {
      case 'achievement_unlocked':
        return ['🎉', '🏆', '⭐', '🎊'];
      case 'level_up':
        return ['🚀', '⚡', '🌟', '🎆'];
      case 'streak_milestone':
        return ['🔥', '💪', '⚡', '🏃‍♂️'];
      default:
        return ['🎉'];
    }
  };

  const celebrationEmojis = getCelebrationEmoji();

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out",
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className={cn(
        "relative rounded-lg shadow-lg p-4 text-white overflow-hidden",
        getBackgroundColor()
      )}>
        {/* Celebration particles for achievements */}
        {(notification.type === 'achievement_unlocked' || notification.type === 'level_up') && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  fontSize: '20px'
                }}
              >
                {celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)]}
              </div>
            ))}
          </div>
        )}
        
        {/* Content */}
        <div className="relative flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white mb-1">
              {notification.title}
            </h4>
            <p className="text-white/90 text-sm leading-relaxed">
              {notification.message}
            </p>
            
            {/* Achievement specific data */}
            {notification.type === 'achievement_unlocked' && notification.data && (
              <div className="mt-2 flex items-center space-x-2">
                {notification.data.icon && (
                  <span className="text-2xl">{notification.data.icon}</span>
                )}
                {notification.data.xp_reward > 0 && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                    +{notification.data.xp_reward} XP
                  </span>
                )}
              </div>
            )}
            
            {/* Level up specific data */}
            {notification.type === 'level_up' && notification.data && (
              <div className="mt-2">
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                  Level {notification.data.new_level}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress bar for auto-close */}
        {notification.autoClose !== false && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white/40 transition-all ease-linear"
              style={{
                animation: `shrink ${notification.duration || 5000}ms linear`,
              }}
            />
          </div>
        )}
      </div>
      
      {/* CSS for progress bar animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

interface NotificationManagerProps {
  children: React.ReactNode;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void;
  notifications: Notification[];
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

export const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notification: Omit<Notification, 'id' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now() + Math.random(),
      created_at: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, notifications }}>
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-3 pointer-events-none">
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast
              notification={notification}
              onClose={removeNotification}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationManager');
  }
  return context;
};

// Convenience functions for different notification types
export const useAchievementNotifications = () => {
  const { showNotification } = useNotifications();
  
  return {
    showAchievementUnlocked: (title: string, message: string, data?: any) => {
      showNotification({
        type: 'achievement_unlocked',
        title,
        message,
        data,
        duration: 7000, // Longer duration for achievements
        autoClose: true
      });
    },
    
    showLevelUp: (newLevel: number, message?: string) => {
      showNotification({
        type: 'level_up',
        title: 'Level Up!',
        message: message || `Congratulations! You've reached level ${newLevel}!`,
        data: { new_level: newLevel },
        duration: 6000,
        autoClose: true
      });
    },
    
    showStreakMilestone: (streak: number, message?: string) => {
      showNotification({
        type: 'streak_milestone',
        title: 'Streak Milestone!',
        message: message || `Amazing! ${streak} day streak achieved!`,
        data: { streak },
        duration: 5000,
        autoClose: true
      });
    }
  };
};

export default NotificationManager;