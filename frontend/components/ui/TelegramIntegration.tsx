"use client";

import React, { useState, useEffect } from 'react';
import { Bot, Link, Unlink, Check, Copy, MessageCircle, Smartphone, Zap } from 'lucide-react';
import { Card } from './UIComponents';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface TelegramStatus {
  is_linked: boolean;
  telegram_id?: string;
  instructions: {
    step_1: string;
    step_2: string;
    step_3: string;
  };
}

interface TelegramIntegrationProps {
  className?: string;
}

export const TelegramIntegration: React.FC<TelegramIntegrationProps> = ({
  className
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTelegramStatus();
  }, []);

  const fetchTelegramStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.telegram.getMyStatus();
      setStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch Telegram status:', err);
      setError('Failed to load Telegram status');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your Telegram account?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.telegram.unlink();
      await fetchTelegramStatus();
    } catch (err: any) {
      console.error('Failed to unlink Telegram:', err);
      setError(err.response?.data?.detail || 'Failed to unlink Telegram account');
    } finally {
      setLoading(false);
    }
  };

  const copyLinkCommand = () => {
    if (user?.id) {
      const command = `/link ${user.id}`;
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && !status) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse mt-1"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6 border-red-200", className)}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">Telegram Integration</h3>
            <p className="text-sm text-red-600">Failed to load</p>
          </div>
        </div>
        <div className="text-center text-red-600 py-4">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchTelegramStatus}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            status?.is_linked ? "bg-green-100" : "bg-blue-100"
          )}>
            <Bot className={cn(
              "w-5 h-5",
              status?.is_linked ? "text-green-600" : "text-blue-600"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Telegram Bot</h3>
            <p className="text-sm text-gray-600">
              {status?.is_linked ? 'Connected' : 'Add transactions via Telegram'}
            </p>
          </div>
        </div>
        {status?.is_linked && (
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Connected</span>
          </div>
        )}
      </div>

      {status?.is_linked ? (
        // Connected State
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Account Connected
              </span>
            </div>
            <p className="text-sm text-green-700">
              You can now add transactions directly through our Telegram bot!
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">What you can do:</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Natural Language</p>
                  <p className="text-xs text-gray-600">
                    "Coffee 3.50" or "Μεσημεριανό ταβέρνα 15 ευρώ"
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Quick Commands</p>
                  <p className="text-xs text-gray-600">
                    /budget, /stats, /today for instant insights
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Instant Approval</p>
                  <p className="text-xs text-gray-600">
                    Approve or edit transactions with inline buttons
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleUnlink}
              disabled={loading}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              <Unlink className="w-4 h-4" />
              <span>Disconnect Telegram</span>
            </button>
          </div>
        </div>
      ) : (
        // Setup Instructions
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Quick Setup (2 minutes)
              </span>
            </div>
            <p className="text-sm text-blue-700">
              Connect your Telegram to add transactions on-the-go with natural language!
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Find our bot on Telegram</p>
                <p className="text-xs text-gray-600 mb-2">
                  Search for <code className="bg-gray-100 px-1 rounded">@BudgetoBot</code> or click the link
                </p>
                <a
                  href="https://t.me/BudgetoBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Bot className="w-4 h-4" />
                  <span>Open Telegram Bot</span>
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Send the link command</p>
                <p className="text-xs text-gray-600 mb-2">
                  Copy and send this command to the bot:
                </p>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                  <code className="text-sm font-mono text-gray-800 flex-1">
                    /link {user?.id}
                  </code>
                  <button
                    onClick={copyLinkCommand}
                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Start adding transactions!</p>
                <p className="text-xs text-gray-600 mb-2">
                  Try these examples:
                </p>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="bg-gray-50 rounded px-2 py-1 font-mono">Coffee 3.50</div>
                  <div className="bg-gray-50 rounded px-2 py-1 font-mono">Lunch taverna 15 euros</div>
                  <div className="bg-gray-50 rounded px-2 py-1 font-mono">Φαγητό ταβέρνα 18 ευρώ</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Why use the Telegram bot?</h4>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-blue-600" />
                <span>Instant tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-3 h-3 text-green-600" />
                <span>Natural language</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="w-3 h-3 text-purple-600" />
                <span>Always accessible</span>
              </div>
              <div className="flex items-center space-x-2">
                <Bot className="w-3 h-3 text-orange-600" />
                <span>AI-powered</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TelegramIntegration;