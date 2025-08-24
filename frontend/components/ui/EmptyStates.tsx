"use client";

import React from 'react';
import { LucideIcon, Plus, Search, Filter, CreditCard, Target, TrendingUp, Users, Smartphone, Bot, Bell, Trophy, BookOpen, Shield, Clock, Coffee, ShoppingBag, Home, Car } from 'lucide-react';
import { Button, Card } from './UIComponents';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Base empty state component
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  illustration?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className={cn('text-center', sizeClasses[size], className)}>
      {illustration && (
        <div className="text-6xl mb-4">{illustration}</div>
      )}
      
      {Icon && !illustration && (
        <div className="mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center" style={{
          width: size === 'lg' ? '80px' : size === 'md' ? '64px' : '48px',
          height: size === 'lg' ? '80px' : size === 'md' ? '64px' : '48px'
        }}>
          <Icon className={cn('text-gray-400', iconSizes[size])} />
        </div>
      )}
      
      <h3 className={cn(
        'font-semibold text-gray-900 mb-2',
        size === 'lg' ? 'text-xl' : 'text-lg'
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          'text-gray-600 mb-6',
          size === 'lg' ? 'text-base max-w-md' : 'text-sm max-w-sm',
          'mx-auto'
        )}>
          {description}
        </p>
      )}
      
      {action}
    </div>
  );
};

// Specialized empty states for different sections
export const NoTransactionsEmpty: React.FC<{ showAddButton?: boolean; tab?: string }> = ({ 
  showAddButton = true, 
  tab = 'all' 
}) => {
  const getContent = () => {
    switch (tab) {
      case 'pending':
        return {
          illustration: '⏳',
          title: 'No Pending Transactions',
          description: 'All your transactions are up to date! Great job staying on top of your finances.'
        };
      case 'approved':
        return {
          illustration: '✅',
          title: 'No Approved Transactions',
          description: 'Once you approve pending transactions, they\'ll appear here.'
        };
      default:
        return {
          illustration: '💳',
          title: 'Start Your Financial Journey',
          description: 'Track your income and expenses to take control of your finances. Add your first transaction or forward bank SMS messages.'
        };
    }
  };

  const content = getContent();

  return (
    <EmptyState
      illustration={content.illustration}
      title={content.title}
      description={content.description}
      action={showAddButton && tab === 'all' ? (
        <div className="space-y-3">
          <Link href="/transactions/add" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add First Transaction
          </Link>
          <div className="text-xs text-gray-500">
            💡 Tip: Forward bank SMS messages for automatic tracking
          </div>
        </div>
      ) : undefined}
      size="lg"
    />
  );
};

export const NoBudgetsEmpty: React.FC<{ type?: 'all' | 'monthly' | 'goals' }> = ({ type = 'all' }) => {
  const getContent = () => {
    switch (type) {
      case 'monthly':
        return {
          icon: Calendar,
          title: 'Set Your Monthly Budget',
          description: 'Create a monthly spending limit to stay on track with your financial goals.',
          action: (
            <Link href="/budgets/create?type=monthly" className="btn-primary">
              <Target className="w-4 h-4 mr-2" />
              Create Monthly Budget
            </Link>
          )
        };
      case 'goals':
        return {
          icon: Target,
          title: 'Create Your First Goal',
          description: 'Save for something special! Set a target amount and deadline to track your progress.',
          action: (
            <Link href="/budgets/create?type=goal" className="btn-primary">
              <Trophy className="w-4 h-4 mr-2" />
              Set Savings Goal
            </Link>
          )
        };
      default:
        return {
          illustration: '🎯',
          title: 'Take Control of Your Money',
          description: 'Set budgets and savings goals to make your money work for you. Start with a monthly budget or create your first savings goal.',
          action: (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/budgets/create?type=monthly" className="btn-primary">
                  <Target className="w-4 h-4 mr-2" />
                  Monthly Budget
                </Link>
                <Link href="/budgets/create?type=goal" className="btn-secondary">
                  <Trophy className="w-4 h-4 mr-2" />
                  Savings Goal
                </Link>
              </div>
              <div className="text-xs text-gray-500">
                💡 Tip: Start with a monthly budget for better control
              </div>
            </div>
          )
        };
    }
  };

  const content = getContent();
  return <EmptyState {...content} size="lg" />;
};

export const NoSearchResultsEmpty: React.FC<{ query: string; onClear: () => void }> = ({ query, onClear }) => (
  <EmptyState
    icon={Search}
    title="No Results Found"
    description={`No transactions match "${query}". Try different keywords or adjust your filters.`}
    action={
      <div className="space-y-3">
        <Button onClick={onClear} variant="secondary">
          <Filter className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
        <div className="text-xs text-gray-500">
          💡 Try searching by description, category, or amount
        </div>
      </div>
    }
  />
);

export const NoStatsEmpty: React.FC = () => (
  <EmptyState
    illustration="📊"
    title="Not Enough Data Yet"
    description="Add more transactions to see your spending patterns and insights."
    action={
      <Link href="/transactions/add" className="btn-primary">
        <Plus className="w-4 h-4 mr-2" />
        Add Transactions
      </Link>
    }
  />
);

export const NoAchievementsEmpty: React.FC = () => (
  <EmptyState
    illustration="🏆"
    title="Start Earning Achievements"
    description="Complete actions like approving transactions, staying within budget, and maintaining streaks to unlock achievements."
    action={
      <div className="space-y-3">
        <Button onClick={() => window.location.href = '/transactions'} variant="primary">
          <TrendingUp className="w-4 h-4 mr-2" />
          View Transactions
        </Button>
        <div className="text-xs text-gray-500">
          💡 Approve transactions and maintain daily streaks to level up!
        </div>
      </div>
    }
  />
);

export const OfflineEmpty: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <EmptyState
    illustration="📡"
    title="You're Offline"
    description="Check your internet connection and try again."
    action={
      <Button onClick={onRetry} variant="primary">
        <Shield className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    }
  />
);

export const ErrorEmpty: React.FC<{ message?: string; onRetry?: () => void }> = ({ 
  message = "Something went wrong", 
  onRetry 
}) => (
  <EmptyState
    illustration="⚠️"
    title="Oops! Something went wrong"
    description={message}
    action={onRetry ? (
      <Button onClick={onRetry} variant="primary">
        <Shield className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    ) : undefined}
  />
);

// Loading skeleton components
export const TransactionSkeleton: React.FC = () => (
  <div className="card animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="w-16 h-6 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const BudgetSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  </Card>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
    </div>
    
    {/* Cards skeleton */}
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

// Contextual empty states with helpful tips
export const EmptyStateWithTips: React.FC<{
  type: 'firstTime' | 'noData' | 'filtered';
  context: 'transactions' | 'budgets' | 'achievements';
  onAction?: () => void;
}> = ({ type, context, onAction }) => {
  const getTips = () => {
    const baseTips = {
      transactions: [
        "Forward bank SMS messages for automatic tracking",
        "Add income transactions to see your full picture",
        "Use categories to organize your spending",
        "Review and approve pending transactions regularly"
      ],
      budgets: [
        "Start with a realistic monthly budget",
        "Set specific savings goals with deadlines",
        "Review your budget monthly and adjust as needed",
        "Use the 50/30/20 rule as a starting point"
      ],
      achievements: [
        "Approve transactions daily to maintain streaks",
        "Stay within budget to earn bonus XP",
        "Complete weekly insights to level up faster",
        "Invite friends to unlock social achievements"
      ]
    };

    return baseTips[context] || [];
  };

  const getEmoji = () => {
    const emojis = {
      transactions: ['💳', '💰', '📱', '⚡'],
      budgets: ['🎯', '💪', '📊', '🏆'],
      achievements: ['🌟', '🚀', '🔥', '🎉']
    };
    return emojis[context] || ['🌟'];
  };

  const tips = getTips();
  const emojis = getEmoji();

  return (
    <Card className="max-w-md mx-auto">
      <div className="text-center py-8">
        <div className="text-4xl mb-4">{emojis[0]}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {type === 'firstTime' ? 'Welcome to Budgeto!' : 
           type === 'noData' ? 'Getting Started' : 
           'No Results Found'}
        </h3>
        
        {tips.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tips:</h4>
            <ul className="text-xs text-blue-800 space-y-1 text-left">
              {tips.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">{emojis[index + 1] || '•'}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {onAction && (
          <Button onClick={onAction} variant="primary">
            Get Started
          </Button>
        )}
      </div>
    </Card>
  );
};

// Category-specific illustrations
export const CategoryIllustrations = {
  Food: '🍽️',
  Drinks: '☕',
  Transport: '🚗',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Health: '🏥',
  Education: '📚',
  Travel: '✈️',
  Bills: '🏠',
  Other: '📋',
  Income: '💰',
  Salary: '💼',
  Freelance: '💻',
  Gift: '🎁'
};