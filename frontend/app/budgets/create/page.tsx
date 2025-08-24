"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, Target, Calendar, Euro, Zap, PiggyBank, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BudgetFormData {
  name: string;
  target_amount: number;
  type: 'Monthly' | 'Goal';
  deadline?: string;
  category?: string;
}

const categories = [
  'Food & Dining', 'Shopping', 'Transportation', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'
];

const categoryEmojis: { [key: string]: string } = {
  'Food & Dining': '🍽️',
  'Shopping': '🛍️',
  'Transportation': '🚌',
  'Entertainment': '🎮',
  'Bills & Utilities': '💡',
  'Healthcare': '🏥',
  'Education': '📚',
  'Travel': '✈️',
  'Other': '📝'
};

export default function CreateBudgetPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgetType = (searchParams.get('type') as 'monthly' | 'goal') || 'monthly';
  
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    target_amount: 0,
    type: budgetType === 'monthly' ? 'Monthly' : 'Goal',
    deadline: '',
    category: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: budgetType === 'monthly' ? 'Monthly' : 'Goal'
    }));
  }, [budgetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        setError('Please enter a budget name');
        return;
      }
      
      if (formData.target_amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (formData.type === 'Monthly' && !formData.category) {
        setError('Please select a category for monthly budget');
        return;
      }

      if (formData.type === 'Goal' && !formData.deadline) {
        setError('Please set a deadline for your goal');
        return;
      }

      await api.budgets.create(formData);
      router.push('/budgets');
    } catch (error: any) {
      console.error('Failed to create budget:', error);
      setError(error.response?.data?.detail || 'Failed to create budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, target_amount: value }));
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isMonthly = formData.type === 'Monthly';
  const isGoal = formData.type === 'Goal';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-secondary-50">
      <div className="container-mobile py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 animate-fade-in">
          <Link href="/budgets" className="p-2 hover:bg-white/50 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create {isMonthly ? 'Monthly Budget' : 'Savings Goal'}
            </h1>
            <p className="text-gray-600">
              {isMonthly ? 'Set spending limits for better control' : 'Save towards your dreams'}
            </p>
          </div>
        </div>

        {/* Budget Type Toggle */}
        <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Budget Type</CardTitle>
            <CardDescription>Choose what you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                href="/budgets/create?type=monthly"
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  isMonthly 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold">Monthly Budget</h3>
                  <p className="text-sm text-gray-600">Set spending limits</p>
                  {isMonthly && <Badge variant="success" className="mt-2">Selected</Badge>}
                </div>
              </Link>
              
              <Link 
                href="/budgets/create?type=goal"
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  isGoal 
                    ? 'border-secondary-500 bg-secondary-50 text-secondary-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <Target className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold">Savings Goal</h3>
                  <p className="text-sm text-gray-600">Save for something</p>
                  {isGoal && <Badge variant="warning" className="mt-2">Selected</Badge>}
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              {isMonthly ? (
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-secondary-600" />
                </div>
              )}
              <div>
                <CardTitle>
                  {isMonthly ? 'Monthly Budget Details' : 'Savings Goal Details'}
                </CardTitle>
                <CardDescription>
                  {isMonthly 
                    ? 'Control your monthly spending by category' 
                    : 'Set a target and deadline for your savings goal'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Budget Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isMonthly ? 'Budget Name' : 'Goal Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50/50 hover:bg-white"
                  placeholder={isMonthly ? 'e.g., Food & Groceries' : 'e.g., Trip to Santorini'}
                  required
                />
              </div>

              {/* Category (Monthly only) */}
              {isMonthly && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category }))}
                        className={`p-3 rounded-xl border-2 transition-all text-sm ${
                          formData.category === category
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{categoryEmojis[category]}</div>
                        <div className="text-xs font-medium">{category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isMonthly ? 'Monthly Limit' : 'Target Amount'} *
                </label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.target_amount || ''}
                    onChange={handleAmountChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50/50 hover:bg-white"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                {formData.target_amount > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {isMonthly 
                      ? `You'll be notified when you're close to €${formData.target_amount.toFixed(2)}`
                      : `That's about €${(formData.target_amount / 12).toFixed(2)} per month if saved over a year`
                    }
                  </p>
                )}
              </div>

              {/* Deadline (Goals only) */}
              {isGoal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50/50 hover:bg-white"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  {formData.deadline && (
                    <p className="text-sm text-gray-500 mt-2">
                      {(() => {
                        const days = Math.ceil((new Date(formData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const dailySaving = formData.target_amount / days;
                        return `${days} days to go • Save €${dailySaving.toFixed(2)} per day`;
                      })()}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="full"
                  onClick={() => router.push('/budgets')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="gradient"
                  size="full"
                  className="flex-1 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Create {isMonthly ? 'Budget' : 'Goal'}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card variant="info" className="bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">
                  {isMonthly ? '💡 Monthly Budget Tips' : '🎯 Goal Setting Tips'}
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {isMonthly ? (
                    <>
                      <li>• Start with realistic amounts you can stick to</li>
                      <li>• Review and adjust monthly based on your spending</li>
                      <li>• Get notifications when you're near your limit</li>
                    </>
                  ) : (
                    <>
                      <li>• Break big goals into smaller milestones</li>
                      <li>• Set realistic deadlines to stay motivated</li>
                      <li>• Celebrate progress along the way</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}