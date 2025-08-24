"use client";

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Play, BookOpen, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/UIComponents';
import { useAccessibleTheme } from '@/hooks/useAccessibility';

interface HelpStep {
  id: string;
  title: string;
  content: string;
  element?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface HelpTour {
  id: string;
  title: string;
  description: string;
  steps: HelpStep[];
  category: 'getting-started' | 'transactions' | 'budgets' | 'features';
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const helpTours: HelpTour[] = [
  {
    id: 'getting-started',
    title: 'Welcome to Budgeto',
    description: 'Learn the basics of using Budgeto for managing your finances',
    category: 'getting-started',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome! 👋',
        content: 'Welcome to Budgeto! This quick tour will show you how to get the most out of your personal finance app.',
      },
      {
        id: 'dashboard',
        title: 'Your Dashboard',
        content: 'This is your main dashboard where you can see your financial overview, recent transactions, and budget progress.',
        element: '[data-testid="dashboard"]',
        position: 'bottom'
      },
      {
        id: 'add-transaction',
        title: 'Add Transactions',
        content: 'Click the + button to add new transactions. You can also swipe to approve SMS-parsed transactions.',
        element: '[data-testid="add-transaction"]',
        position: 'left'
      },
      {
        id: 'navigation',
        title: 'Navigation',
        content: 'Use the bottom navigation to access different sections: Dashboard, Transactions, Budgets, and Settings.',
        element: '[data-testid="bottom-nav"]',
        position: 'top'
      }
    ]
  },
  {
    id: 'sms-integration',
    title: 'SMS Integration',
    description: 'Learn how to set up and use automatic SMS parsing for transactions',
    category: 'features',
    steps: [
      {
        id: 'sms-intro',
        title: 'SMS Integration 📱',
        content: 'Budgeto can automatically parse SMS messages from Greek banks to create transactions.',
      },
      {
        id: 'sms-setup',
        title: 'Enable SMS Parsing',
        content: 'Go to Settings → SMS Integration to enable automatic parsing for your banks.',
        element: '[data-testid="sms-settings"]',
        position: 'right'
      },
      {
        id: 'sms-approval',
        title: 'Approve Transactions',
        content: 'When SMS transactions are detected, they appear in pending. Swipe right to approve or left to reject.',
        element: '[data-testid="pending-transactions"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'achievements',
    title: 'Achievements & Gamification',
    description: 'Discover how to earn XP and unlock achievements',
    category: 'features',
    steps: [
      {
        id: 'xp-intro',
        title: 'Experience Points 🏆',
        content: 'Earn XP by adding transactions, staying within budget, and reaching financial goals.',
      },
      {
        id: 'level-up',
        title: 'Level Up',
        content: 'As you earn XP, you level up and unlock new achievements with Greek mythology themes.',
        element: '[data-testid="level-display"]',
        position: 'bottom'
      },
      {
        id: 'achievements-view',
        title: 'View Achievements',
        content: 'Check your achievements in the profile section to see what you\'ve unlocked and what\'s coming next.',
        element: '[data-testid="achievements"]',
        position: 'left'
      }
    ]
  }
];

const faqData: FAQItem[] = [
  {
    id: 'sms-not-working',
    question: 'Why aren\'t my SMS messages being parsed?',
    answer: 'Make sure you\'ve granted SMS permissions and enabled parsing for your bank in Settings. Some SMS formats may not be recognized - you can add these transactions manually.',
    category: 'SMS Integration',
    tags: ['sms', 'parsing', 'permissions', 'banks']
  },
  {
    id: 'telegram-bot-setup',
    question: 'How do I set up the Telegram bot?',
    answer: 'Find @BudgetoBot on Telegram, start a conversation with /start, then link your account using /link your_username. Verify the connection in Budgeto Settings.',
    category: 'Integrations',
    tags: ['telegram', 'bot', 'setup', 'linking']
  },
  {
    id: 'category-suggestions',
    question: 'How does AI categorization work?',
    answer: 'Budgeto uses AI to suggest categories based on transaction descriptions, merchant names, and your spending patterns. The system learns and improves over time.',
    category: 'Transactions',
    tags: ['ai', 'categories', 'suggestions', 'machine learning']
  },
  {
    id: 'budget-setup',
    question: 'How do I create effective budgets?',
    answer: 'Start with realistic monthly limits for each category. Common student categories include Food (€150-300), Transportation (€50-100), and Entertainment (€80-150).',
    category: 'Budgets',
    tags: ['budgets', 'limits', 'categories', 'students']
  },
  {
    id: 'data-privacy',
    question: 'Is my financial data secure?',
    answer: 'Yes! Budgeto uses end-to-end encryption, follows GDPR guidelines, and never sells your data. You have full control over your information.',
    category: 'Privacy & Security',
    tags: ['privacy', 'security', 'gdpr', 'encryption']
  }
];

export const HelpSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tours' | 'faq' | 'support'>('tours');
  const [activeTour, setActiveTour] = useState<HelpTour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { highContrast } = useAccessibleTheme();

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const startTour = (tour: HelpTour) => {
    setActiveTour(tour);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (activeTour && currentStep < activeTour.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTour = () => {
    setActiveTour(null);
    setCurrentStep(0);
  };

  const TourOverlay = () => {
    if (!activeTour) return null;

    const currentStepData = activeTour.steps[currentStep];

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-4">
          <Card className="p-6 bg-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {activeTour.steps.length}
                </p>
              </div>
              <button
                onClick={finishTour}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close tour"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-700 mb-6">{currentStepData.content}</p>

            <div className="flex justify-between items-center">
              <div className="flex space-x-1">
                {activeTour.steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                )}
                
                {currentStep < activeTour.steps.length - 1 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center space-x-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={finishTour}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 w-12 h-12 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors z-40"
        aria-label="Open help"
        title="Need help?"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
      
      <div className="fixed right-4 top-4 bottom-4 w-96 bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Help & Support</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close help"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'tours', label: 'Tours', icon: Play },
            { id: 'faq', label: 'FAQ', icon: BookOpen },
            { id: 'support', label: 'Support', icon: Mail }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'tours' && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Interactive Tours</h3>
                <p className="text-sm text-gray-600">
                  Take guided tours to learn how to use Budgeto effectively.
                </p>
              </div>

              {helpTours.map((tour) => (
                <Card key={tour.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => startTour(tour)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{tour.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{tour.description}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                        {tour.steps.length} steps
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 mt-1" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {filteredFAQ.map((item) => (
                <Card key={item.id} className="p-4">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer">
                      <h4 className="font-medium text-gray-900 pr-4">{item.question}</h4>
                      <ChevronRight size={16} className="text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-2">{item.answer}</p>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                </Card>
              ))}

              {filteredFAQ.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No FAQ items found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Get Help</h3>
                <p className="text-sm text-gray-600">
                  Need more help? Here are ways to get in touch with our support team.
                </p>
              </div>

              <Card className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Mail className="w-5 h-5 text-primary-500" />
                  <h4 className="font-medium text-gray-900">Email Support</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Send us an email for detailed support and technical issues.
                </p>
                <a
                  href="mailto:support@budgeto.app"
                  className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                >
                  <span>support@budgeto.app</span>
                  <ExternalLink size={14} />
                </a>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-gray-900">Live Chat</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Chat with our support team in real-time during business hours.
                </p>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Start Chat (Coming Soon)
                </button>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900">User Guide</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Comprehensive documentation covering all features.
                </p>
                <a
                  href="/USER_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                >
                  <span>View Full Guide</span>
                  <ExternalLink size={14} />
                </a>
              </Card>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Response Times</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>🔧 Technical issues: Within 24 hours</div>
                  <div>💬 General inquiries: Within 48 hours</div>
                  <div>🐛 Bug reports: Within 72 hours</div>
                  <div>🚨 Security issues: Immediate response</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <TourOverlay />
    </>
  );
};

export default HelpSystem;