"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, User, CreditCard, Target, Settings, Smartphone, MessageCircle } from 'lucide-react';
import { Card, Button } from '@/components/ui/UIComponents';

interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
  actionText?: string;
  actionUrl?: string;
}

const quickStartSteps: QuickStartStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Budgeto! 🎉',
    description: 'Your personal finance companion designed for Greek students',
    icon: User,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Congratulations on taking the first step toward better financial management! 
          Budgeto is designed specifically for Greek students to make tracking expenses 
          and managing budgets simple and engaging.
        </p>
        <div className="bg-primary-50 p-4 rounded-lg">
          <h4 className="font-medium text-primary-900 mb-2">What makes Budgeto special:</h4>
          <ul className="space-y-1 text-sm text-primary-800">
            <li>• 🏦 Automatic SMS parsing from Greek banks</li>
            <li>• 🤖 AI-powered transaction categorization</li>
            <li>• 🏆 Gamification with Greek mythology themes</li>
            <li>• 📱 Telegram bot for quick transaction entry</li>
            <li>• 🎯 Student-focused budgeting tools</li>
          </ul>
        </div>
        <p className="text-gray-600">
          This quick guide will help you set up your account and start tracking your finances in just a few minutes.
        </p>
      </div>
    )
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Set up your student archetype and personal information',
    icon: User,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          First, let's complete your profile to personalize your Budgeto experience.
        </p>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Choose Your Student Archetype:</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">🎓</span>
                <span className="font-medium">Allowance</span>
              </div>
              <p className="text-sm text-gray-600">
                Perfect for students receiving regular allowances from family
              </p>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">💼</span>
                <span className="font-medium">Jobber</span>
              </div>
              <p className="text-sm text-gray-600">
                Ideal for students with part-time jobs or freelance work
              </p>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">✈️</span>
                <span className="font-medium">Traveler</span>
              </div>
              <p className="text-sm text-gray-600">
                Great for exchange students managing travel expenses
              </p>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">💰</span>
                <span className="font-medium">Saver</span>
              </div>
              <p className="text-sm text-gray-600">
                Best for students focused on building savings
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Your archetype helps us provide personalized insights and budget recommendations. 
            You can change it later in Settings.
          </p>
        </div>
      </div>
    ),
    actionText: 'Go to Profile Settings',
    actionUrl: '/settings'
  },
  {
    id: 'first-transaction',
    title: 'Add Your First Transaction',
    description: 'Learn how to add and categorize transactions',
    icon: CreditCard,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Let's add your first transaction to get you started with tracking your expenses.
        </p>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">How to Add a Transaction:</h4>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium text-gray-900">Click the "+" Button</p>
                <p className="text-sm text-gray-600">Find the floating action button on your dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium text-gray-900">Fill in Details</p>
                <p className="text-sm text-gray-600">Amount, description, and select a date</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium text-gray-900">Choose Category</p>
                <p className="text-sm text-gray-600">Our AI will suggest categories based on your description</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <p className="font-medium text-gray-900">Save Transaction</p>
                <p className="text-sm text-gray-600">Your transaction is now tracked in your budget</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            🎯 <strong>Try it now:</strong> Add a recent purchase like coffee, lunch, or transportation to see how it works!
          </p>
        </div>
      </div>
    ),
    actionText: 'Add Transaction',
    actionUrl: '/transactions/add'
  },
  {
    id: 'budgets',
    title: 'Create Your First Budget',
    description: 'Set up spending limits for different categories',
    icon: Target,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Budgets help you control spending and reach your financial goals. Let's create your first budget categories.
        </p>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Recommended Categories for Students:</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>🍕</span>
                <span className="font-medium">Food & Dining</span>
              </div>
              <span className="text-sm text-gray-600">€150-300/month</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>🚌</span>
                <span className="font-medium">Transportation</span>
              </div>
              <span className="text-sm text-gray-600">€50-100/month</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>📚</span>
                <span className="font-medium">Education</span>
              </div>
              <span className="text-sm text-gray-600">€100-200/month</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>🎉</span>
                <span className="font-medium">Entertainment</span>
              </div>
              <span className="text-sm text-gray-600">€80-150/month</span>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Pro Tip:</strong> Start with realistic amounts based on your income. You can always adjust them later as you learn your spending patterns.
          </p>
        </div>
      </div>
    ),
    actionText: 'Create Budget',
    actionUrl: '/budgets'
  },
  {
    id: 'sms-integration',
    title: 'Enable SMS Integration',
    description: 'Automatically parse bank SMS messages for transactions',
    icon: Smartphone,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          SMS integration is one of Budgeto's most powerful features. It automatically detects and parses 
          transaction SMS from your bank, saving you time and ensuring you never miss a transaction.
        </p>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Supported Greek Banks:</h4>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>National Bank of Greece (NBG)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Eurobank</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Alpha Bank</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Piraeus Bank</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>IRIS</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>PayPal</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Revolut</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">How It Works:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>1. Grant SMS permission when prompted</p>
            <p>2. Enable parsing for your banks in settings</p>
            <p>3. Receive SMS from your bank about a transaction</p>
            <p>4. Budgeto automatically creates a pending transaction</p>
            <p>5. Swipe to approve or reject the transaction</p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            🔒 <strong>Privacy:</strong> SMS data is processed locally on your device. 
            We never store or transmit your SMS messages to our servers.
          </p>
        </div>
      </div>
    ),
    actionText: 'Enable SMS Integration',
    actionUrl: '/settings?tab=sms'
  },
  {
    id: 'telegram-bot',
    title: 'Connect Telegram Bot (Optional)',
    description: 'Quick transaction entry via Telegram',
    icon: MessageCircle,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          The Budgeto Telegram bot lets you add transactions and check your balance without opening the app. 
          Perfect for quick entries on the go!
        </p>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Setup Steps:</h4>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium text-gray-900">Find @BudgetoBot on Telegram</p>
                <p className="text-sm text-gray-600">Search for the official Budgeto bot</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium text-gray-900">Start Conversation</p>
                <p className="text-sm text-gray-600">Send /start to initialize the bot</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium text-gray-900">Link Your Account</p>
                <p className="text-sm text-gray-600">Use /link your_username to connect</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <p className="font-medium text-gray-900">Start Adding Transactions</p>
                <p className="text-sm text-gray-600">Use natural language like "I spent 15€ on coffee"</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Example Commands:</h4>
          <div className="space-y-1 text-sm text-green-800">
            <p>• "Add 25 euros for lunch at university"</p>
            <p>• "I spent 5€ on coffee"</p>
            <p>• "/balance" - Check current balance</p>
            <p>• "/recent" - Show recent transactions</p>
          </div>
        </div>
      </div>
    ),
    actionText: 'Set Up Telegram Bot',
    actionUrl: '/settings?tab=integrations'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Start your budgeting journey',
    icon: Check,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Congratulations! You've completed the initial setup of Budgeto. You now have all the tools 
          you need to take control of your finances.
        </p>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">What's Next?</h4>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-800">Start adding transactions daily</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">Monitor your budget progress</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800">Earn XP and unlock achievements</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Settings className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">Review weekly insights</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
          <p className="text-sm text-gray-600 mb-3">
            Check out our comprehensive help center or contact support if you have any questions.
          </p>
          <div className="flex space-x-3">
            <a
              href="/help"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Help Center →
            </a>
            <a
              href="mailto:support@budgeto.app"
              className="text-secondary-600 hover:text-secondary-700 text-sm font-medium"
            >
              Contact Support →
            </a>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Ready to start your budgeting journey?
          </p>
          <Button 
            variant="primary" 
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard 🚀
          </Button>
        </div>
      </div>
    )
  }
];

const QuickStartGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = quickStartSteps[currentStep];
  const isLastStep = currentStep === quickStartSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const nextStep = () => {
    if (!isLastStep) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const completeGuide = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    // In a real app, you might want to mark the guide as completed
    localStorage.setItem('budgeto_quick_start_completed', 'true');
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Quick Start Guide</h1>
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {quickStartSteps.length}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${((currentStep + 1) / quickStartSteps.length) * 100}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {quickStartSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.has(index);
              const isCurrent = index === currentStep;
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-primary-100 text-primary-700'
                      : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCurrent
                      ? 'bg-primary-500 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200'
                  }`}>
                    {isCompleted ? (
                      <Check size={16} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <span className="text-xs text-center hidden sm:block">
                    {step.title.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <currentStepData.icon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-lg text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {currentStepData.content}
          </div>

          {/* Action Button */}
          {currentStepData.actionText && currentStepData.actionUrl && (
            <div className="text-center mt-6">
              <a
                href={currentStepData.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
              >
                <span>{currentStepData.actionText}</span>
                <ChevronRight size={16} />
              </a>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={isFirstStep}
            className="flex items-center space-x-2"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/dashboard'}
              className="text-gray-600"
            >
              Skip Guide
            </Button>
            
            <Button
              variant="primary"
              onClick={isLastStep ? completeGuide : nextStep}
              className="flex items-center space-x-2"
            >
              <span>{isLastStep ? 'Complete' : 'Next'}</span>
              {!isLastStep && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStartGuide;