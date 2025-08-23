"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Target, Smartphone, Bot, CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  const steps = [
    {
      title: "Welcome to Budgeto! 🎉",
      subtitle: `Great choice, ${user?.full_name?.split(' ')[0]}! Let's set up your account.`,
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto flex items-center justify-center">
            <span className="text-3xl">🇬🇷</span>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">You're a {user?.archetype}!</h3>
            <p className="text-gray-600">
              {user?.archetype === 'Allowance' && "Perfect! We'll help you make the most of your monthly allowance."}
              {user?.archetype === 'Jobber' && "Great! We'll help you balance work income with student expenses."}
              {user?.archetype === 'Traveler' && "Awesome! We'll help you track expenses across different countries."}
              {user?.archetype === 'Saver' && "Excellent! We'll help you reach your savings goals faster."}
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Set Your Monthly Budget 💰",
      subtitle: "How much do you typically spend per month?",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Target className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          </div>
          <div>
            <label className="form-label">Monthly Budget (€)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="form-input pl-8"
                placeholder="800"
                min="50"
                max="5000"
                step="10"
              />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Include rent, food, transport, and entertainment. You can always adjust this later!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "SMS Integration 📱",
      subtitle: "Get transaction alerts automatically parsed",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Smartphone className="w-16 h-16 text-green-500 mx-auto mb-4" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">How it works:</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <p className="text-sm text-gray-600">Forward bank SMS messages to our parser</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <p className="text-sm text-gray-600">We automatically extract amount and category</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <p className="text-sm text-gray-600">Approve or edit transactions with a swipe</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">
              🇬🇷 <strong>Supports:</strong> NBG, Eurobank, Alpha Bank, Piraeus, and IRIS payments
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Telegram Bot 🤖",
      subtitle: "Add transactions on the go",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Quick Commands:</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-mono">/add Coffee 3€</p>
              <p className="text-sm font-mono">Lunch at taverna 15 euros</p>
              <p className="text-sm font-mono">/budget - Check your progress</p>
              <p className="text-sm font-mono">/stats - View your level</p>
            </div>
          </div>
          {user?.telegram_id && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                ✅ <strong>Connected:</strong> {user.telegram_id}
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      title: "All Set! 🚀",
      subtitle: "You're ready to start your financial journey",
      content: (
        <div className="text-center space-y-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Welcome to your financial adventure!</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-sm font-medium">Track Expenses</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">💰</div>
                <p className="text-sm font-medium">Reach Goals</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">📈</div>
                <p className="text-sm font-medium">Level Up</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-sm font-medium">Earn XP</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = async () => {
    setIsLoading(true);
    
    try {
      // Create initial monthly budget if provided
      if (monthlyBudget && parseFloat(monthlyBudget) > 0) {
        await api.budgets.create({
          type: 'Monthly',
          name: 'Monthly Budget',
          target_amount: parseFloat(monthlyBudget),
        });
      }

      // Award XP for completing onboarding
      await api.gamification.awardXP('daily_login');
      
      router.push('/');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still redirect to dashboard even if setup fails
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-primary-600 font-medium">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h1>
            <p className="text-gray-600">{currentStepData.subtitle}</p>
          </div>

          <div className="mb-8">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex space-x-4">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="flex-1 btn-secondary py-3"
              >
                Previous
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={currentStep === 1 && !monthlyBudget}
                className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={finishOnboarding}
                disabled={isLoading}
                className="flex-1 btn-primary py-3 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Start Using Budgeto!'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}