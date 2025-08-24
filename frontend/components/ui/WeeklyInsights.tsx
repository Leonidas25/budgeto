"use client";

import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, Trophy, Calendar, RefreshCw, Sparkles, Coffee, Zap } from 'lucide-react';
import { Card } from './UIComponents';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface WeeklyInsight {
  user_id: number;
  week_start: string;
  message: string;
  category: 'spending' | 'achievement' | 'tip';
  is_funny: boolean;
}

interface WeeklyInsightsProps {
  className?: string;
  showHeader?: boolean;
  maxInsights?: number;
}

export const WeeklyInsights: React.FC<WeeklyInsightsProps> = ({
  className,
  showHeader = true,
  maxInsights = 3
}) => {
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.gamification.getInsights();
      setInsights(response.data || []);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spending':
        return <Coffee className="w-5 h-5" />;
      case 'achievement':
        return <Trophy className="w-5 h-5" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spending':
        return 'text-blue-600 bg-blue-100';
      case 'achievement':
        return 'text-green-600 bg-green-100';
      case 'tip':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-purple-600 bg-purple-100';
    }
  };

  const getWeekDateRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      });
    };
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        {showHeader && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-300 rounded w-32 animate-pulse"></div>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Weekly Insights</h3>
            </div>
            <button
              onClick={fetchInsights}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        )}
        <div className="text-center text-red-600 py-4">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchInsights}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  const displayInsights = insights.slice(0, maxInsights);

  return (
    <Card className={cn("p-6", className)}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Insights</h3>
              <p className="text-xs text-gray-500">{getWeekDateRange()}</p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      )}

      {displayInsights.length > 0 ? (
        <div className="space-y-4">
          {displayInsights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                getCategoryColor(insight.category)
              )}>
                {getCategoryIcon(insight.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <span className={cn(
                    "inline-block px-2 py-1 rounded-full text-xs font-medium capitalize",
                    getCategoryColor(insight.category)
                  )}>
                    {insight.category === 'achievement' ? '🏆 Achievement' : 
                     insight.category === 'spending' ? '💰 Spending' : '💡 Tip'}
                  </span>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-600 mb-2">No Insights Yet</h4>
          <p className="text-sm text-gray-500 mb-4">
            Start adding transactions this week to get personalized insights with Greek humor!
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Coffee className="w-3 h-3" />
              <span>Track expenses</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Get insights</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Level up</span>
            </div>
          </div>
        </div>
      )}

      {displayInsights.length > 0 && insights.length > maxInsights && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-center text-sm text-gray-500">
            {insights.length - maxInsights} more insights available
          </p>
        </div>
      )}
    </Card>
  );
};

export default WeeklyInsights;