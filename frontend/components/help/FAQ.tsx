"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/UIComponents';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful?: number;
  notHelpful?: number;
  relatedLinks?: Array<{ label: string; url: string }>;
}

interface FAQProps {
  searchable?: boolean;
  categoryFilter?: boolean;
  showRating?: boolean;
  maxResults?: number;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: 'account-setup',
    question: 'How do I set up my Budgeto account?',
    answer: 'Visit the registration page, fill in your details, choose your student archetype (Allowance, Jobber, Traveler, or Saver), and verify your email. Then complete your profile in Settings to personalize your experience.',
    category: 'Getting Started',
    tags: ['registration', 'setup', 'archetype', 'profile'],
    helpful: 23,
    notHelpful: 2,
    relatedLinks: [
      { label: 'Quick Start Guide', url: '/quick-start' },
      { label: 'Profile Settings', url: '/settings' }
    ]
  },
  {
    id: 'first-transaction',
    question: 'How do I add my first transaction?',
    answer: 'Click the "+" floating button on your dashboard, enter the amount, description, and select a category. Our AI will suggest categories based on your description. Save to complete your first transaction!',
    category: 'Getting Started',
    tags: ['transaction', 'add', 'first', 'category'],
    helpful: 31,
    notHelpful: 1,
    relatedLinks: [
      { label: 'Transaction Guide', url: '/help#transactions' }
    ]
  },

  // SMS Integration
  {
    id: 'sms-not-working',
    question: 'Why aren\'t my SMS messages being parsed?',
    answer: 'Make sure you\'ve granted SMS permissions in your device settings and enabled parsing for your bank in Budgeto Settings. Supported banks include NBG, Eurobank, Alpha Bank, Piraeus, IRIS, PayPal, and Revolut. Some SMS formats may not be recognized - you can add these transactions manually.',
    category: 'SMS Integration',
    tags: ['sms', 'parsing', 'permissions', 'banks', 'troubleshooting'],
    helpful: 45,
    notHelpful: 8,
    relatedLinks: [
      { label: 'SMS Settings', url: '/settings?tab=sms' },
      { label: 'Supported Banks', url: '/help#sms-integration' }
    ]
  },
  {
    id: 'sms-accuracy',
    question: 'Can I improve SMS parsing accuracy?',
    answer: 'Yes! Enable parsing for all your banks, ensure SMS notifications are enabled in your banking app, and report any parsing errors to help us improve. The system learns from corrections and becomes more accurate over time.',
    category: 'SMS Integration',
    tags: ['sms', 'accuracy', 'parsing', 'improvement'],
    helpful: 19,
    notHelpful: 3
  },

  // Budgets
  {
    id: 'budget-setup',
    question: 'How do I create effective budgets?',
    answer: 'Start with realistic monthly limits based on your income. Common student categories include Food (€150-300), Transportation (€50-100), Education (€100-200), and Entertainment (€80-150). Track for a month to understand your patterns, then adjust accordingly.',
    category: 'Budgets',
    tags: ['budgets', 'limits', 'categories', 'students', 'monthly'],
    helpful: 38,
    notHelpful: 5,
    relatedLinks: [
      { label: 'Budget Management', url: '/budgets' },
      { label: 'Student Guide', url: '/help#budget-management' }
    ]
  },
  {
    id: 'budget-overspending',
    question: 'What happens if I go over budget?',
    answer: 'Budgeto will notify you when you\'re approaching or exceeding budget limits. You won\'t be prevented from spending, but you\'ll see visual indicators and receive insights to help you get back on track. Consider adjusting your budget or spending habits.',
    category: 'Budgets',
    tags: ['budget', 'overspending', 'limits', 'notifications'],
    helpful: 27,
    notHelpful: 2
  },

  // Telegram Bot
  {
    id: 'telegram-bot-setup',
    question: 'How do I set up the Telegram bot?',
    answer: 'Find @BudgetoBot on Telegram, start a conversation with /start, then link your account using "/link your_username". Verify the connection in Budgeto Settings under Integrations.',
    category: 'Integrations',
    tags: ['telegram', 'bot', 'setup', 'linking', 'commands'],
    helpful: 33,
    notHelpful: 4,
    relatedLinks: [
      { label: 'Telegram Settings', url: '/settings?tab=integrations' },
      { label: 'Bot Commands', url: '/help#telegram-bot' }
    ]
  },
  {
    id: 'telegram-commands',
    question: 'What commands does the Telegram bot support?',
    answer: 'Basic commands include /start, /help, /balance, /recent, and /add. You can also use natural language like "I spent 15€ on coffee" or "Add 25 euros for lunch". The bot understands Greek and English.',
    category: 'Integrations',
    tags: ['telegram', 'commands', 'natural language', 'greek', 'english'],
    helpful: 29,
    notHelpful: 1
  },

  // Gamification
  {
    id: 'xp-system',
    question: 'How does the XP and achievement system work?',
    answer: 'Earn XP by adding transactions (+5-10 XP), staying within budget (+20 XP), and reaching goals (+50-100 XP). Unlock Greek mythology-themed achievements as you level up. Check your profile to see progress and available achievements.',
    category: 'Gamification',
    tags: ['xp', 'achievements', 'leveling', 'mythology', 'rewards'],
    helpful: 41,
    notHelpful: 3,
    relatedLinks: [
      { label: 'Achievements', url: '/profile#achievements' }
    ]
  },

  // Transactions
  {
    id: 'category-suggestions',
    question: 'How does AI categorization work?',
    answer: 'Budgeto uses AI to suggest categories based on transaction descriptions, merchant names, and your spending patterns. The system provides confidence scores and learns from your corrections to improve suggestions over time.',
    category: 'Transactions',
    tags: ['ai', 'categories', 'suggestions', 'machine learning', 'confidence'],
    helpful: 36,
    notHelpful: 6
  },
  {
    id: 'edit-transactions',
    question: 'Can I edit or delete transactions?',
    answer: 'Yes! Click on any transaction to edit its details including amount, description, category, and date. You can also delete transactions you no longer need. Changes are saved automatically.',
    category: 'Transactions',
    tags: ['edit', 'delete', 'modify', 'transactions'],
    helpful: 25,
    notHelpful: 1
  },

  // Privacy & Security
  {
    id: 'data-privacy',
    question: 'Is my financial data secure?',
    answer: 'Yes! Budgeto uses end-to-end encryption, follows GDPR guidelines, and never sells your data. SMS parsing happens locally on your device. You have full control over your data and can export or delete it anytime.',
    category: 'Privacy & Security',
    tags: ['privacy', 'security', 'gdpr', 'encryption', 'data'],
    helpful: 52,
    notHelpful: 1,
    relatedLinks: [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Security Guide', url: '/help#privacy--security' }
    ]
  },
  {
    id: 'data-export',
    question: 'Can I export my data?',
    answer: 'Yes! Go to Settings → Data & Privacy to export your transaction history, budgets, and other data in CSV or JSON format. You can also request a complete data package that includes all your information.',
    category: 'Privacy & Security',
    tags: ['export', 'data', 'csv', 'json', 'backup'],
    helpful: 18,
    notHelpful: 2
  },

  // Technical Issues
  {
    id: 'app-slow',
    question: 'Why is the app running slowly?',
    answer: 'Try refreshing the page, clearing your browser cache, or restarting the app. Large amounts of transaction data can sometimes slow performance. Consider archiving old transactions or contact support if issues persist.',
    category: 'Technical Issues',
    tags: ['performance', 'slow', 'cache', 'troubleshooting'],
    helpful: 21,
    notHelpful: 4
  },
  {
    id: 'sync-issues',
    question: 'My data isn\'t syncing across devices',
    answer: 'Ensure you\'re logged into the same account on all devices and have a stable internet connection. Force refresh or log out and back in if sync issues persist. Contact support if problems continue.',
    category: 'Technical Issues',
    tags: ['sync', 'devices', 'internet', 'login'],
    helpful: 16,
    notHelpful: 3
  },

  // Features
  {
    id: 'weekly-insights',
    question: 'What are weekly insights?',
    answer: 'Weekly insights provide AI-powered analysis of your spending patterns with a touch of Greek humor. They highlight trends, suggest improvements, and celebrate your financial wins. Check your dashboard every Monday for new insights!',
    category: 'Features',
    tags: ['insights', 'weekly', 'analysis', 'ai', 'patterns'],
    helpful: 34,
    notHelpful: 2
  },
  {
    id: 'student-archetypes',
    question: 'What do the student archetypes mean?',
    answer: 'Archetypes personalize your experience: Allowance (regular family support), Jobber (part-time work income), Traveler (exchange/travel expenses), and Saver (focused on building savings). You can change your archetype in Settings anytime.',
    category: 'Features',
    tags: ['archetypes', 'student', 'allowance', 'jobber', 'traveler', 'saver'],
    helpful: 28,
    notHelpful: 3
  }
];

const categories = Array.from(new Set(faqData.map(item => item.category)));

export const FAQ: React.FC<FAQProps> = ({
  searchable = true,
  categoryFilter = true,
  showRating = true,
  maxResults = 50
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, { helpful: boolean; rated: boolean }>>({});

  const filteredFAQ = faqData
    .filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .slice(0, maxResults);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleRating = (itemId: string, isHelpful: boolean) => {
    setRatings(prev => ({
      ...prev,
      [itemId]: { helpful: isHelpful, rated: true }
    }));
    
    // In a real app, you would send this to the backend
    console.log(`FAQ ${itemId} rated as ${isHelpful ? 'helpful' : 'not helpful'}`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {(searchable || categoryFilter) && (
        <div className="space-y-4">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}
          
          {categoryFilter && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      {(searchQuery || selectedCategory) && (
        <p className="text-sm text-gray-600">
          Showing {filteredFAQ.length} of {faqData.length} articles
          {selectedCategory && ` in ${selectedCategory}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQ.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">No FAQ items found for your search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </Card>
        ) : (
          filteredFAQ.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const userRating = ratings[item.id];

            return (
              <Card key={item.id} className="p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex-1 pr-4">
                    <h3 className="font-medium text-gray-900 mb-1">{item.question}</h3>
                    <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                      {item.category}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="text-gray-400 flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-700 mb-4 leading-relaxed">{item.answer}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Related Links */}
                    {item.relatedLinks && item.relatedLinks.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Related:</h4>
                        <div className="space-y-1">
                          {item.relatedLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link.url}
                              className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                            >
                              <span>{link.label}</span>
                              <ExternalLink size={12} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rating */}
                    {showRating && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">Was this helpful?</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRating(item.id, true);
                              }}
                              disabled={userRating?.rated}
                              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
                                userRating?.helpful
                                  ? 'bg-green-100 text-green-700'
                                  : userRating?.rated
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                              }`}
                            >
                              <ThumbsUp size={14} />
                              <span>Yes</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRating(item.id, false);
                              }}
                              disabled={userRating?.rated}
                              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
                                userRating?.rated && !userRating?.helpful
                                  ? 'bg-red-100 text-red-700'
                                  : userRating?.rated
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
                              }`}
                            >
                              <ThumbsDown size={14} />
                              <span>No</span>
                            </button>
                          </div>
                        </div>
                        
                        {item.helpful && item.notHelpful && (
                          <div className="text-xs text-gray-500">
                            {item.helpful} helpful, {item.notHelpful} not helpful
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FAQ;