"use client";

import Image from "next/image";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useView, useResponsive } from '@/lib/view-context';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { MonthlyBudgetProgress, PendingTransactionsCard, GoalsSnapshot, LevelStreakBanner, QuickAddButton, RecentActivityInsights } from "@/components/ui/DashboardComponents";
import { DesktopContentContainer, DesktopGrid } from '@/components/layout/DesktopLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { WeeklyInsights } from '@/components/ui/WeeklyInsights';
import { useRouter } from 'next/navigation';

interface DashboardData {
  user: any;
  summary: any;
  gamification: any;
  budgets: any[];
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isDesktop, isMobile } = useView();
  const { containerClass, gridCols, cardSpacing, padding } = useResponsive();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadDashboardData = async () => {
    try {
      // Load data with error handling for each endpoint
      const [summaryRes, budgetsRes] = await Promise.all([
        api.transactions.getSummary().catch(err => {
          console.warn('Failed to load summary:', err);
          return { data: null };
        }),
        api.budgets.getAll().catch(err => {
          console.warn('Failed to load budgets:', err);
          return { data: [] };
        })
      ]);

      // Try gamification separately since it's having issues
      let gamificationRes: { data: any } = { data: null };
      try {
        gamificationRes = await api.gamification.getMyStats();
      } catch (error) {
        console.warn('Gamification API currently unavailable:', error);
        // Provide default gamification data
        gamificationRes = {
          data: {
            xp: 0,
            level: 1,
            current_streak: 0,
            longest_streak: 0,
            achievements: [],
            xp_to_next_level: 100,
            level_progress_percentage: 0
          }
        };
      }

      setDashboardData({
        user,
        summary: summaryRes.data,
        gamification: gamificationRes.data,
        budgets: budgetsRes.data || []
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set minimal dashboard data so the page still renders
      setDashboardData({
        user,
        summary: {
          current_month: {
            total_income: 0,
            total_expenses: 0,
            net_amount: 0,
            transaction_count: 0,
            daily_average_spending: 0,
            expense_by_category: {},
            income_by_category: {}
          },
          previous_month: {
            total_income: 0,
            total_expenses: 0,
            net_amount: 0,
            transaction_count: 0
          },
          trends: {
            income_change_percent: 0,
            expense_change_percent: 0
          },
          recent_transactions: [],
          pending_transactions: 0,
          pending_amount: 0
        },
        gamification: {
          xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
          achievements: [],
          xp_to_next_level: 100,
          level_progress_percentage: 0
        },
        budgets: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'there';
  const currentBalance = dashboardData?.summary?.current_month ? 
    (dashboardData.summary.current_month.total_income || 0) - (dashboardData.summary.current_month.total_expenses || 0)
    : 0;

  return (
    <div className={cn(
      "min-h-screen",
      isDesktop ? "bg-gray-50" : "bg-gradient-to-br from-gray-50 via-white to-gray-50"
    )}>
      <div className={cn(
        isDesktop ? "container-content py-8" : "container-mobile py-6",
        "space-y-8"
      )}>
        {/* Enhanced Header Section */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-1">
            <h1 className={cn(
              "font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent",
              isDesktop ? "text-4xl" : "text-3xl"
            )}>
              Hey {firstName}! 👋
            </h1>
            <p className={cn(
              "text-gray-600",
              isDesktop ? "text-xl" : "text-lg"
            )}>Let’s check your finances</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Balance</p>
              <p className={cn(
                "font-bold transition-colors duration-300",
                isDesktop ? "text-3xl" : "text-2xl",
                currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(currentBalance)}
              </p>
            </div>
            {/* Quick Balance Indicator */}
            <div className={cn(
              "w-3 h-12 rounded-full transition-all duration-300",
              currentBalance >= 0 ? 'bg-gradient-to-t from-green-400 to-green-500' : 'bg-gradient-to-t from-red-400 to-red-500'
            )} />
          </div>
        </div>

        {/* Level & Streak Banner */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <LevelStreakBanner data={dashboardData?.gamification} />
        </div>

        {/* Main Dashboard Grid */}
        <div className={cn(
          "animate-slide-up",
          isDesktop ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8" : "grid grid-cols-1 gap-6"
        )} style={{ animationDelay: '200ms' }}>
          {/* Monthly Budget Progress - Full width on desktop */}
          <div className={isDesktop ? "lg:col-span-2 xl:col-span-3" : ""}>
            <MonthlyBudgetProgress 
              budgets={dashboardData?.budgets || []} 
              summary={dashboardData?.summary}
            />
          </div>

          {/* Secondary cards grid */}
          <div className={cn(
            isDesktop ? "lg:col-span-2 xl:col-span-3" : "",
            isDesktop ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"
          )}>
            {/* Pending Transactions */}
            <PendingTransactionsCard 
              pendingCount={dashboardData?.summary?.pending_transactions || 0}
            />

            {/* Goals Snapshot */}
            <GoalsSnapshot budgets={dashboardData?.budgets || []} />
            
            {/* Weekly Insights - Desktop gets its own card */}
            {isDesktop && (
              <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
                <WeeklyInsights maxInsights={2} />
              </div>
            )}
          </div>

          {/* Financial Insights - Full width */}
          <div className={isDesktop ? "lg:col-span-2 xl:col-span-3" : ""}>
            <RecentActivityInsights summary={dashboardData?.summary} />
          </div>
          
          {/* Weekly Insights for mobile */}
          {isMobile && (
            <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
              <WeeklyInsights maxInsights={2} />
            </div>
          )}
        </div>

        {/* Floating Action Button - Only for mobile */}
        {isMobile && <QuickAddButton />}

        {/* Bottom Spacing for mobile navigation */}
        <div className="h-20" />
      </div>
    </div>
  );
}
