"use client";

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAchievementNotifications } from '@/components/ui/NotificationToast';

interface Achievement {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  requirement_value: number;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  current_value: number;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  created_at: string;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const { showAchievementUnlocked, showLevelUp, showStreakMilestone } = useAchievementNotifications();

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.achievements.getAchievements();
      setAchievements(response.data || []);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for new achievements
  const checkForNewAchievements = useCallback(async () => {
    try {
      const response = await api.achievements.checkAchievements();
      const newlyUnlocked = response.data?.newly_unlocked || [];
      
      // Show notifications for newly unlocked achievements
      newlyUnlocked.forEach((achievement: Achievement) => {
        showAchievementUnlocked(
          achievement.title,
          `${achievement.description} - You've earned ${achievement.xp_reward} XP!`,
          {
            achievement_id: achievement.id,
            achievement_key: achievement.key,
            xp_reward: achievement.xp_reward,
            icon: achievement.icon
          }
        );
      });
      
      // Refresh achievements list if any were unlocked
      if (newlyUnlocked.length > 0) {
        await fetchAchievements();
      }
      
      setLastChecked(new Date());
      return newlyUnlocked;
    } catch (error) {
      console.error('Failed to check achievements:', error);
      return [];
    }
  }, [fetchAchievements, showAchievementUnlocked]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.achievements.getNotifications();
      const notificationList = response.data?.notifications || [];
      setNotifications(notificationList);
      
      // Show any unread notifications
      notificationList.forEach((notification: Notification) => {
        if (notification.type === 'achievement_unlocked') {
          showAchievementUnlocked(
            notification.title,
            notification.message,
            notification.data
          );
        } else if (notification.type === 'level_up') {
          showLevelUp(
            notification.data?.new_level || 0,
            notification.message
          );
        } else if (notification.type === 'streak_milestone') {
          showStreakMilestone(
            notification.data?.streak || 0,
            notification.message
          );
        }
      });
      
      // Mark all notifications as read after showing them
      if (notificationList.length > 0) {
        await api.achievements.markAllNotificationsRead();
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [showAchievementUnlocked, showLevelUp, showStreakMilestone]);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: number) => {
    try {
      await api.achievements.markNotificationRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Get achievement statistics
  const getAchievementStats = useCallback(async () => {
    try {
      const response = await api.achievements.getAchievementStats();
      return response.data;
    } catch (error) {
      console.error('Failed to get achievement stats:', error);
      return null;
    }
  }, []);

  // Auto-check for achievements periodically
  useEffect(() => {
    // Check immediately on mount
    fetchAchievements();
    fetchNotifications();

    // Set up periodic checking (every 30 seconds)
    const interval = setInterval(() => {
      checkForNewAchievements();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAchievements, fetchNotifications, checkForNewAchievements]);

  // Helper functions
  const getUnlockedAchievements = () => achievements.filter(a => a.unlocked);
  const getLockedAchievements = () => achievements.filter(a => !a.unlocked);
  const getCompletionRate = () => {
    if (achievements.length === 0) return 0;
    return (getUnlockedAchievements().length / achievements.length) * 100;
  };
  
  const getAchievementsByType = (type: string) => achievements.filter(a => a.type === type);
  
  const getRecentlyUnlocked = (days: number = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return achievements.filter(a => 
      a.unlocked && 
      a.unlocked_at && 
      new Date(a.unlocked_at) >= cutoff
    );
  };

  return {
    // Data
    achievements,
    notifications,
    loading,
    lastChecked,
    
    // Actions
    fetchAchievements,
    checkForNewAchievements,
    fetchNotifications,
    markNotificationRead,
    getAchievementStats,
    
    // Computed values
    unlockedAchievements: getUnlockedAchievements(),
    lockedAchievements: getLockedAchievements(),
    completionRate: getCompletionRate(),
    recentlyUnlocked: getRecentlyUnlocked(),
    
    // Helper functions
    getAchievementsByType,
    getRecentlyUnlocked
  };
};

export default useAchievements;