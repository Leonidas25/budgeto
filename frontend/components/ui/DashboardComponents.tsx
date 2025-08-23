// Dashboard components with real data integration

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export function MonthlyBudgetProgress({ budgets, summary }: { budgets: any[], summary: any }) {
  const monthlyBudget = budgets?.find(b => b.type === 'Monthly' && b.is_active);
  const spent = summary?.current_month?.total_expenses || 0;
  const target = monthlyBudget?.target_amount || 800;
  const remaining = Math.max(target - spent, 0);
  const percentage = Math.min((spent / target) * 100, 100);
  
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-3">
        {monthlyBudget ? monthlyBudget.name : 'Monthly Budget'}
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Spent this month</span>
          <span className="font-medium">€{spent.toFixed(2)} / €{target.toFixed(2)}</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-primary-500'
            }`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className={`text-xs ${
          remaining > 0 ? 'text-gray-500' : 'text-red-500'
        }`}>
          {remaining > 0 ? `€${remaining.toFixed(2)} remaining` : `€${Math.abs(remaining).toFixed(2)} over budget`}
        </p>
      </div>
    </div>
  );
}

export function PendingTransactionsCard({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Pending Approval</h3>
        {pendingCount > 0 && (
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
            {pendingCount}
          </span>
        )}
      </div>
      {pendingCount > 0 ? (
        <>
          <p className="text-sm text-gray-600 mb-3">
            You have {pendingCount} transaction{pendingCount > 1 ? 's' : ''} waiting for approval
          </p>
          <button 
            onClick={() => router.push('/transactions?tab=pending')}
            className="btn-primary w-full"
          >
            Review Transactions
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            All caught up! No pending transactions.
          </p>
          <button 
            onClick={() => router.push('/transactions')}
            className="btn-secondary w-full"
          >
            View All Transactions
          </button>
        </>
      )}
    </div>
  );
}

export function GoalsSnapshot({ budgets }: { budgets: any[] }) {
  const goals = budgets?.filter(b => b.type === 'Goal' && b.is_active) || [];
  const router = useRouter();
  
  if (goals.length === 0) {
    return (
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Savings Goals</h3>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-sm text-gray-600 mb-4">No savings goals yet</p>
          <button 
            onClick={() => router.push('/budgets')}
            className="btn-primary"
          >
            Create Your First Goal
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Savings Goals</h3>
        <button 
          onClick={() => router.push('/budgets')}
          className="text-primary-600 text-sm font-medium"
        >
          View All
        </button>
      </div>
      <div className="space-y-3">
        {goals.slice(0, 2).map((goal, index) => {
          const progress = goal.current_amount || 0;
          const target = goal.target_amount;
          const percentage = Math.min((progress / target) * 100, 100);
          
          return (
            <div key={goal.id || index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{goal.name} 🏆</span>
                <span className="font-medium">€{progress.toFixed(2)} / €{target.toFixed(2)}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LevelStreakBanner({ data }: { data?: any }) {
  const level = data?.level || 1;
  const xp = data?.xp || 0;
  const xpToNext = data?.xp_to_next_level || 100;
  const streakCount = data?.streak_count || 0;
  
  return (
    <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="level-badge">Level {level}</span>
            {streakCount > 0 && (
              <span className="text-sm opacity-90">🔥 {streakCount} day streak</span>
            )}
          </div>
          <p className="text-sm opacity-90 mt-1">
            {xp} XP • {xpToNext} XP to Level {level + 1}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl">⚡</p>
        </div>
      </div>
    </div>
  );
}

export function QuickAddButton() {
  const router = useRouter();
  
  return (
    <div className="fixed bottom-24 right-4">
      <button 
        onClick={() => router.push('/transactions/add')}
        className="bg-primary-500 hover:bg-primary-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}