"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Target, Smartphone, Bot, CheckCircle, Lightbulb, TrendingUp, Calendar, Trophy, ArrowRight, Users, Coffee, Car, Book, Plane } from 'lucide-react';
import { Card, Button, ProgressRing } from '@/components/ui/UIComponents';
import { cn } from '@/lib/utils';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [skipOptional, setSkipOptional] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  // Enhanced archetype data with personalized recommendations
  const archetypeData = {
    Allowance: {
      icon: '🎓',
      color: 'blue',
      title: 'Allowance Receiver',
      description: 'Living on monthly allowance from family',
      budgetSuggestion: 400,
      tips: [
        'Track every euro to make your allowance last',
        'Set aside 20% for emergencies',
        'Use SMS parsing to catch surprise expenses',
        'Plan big purchases around allowance dates'
      ],
      recommendedGoals: ['Emergency Fund', 'Textbook Savings', 'Fun Money']
    },
    Jobber: {
      icon: '💼',
      color: 'green',
      title: 'Student Worker',
      description: 'Balancing work income with studies',
      budgetSuggestion: 800,
      tips: [
        'Budget for irregular income months',
        'Save 30% during high-earning periods',
        'Track work-related expenses for taxes',
        'Plan for study break income drops'
      ],
      recommendedGoals: ['Summer Break Fund', 'Study Materials', 'Career Investment']
    },
    Traveler: {
      icon: '✈️',
      color: 'purple',
      title: 'Global Explorer',
      description: 'Managing finances across countries',
      budgetSuggestion: 1200,
      tips: [
        'Track expenses in multiple currencies',
        'Budget for exchange rate fluctuations',
        'Save receipts for visa applications',
        'Plan for travel emergencies'
      ],
      recommendedGoals: ['Travel Emergency Fund', 'Next Trip', 'Visa & Documents']
    },
    Saver: {
      icon: '🏦',
      color: 'yellow',
      title: 'Future Planner',
      description: 'Building wealth for future goals',
      budgetSuggestion: 600,
      tips: [
        'Automate savings to reach goals faster',
        'Track progress with detailed analytics',
        'Set multiple short and long-term goals',
        'Celebrate milestone achievements'
      ],
      recommendedGoals: ['House Down Payment', 'Master's Degree', 'Investment Fund']
    }
  };

  const archetype = user?.archetype as keyof typeof archetypeData || 'Allowance';
  const archetypeInfo = archetypeData[archetype];

  const steps = [
    {
      title: `Welcome, ${archetypeInfo.title}! ${archetypeInfo.icon}`,
      subtitle: `Perfect choice for ${user?.full_name?.split(' ')[0]}! Let's personalize your experience.`,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className={cn(
              "w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-4",
              `bg-${archetypeInfo.color}-100`
            )}>
              {archetypeInfo.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{archetypeInfo.title}</h3>
            <p className="text-gray-600 mb-4">{archetypeInfo.description}</p>
          </div>
          
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Perfect for you because:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {archetypeInfo.tips.slice(0, 2).map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
          
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white p-4 text-center">
            <p className="text-sm opacity-90">Ready to take control of your finances?</p>
            <p className="font-semibold">Let's set you up for success! 🚀</p>
          </div>
        </div>
      )
    },
    {
      title: "Set Your Monthly Budget 💰",
      subtitle: `Based on ${archetypeInfo.title} patterns, here's what we recommend:`,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Target className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          </div>
          
          {/* Recommended Budget */}
          <Card className="bg-green-50 border-green-200">
            <div className="text-center">
              <h4 className="font-medium text-green-900 mb-2">💡 Recommended for {archetypeInfo.title}s</h4>
              <div className="text-3xl font-bold text-green-700 mb-2">€{archetypeInfo.budgetSuggestion}</div>
              <button 
                onClick={() => setMonthlyBudget(archetypeInfo.budgetSuggestion.toString())}
                className="text-sm text-green-600 hover:text-green-800 underline"
              >
                Use this amount
              </button>
            </div>
          </Card>
          
          <div>
            <label className="form-label">Or set your own amount (€)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="form-input pl-8"
                placeholder={archetypeInfo.budgetSuggestion.toString()}
                min="50"
                max="5000"
                step="10"
              />
            </div>
          </div>
          
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">{archetypeInfo.title} Budget Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {archetypeInfo.tips.slice(0, 3).map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
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
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to your financial adventure!</h3>
            <p className="text-gray-600 mb-6">Here's what you've set up:</p>
          </div>
          
          {/* Setup Summary */}
          <div className="space-y-3">
            <Card className="bg-primary-50 border-primary-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-900">Monthly Budget</p>
                    <p className="text-sm text-primary-700">€{monthlyBudget || archetypeInfo.budgetSuggestion}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </Card>
            
            {selectedGoals.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900">Savings Goals</p>
                      <p className="text-sm text-yellow-700">{selectedGoals.length} goal{selectedGoals.length > 1 ? 's' : ''} selected</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </Card>
            )}
          </div>
          
          {/* Quick Start Guide */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-3">🚀 Quick Start Guide:</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Add your first transaction manually</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Forward a bank SMS to test auto-parsing</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Check your dashboard for insights</span>
              </div>
            </div>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-50 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-sm font-medium text-primary-800">Track Progress</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm font-medium text-green-800">Reach Goals</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">📈</div>
              <p className="text-sm font-medium text-blue-800">Level Up</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">🏆</div>
              <p className="text-sm font-medium text-purple-800">Earn XP</p>
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
      const budgetAmount = monthlyBudget ? parseFloat(monthlyBudget) : archetypeInfo.budgetSuggestion;
      if (budgetAmount > 0) {
        await api.budgets.create({
          type: 'Monthly',
          name: 'Monthly Budget',
          target_amount: budgetAmount,
        });
      }

      // Create selected goals
      for (const goalId of selectedGoals) {
        const goal = goalOptions.find(g => g.id === goalId);
        if (goal) {
          await api.budgets.create({
            type: 'Goal',
            name: goal.name,
            target_amount: goal.amount,
          });
        }
      }

      // Award XP for completing onboarding
      await api.gamification.awardXP('onboarding_complete');
      
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
                className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {currentStep === 2 && selectedGoals.length === 0 && !skipOptional ? (
                  <>Continue without goals</>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={finishOnboarding}
                disabled={isLoading}
                className="flex-1 btn-primary py-3 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Setting up...</span>
                  </div>
                ) : (
                  <>
                    Start Using Budgeto!
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}