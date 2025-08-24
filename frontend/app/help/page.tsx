"use client";

import React, { useState } from 'react';
import { Mail, MessageCircle, BookOpen, ExternalLink, Users, Zap } from 'lucide-react';
import { Card } from '@/components/ui/UIComponents';
import FAQ from '@/components/help/FAQ';
import { ContextualHelp, helpContent } from '@/components/help/Tooltip';

const HelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'support'>('faq');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Budgeto Help Center 🎓
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to master your finances with Budgeto. 
            From basic setup to advanced features, we've got you covered!
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="w-6 h-6 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Quick Start</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              New to Budgeto? Get up and running in minutes with our step-by-step guide.
            </p>
            <a
              href="/quick-start"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center space-x-1"
            >
              <span>Start Guide</span>
              <ExternalLink size={12} />
            </a>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="w-6 h-6 text-green-500" />
              <h3 className="font-semibold text-gray-900">User Guide</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Comprehensive documentation covering all features and functionality.
            </p>
            <a
              href="/USER_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center space-x-1"
            >
              <span>View Guide</span>
              <ExternalLink size={12} />
            </a>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Community</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Connect with other students, share tips, and get help from the community.
            </p>
            <a
              href="mailto:community@budgeto.app"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center space-x-1"
            >
              <span>Join Community</span>
              <ExternalLink size={12} />
            </a>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'faq', label: 'FAQ', icon: MessageCircle },
                { id: 'guides', label: 'Feature Guides', icon: BookOpen },
                { id: 'support', label: 'Contact Support', icon: Mail }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'faq' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-gray-600">
                    Find quick answers to common questions about using Budgeto.
                  </p>
                </div>
                <FAQ 
                  searchable={true}
                  categoryFilter={true}
                  showRating={true}
                  maxResults={50}
                />
              </div>
            )}
            {activeTab === 'guides' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Feature Guides
                  </h2>
                  <p className="text-gray-600">
                    Detailed guides for specific features and workflows.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Quick Start Guide</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get started with Budgeto in just a few minutes.
                    </p>
                    <a
                      href="/quick-start"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Start Guide →
                    </a>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">User Documentation</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Comprehensive guide covering all features.
                    </p>
                    <a
                      href="/USER_GUIDE.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Documentation →
                    </a>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Contact Support
                  </h2>
                  <p className="text-gray-600">
                    Need more help? Our support team is here to assist you.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Mail className="w-6 h-6 text-primary-500" />
                      <h3 className="font-semibold text-gray-900">Email Support</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      For detailed support and technical issues.
                    </p>
                    <a
                      href="mailto:support@budgeto.app"
                      className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                    >
                      <span>support@budgeto.app</span>
                      <ExternalLink size={14} />
                    </a>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <MessageCircle className="w-6 h-6 text-green-500" />
                      <h3 className="font-semibold text-gray-900">Live Chat</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Quick help during business hours (Coming Soon).
                    </p>
                    <button 
                      className="text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      Chat not available yet
                    </button>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;