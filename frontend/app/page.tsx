import Image from "next/image";

"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { MonthlyBudgetProgress, PendingTransactionsCard, GoalsSnapshot, LevelStreakBanner, QuickAddButton } from "@/components/ui/DashboardComponents";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

interface DashboardData {
  user: any;
  summary: any;
  gamification: any;
  budgets: any[];
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
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
      const [summaryRes, gamificationRes, budgetsRes] = await Promise.all([
        api.transactions.getSummary(),
        api.gamification.getMyStats(),
        api.budgets.getAll()
      ]);

      setDashboardData({
        user,
        summary: summaryRes.data,
        gamification: gamificationRes.data,
        budgets: budgetsRes.data
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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

  const firstName = user?.full_name?.split(' ')[0] || user?.username;
  const currentBalance = dashboardData?.summary ? 
    dashboardData.summary.current_month.total_income - dashboardData.summary.current_month.total_expenses 
    : 0;

  return (
    <div className="container-mobile py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hey {firstName}! 👋</h1>
          <p className="text-gray-600">Let's check your finances</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className={`text-lg font-bold ${
              currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              €{currentBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Level & Streak Banner */}
      <LevelStreakBanner data={dashboardData?.gamification} />

      {/* Monthly Budget Progress */}
      <MonthlyBudgetProgress 
        budgets={dashboardData?.budgets || []} 
        summary={dashboardData?.summary}
      />

      {/* Pending Transactions */}
      <PendingTransactionsCard 
        pendingCount={dashboardData?.summary?.pending_transactions || 0}
      />

      {/* Goals Snapshot */}
      <GoalsSnapshot budgets={dashboardData?.budgets || []} />

      {/* Quick Add Button */}
      <QuickAddButton />
    </div>
  );
}
