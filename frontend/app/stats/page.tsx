"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NoStatsEmpty, NoAchievementsEmpty, DashboardSkeleton } from '@/components/ui/EmptyStates';
import { WeeklyInsights } from '@/components/ui/WeeklyInsights';
import { useRouter } from 'next/navigation';
import { Trophy, Flame, TrendingUp, Star, Calendar, Target, Zap, Award } from 'lucide-react';

interface GamificationData {
  user_id: number;
  current_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  total_transactions: number;
  achievements: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export default function StatsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      loadGamificationData();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadGamificationData = async () => {
    try {
      const response = await api.gamification.getMyStats();
      setGamificationData(response.data);
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getXPForNextLevel = (level: number) => {
    return level * 100; // Simple formula: level * 100 XP
  };

  const getXPProgress = (currentXP: number, currentLevel: number) => {
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
    return (xpInCurrentLevel / xpNeededForLevel) * 100;
  };

  const getAllAchievements = (): Achievement[] => {
    const allAchievements: Achievement[] = [
      {
        id: 'first_transaction',
        title: 'First Steps',
        description: 'Add your first transaction',
        icon: '🚀',
        unlocked: (gamificationData?.total_transactions || 0) >= 1
      },
      {
        id: 'transaction_warrior',
        title: 'Transaction Warrior',
        description: 'Add 10 transactions',
        icon: '⚡',
        unlocked: (gamificationData?.total_transactions || 0) >= 10
      },
      {
        id: 'streak_starter',
        title: 'Streak Starter',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        unlocked: (gamificationData?.current_streak || 0) >= 3
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '📅',
        unlocked: (gamificationData?.current_streak || 0) >= 7
      },
      {
        id: 'level_up',
        title: 'Level Up!',
        description: 'Reach level 5',
        icon: '🌟',
        unlocked: (gamificationData?.current_level || 0) >= 5
      },
      {
        id: 'transaction_master',
        title: 'Transaction Master',
        description: 'Add 50 transactions',
        icon: '👑',
        unlocked: (gamificationData?.total_transactions || 0) >= 50
      },
      {
        id: 'streak_legend',
        title: 'Streak Legend',
        description: 'Maintain a 30-day streak',
        icon: '🏆',
        unlocked: (gamificationData?.longest_streak || 0) >= 30
      },
      {
        id: 'budgeto_master',
        title: 'Budgeto Master',
        description: 'Reach level 10',
        icon: '💎',
        unlocked: (gamificationData?.current_level || 0) >= 10
      }
    ];

    return allAchievements;
  };

  if (isLoading) {
    return (
      <div className="container-mobile py-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-mobile py-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!gamificationData) {
    return (
      <div className="container-mobile py-6">
        <NoStatsEmpty />
      </div>
    );
  }

  // Check if user has very minimal data
  const hasMinimalData = gamificationData.total_transactions < 3 && 
                        gamificationData.current_xp < 50 && 
                        gamificationData.current_level <= 1;

  if (hasMinimalData) {
    return (
      <div className="container-mobile py-6">
        <NoStatsEmpty />
      </div>
    );
  }

  const achievements = getAllAchievements();
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const xpProgress = getXPProgress(gamificationData.current_xp, gamificationData.current_level);
  const xpForNextLevel = getXPForNextLevel(gamificationData.current_level);
  const xpNeeded = xpForNextLevel - gamificationData.current_xp;

  return (
    <div className="container-mobile py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
        <p className="text-gray-600">Track your financial journey</p>
      </div>

      {/* Level & XP Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Level {gamificationData.current_level}</h2>
            <p className="text-primary-100">Finance Apprentice</p>
          </div>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Star className="w-8 h-8" />
          </div>
        </div>

        {/* XP Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-primary-100 mb-2">
            <span>{gamificationData.current_xp} XP</span>
            <span>{xpNeeded} XP to next level</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        <p className="text-primary-100 text-sm">
          Keep adding transactions to earn more XP!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-xl font-bold text-gray-900">{gamificationData.current_streak} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Longest Streak</p>
              <p className="text-xl font-bold text-gray-900">{gamificationData.longest_streak} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{gamificationData.total_transactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Achievements</p>
              <p className="text-xl font-bold text-gray-900">{unlockedAchievements.length}/{achievements.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Achievements</span>
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <NoAchievementsEmpty />
            </div>
          ) : unlockedAchievements.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🏆</div>
              <h4 className="font-medium text-gray-600 mb-2">No achievements yet</h4>
              <p className="text-sm text-gray-500">Start adding transactions to unlock your first achievement!</p>
            </div>
          ) : (
            achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlocked
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      achievement.unlocked ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${
                      achievement.unlocked ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.unlocked && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Insights */}
      <WeeklyInsights showHeader={true} />

      {/* Level Rewards Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>How to Earn XP</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-bold text-sm">+10</span>
            </div>
            <span className="text-primary-800">Add a manual transaction</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
              <span className="text-secondary-600 font-bold text-sm">+15</span>
            </div>
            <span className="text-secondary-800">Parse an SMS transaction</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">+25</span>
            </div>
            <span className="text-green-800">Daily streak bonus</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">+50</span>
            </div>
            <span className="text-purple-800">Create a budget</span>
          </div>
        </div>
      </div>

      {/* Motivation Card */}
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-xl text-white p-6 text-center">
        <h3 className="text-lg font-bold mb-2">Keep Going! 💪</h3>
        <p className="text-secondary-100 text-sm">
          {gamificationData.current_streak > 0 
            ? `You're on a ${gamificationData.current_streak}-day streak! Don't break it now.`
            : "Start your streak today by adding a transaction!"
          }
        </p>
      </div>
    </div>
  );
}