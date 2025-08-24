"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NoBudgetsEmpty, BudgetSkeleton } from '@/components/ui/EmptyStates';
import { useRouter } from 'next/navigation';
import { Plus, Target, TrendingUp, Calendar, Euro, Edit, Trash2, Check, X } from 'lucide-react';

interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  current_spent: number;
  is_active: boolean;
  created_at: string;
}

interface BudgetFormData {
  name: string;
  target_amount: number;
  type: 'Monthly' | 'Goal';
}

export default function BudgetsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    target_amount: 0,
    type: 'Monthly'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      loadBudgets();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadBudgets = async () => {
    try {
      const response = await api.budgets.getAll();
      setBudgets(response.data);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingBudget) {
        await api.budgets.update(editingBudget.id, formData);
      } else {
        await api.budgets.create(formData);
      }
      
      await loadBudgets();
      resetForm();
    } catch (error) {
      console.error('Failed to save budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (budgetId: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await api.budgets.delete(budgetId);
      await loadBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', target_amount: 0, type: 'Monthly' });
    setShowAddForm(false);
    setEditingBudget(null);
  };

  const startEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.category, // Map category to name
      target_amount: budget.monthly_limit, // Map monthly_limit to target_amount
      type: 'Monthly'
    });
    setShowAddForm(true);
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="container-mobile py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-28 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <BudgetSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-mobile py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600">Manage your monthly spending limits</p>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <BudgetSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container-mobile py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">Manage your monthly spending limits</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Budget</span>
        </button>
      </div>

      {/* Add/Edit Budget Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingBudget ? 'Edit Budget' : 'Add New Budget'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Category</label>
              <select
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="form-input"
                required
              >
                <option value="">Select a category</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Shopping">Shopping</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Bills & Utilities">Bills & Utilities</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label">Monthly Limit (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.target_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, target_amount: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                placeholder="Enter monthly spending limit"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>{editingBudget ? 'Update' : 'Create'} Budget</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Cards */}
      {budgets.length > 0 ? (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const progressPercentage = getProgressPercentage(budget.current_spent, budget.monthly_limit);
            const remaining = budget.monthly_limit - budget.current_spent;
            
            return (
              <div key={budget.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                      <p className="text-sm text-gray-500">
                        €{budget.current_spent.toFixed(2)} of €{budget.monthly_limit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(budget)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Budget Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{Math.abs(remaining).toFixed(2)}
                      {remaining < 0 && ' over'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Daily Average</p>
                    <p className="font-semibold text-gray-900">
                      €{(budget.current_spent / new Date().getDate()).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Warning if over budget */}
                {progressPercentage >= 90 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">
                      {progressPercentage >= 100 ? '⚠️ Budget exceeded!' : '⚠️ Approaching budget limit!'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <NoBudgetsEmpty type="all" />
      )}

      {/* Monthly Overview */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>This Month Overview</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-600">Total Budget</p>
              <p className="text-xl font-bold text-primary-700">
                €{budgets.reduce((sum, budget) => sum + budget.monthly_limit, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-600">Total Spent</p>
              <p className="text-xl font-bold text-secondary-700">
                €{budgets.reduce((sum, budget) => sum + budget.current_spent, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}