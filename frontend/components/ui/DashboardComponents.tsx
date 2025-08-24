// Modern Dashboard components with engaging UI design

import { useRouter } from 'next/navigation';
import { 
  Plus, TrendingUp, TrendingDown, Target, Calendar, Trophy, 
  Wallet, PiggyBank, Zap, ArrowRight, CheckCircle2, Clock,
  Euro, Users, Gift, Star, Flame, Eye
} from 'lucide-react';
import { cn, formatCurrency, calculatePercentage, getMotivationalMessage } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ProgressRing, Progress } from './progress';
import { LevelProgress } from '.';

export function MonthlyBudgetProgress({ budgets, summary }: { budgets: any[], summary: any }) {
  const monthlyBudget = budgets?.find(b => b.type === 'Monthly' && b.is_active);
  const spent = summary?.current_month?.total_expenses || 0;
  const target = monthlyBudget?.target_amount || 800;
  const remaining = Math.max(target - spent, 0);
  const percentage = calculatePercentage(spent, target);
  const isOverBudget = spent > target;
  
  const getProgressVariant = () => {
    if (percentage > 100) return 'danger';
    if (percentage > 85) return 'warning';
    return 'default';
  };
  
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
  
  return (
    <Card variant="elevated" className="overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-full transform translate-x-16 -translate-y-16 opacity-60" />
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-600" />
              {currentMonth} Budget
            </CardTitle>
            <CardDescription className="mt-1">
              {monthlyBudget ? monthlyBudget.name : 'Monthly spending limit'}
            </CardDescription>
          </div>
          <Badge 
            variant={isOverBudget ? 'destructive' : percentage > 85 ? 'warning' : 'success'}
            className="text-sm font-bold px-3 py-1"
          >
            {percentage.toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-8 mb-6">
          <ProgressRing
            progress={Math.min(percentage, 100)}
            size={120}
            strokeWidth={10}
            className="flex-shrink-0"
          >
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                €{spent.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">
                of €{target.toFixed(0)}
              </div>
            </div>
          </ProgressRing>
          
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Remaining</span>
                  <PiggyBank className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-lg font-bold text-green-600">
                  {isOverBudget ? '-' : ''}€{Math.abs(remaining).toFixed(0)}
                </span>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">Daily avg</span>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-lg font-bold text-blue-600">
                  €{(spent / new Date().getDate()).toFixed(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isOverBudget ? (
                <div className="flex items-center space-x-2 text-red-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Over budget - Consider adjusting!</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">{getMotivationalMessage(percentage)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Progress value={percentage} variant={getProgressVariant()} size="lg" className="mb-2" />
        <p className="text-xs text-center text-gray-500">
          Budget period: {currentMonth} 1-{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
        </p>
      </CardContent>
    </Card>
  );
}

export function PendingTransactionsCard({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  
  return (
    <Card 
      variant={pendingCount > 0 ? "warning" : "default"}
      className={cn(
        "transition-all duration-300 hover:shadow-lg overflow-hidden relative",
        pendingCount > 0 && "border-orange-200 shadow-md"
      )}
    >
      {/* Animated background for pending items */}
      {pendingCount > 0 && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full transform translate-x-12 -translate-y-12 opacity-60" />
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              pendingCount > 0 
                ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg" 
                : "bg-gray-100 text-gray-400"
            )}>
              {pendingCount > 0 ? (
                <Clock className="w-6 h-6 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                {pendingCount > 0 ? 'Pending Approval' : 'All Set!'}
              </CardTitle>
              <CardDescription>
                {pendingCount > 0 
                  ? `${pendingCount} transaction${pendingCount > 1 ? 's' : ''} awaiting your review`
                  : "All your transactions are up to date"
                }
              </CardDescription>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge variant="warning" size="lg" className="animate-pulse font-bold">
              {pendingCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {pendingCount > 0 ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Quick Action Needed</p>
                    <p className="text-xs text-gray-500">Swipe to approve or reject transactions</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-orange-500 animate-pulse" />
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/transactions?tab=pending')}
              variant="gradient"
              size="full"
              className="group relative overflow-hidden"
            >
              <div className="flex items-center justify-center space-x-2">
                <Eye className="w-4 h-4" />
                <span className="font-medium">Review Transactions</span>
                <Badge variant="secondary" size="sm" className="bg-white/20 text-white border-white/30">
                  {pendingCount}
                </Badge>
              </div>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2 mb-6">
              <p className="font-medium text-gray-900">Great job staying organized!</p>
              <p className="text-sm text-gray-600">
                All your financial data is current and accurate.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/transactions')}
              variant="outline"
              size="full"
              className="group"
            >
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-4 h-4 group-hover:text-primary-600 transition-colors" />
                <span>View Transaction History</span>
              </div>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GoalsSnapshot({ budgets }: { budgets: any[] }) {
  const goals = budgets?.filter(b => b.type === 'Goal' && b.is_active) || [];
  const router = useRouter();
  
  if (goals.length === 0) {
    return (
      <Card variant="gradient" className="text-center py-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full transform -translate-x-10 -translate-y-10 opacity-50" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-secondary-100 to-primary-100 rounded-full transform translate-x-16 translate-y-16 opacity-50" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Target className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 mb-3">
            Set Your First Savings Goal!
          </CardTitle>
          <CardDescription className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
            Whether it's a trip to Santorini, new AirPods, or emergency fund - let's make it happen together! 🎯
          </CardDescription>
          <Button 
            onClick={() => router.push('/budgets')}
            variant="gradient"
            size="lg"
            className="group shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Gift className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            Create Your First Goal
          </Button>
        </div>
      </Card>
    );
  }
  
  const primaryGoal = goals[0];
  const progress = primaryGoal.current_amount || 0;
  const target = primaryGoal.target_amount;
  const percentage = calculatePercentage(progress, target);
  const remainingAmount = target - progress;
  const daysLeft = primaryGoal.deadline ? 
    Math.max(0, Math.ceil((new Date(primaryGoal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
    null;
  
  return (
    <Card variant="elevated" className="overflow-hidden relative">
      {/* Success background for completed goals */}
      {percentage >= 100 && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-50" />
      )}
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-secondary-50 to-primary-50 rounded-full transform translate-x-12 -translate-y-12 opacity-60" />
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                {primaryGoal.name || 'Savings Goal'}
              </CardTitle>
              <CardDescription>
                {percentage >= 100 ? '✨ Goal completed!' : `€${remainingAmount.toFixed(0)} to go`}
              </CardDescription>
            </div>
          </div>
          {goals.length > 1 && (
            <Badge variant="outline" className="text-xs">
              +{goals.length - 1} more
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <ProgressRing
              progress={percentage}
              size={100}
              strokeWidth={8}
              className="flex-shrink-0"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {percentage.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">
                  {percentage >= 100 ? 'Done!' : 'saved'}
                </div>
              </div>
            </ProgressRing>
            
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Saved</span>
                    <PiggyBank className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    €{progress.toFixed(0)}
                  </span>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Target</span>
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    €{target.toFixed(0)}
                  </span>
                </div>
              </div>
              
              {daysLeft !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Time remaining:</span>
                  <span className={cn(
                    "font-medium",
                    daysLeft <= 7 ? "text-red-600" : daysLeft <= 30 ? "text-yellow-600" : "text-green-600"
                  )}>
                    {daysLeft === 0 ? 'Today!' : `${daysLeft} days`}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <Progress value={percentage} size="lg" className="mb-4" />
          
          <div className="flex space-x-3">
            <Button 
              onClick={() => router.push('/budgets')}
              variant="outline"
              size="full"
              className="flex-1"
            >
              View All Goals
            </Button>
            {percentage < 100 && (
              <Button 
                onClick={() => router.push('/transactions/add')}
                variant="gradient"
                size="full"
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Money
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export function LevelStreakBanner({ data }: { data?: any }) {
  const level = data?.level || 1;
  const xp = data?.xp || 0;
  const xpToNext = data?.xp_to_next_level || 100;
  const xpCurrent = data?.xp_current_level || 0;
  const streakCount = data?.current_streak || 0;
  
  return (
    <LevelProgress 
      currentXP={xpCurrent}
      xpToNext={xpToNext}
      level={level}
      className="animate-fade-in"
    />
  );
}

export function RecentActivityInsights({ summary }: { summary: any }) {
  const currentMonth = summary?.current_month;
  const previousMonth = summary?.previous_month;
  const trends = summary?.trends;
  
  if (!currentMonth) {
    return (
      <Card variant="interactive" className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900 mb-2">No activity yet</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Start tracking your expenses to see insights here!
          </CardDescription>
        </div>
      </Card>
    );
  }
  
  const insights = [
    {
      title: 'This Month',
      value: formatCurrency(currentMonth.total_expenses),
      change: trends?.expense_change_percent || 0,
      icon: Euro,
      color: 'blue'
    },
    {
      title: 'Transactions',
      value: currentMonth.transaction_count?.toString() || '0',
      change: null,
      icon: Target,
      color: 'green'
    },
    {
      title: 'Daily Average',
      value: formatCurrency(currentMonth.daily_average_spending || 0),
      change: null,
      icon: Calendar,
      color: 'purple'
    }
  ];
  
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Financial Insights
        </CardTitle>
        <CardDescription>
          Your spending patterns this month
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {insights.map((insight, index) => {
            const colorClasses = {
              blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
              green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
              purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
            };
            const colors = colorClasses[insight.color as keyof typeof colorClasses];
            
            return (
              <div
                key={index}
                className={cn(
                  "rounded-lg p-3 border transition-all duration-200 hover:shadow-md",
                  colors.bg, colors.border
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <insight.icon className={cn("w-4 h-4", colors.text)} />
                  {insight.change !== null && (
                    <span className={cn(
                      "text-xs font-medium",
                      insight.change > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {insight.title}
                </p>
                <p className={cn("text-lg font-bold mt-1", colors.text)}>
                  {insight.value}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickAddButton() {
  const router = useRouter();
  
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-float">
      <Button
        onClick={() => router.push('/transactions/add')}
        variant="gradient"
        size="icon"
        className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 group"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </Button>
    </div>
  );
}