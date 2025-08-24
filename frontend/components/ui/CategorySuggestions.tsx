"use client";

import React, { useState, useEffect } from 'react';
import { Lightbulb, Check, X, TrendingUp, Zap, Target, Brain, ChevronRight } from 'lucide-react';
import { Card, Badge } from './UIComponents';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface CategorySuggestion {
  category: string;
  confidence: number;
  confidence_level: string;
  reasons: string[];
  explanation: string;
}

interface CategorySuggestionsProps {
  description: string;
  amount: number;
  transactionType?: 'income' | 'expense';
  onCategorySelect: (category: string) => void;
  selectedCategory?: string;
  className?: string;
}

export const CategorySuggestions: React.FC<CategorySuggestionsProps> = ({
  description,
  amount,
  transactionType = 'expense',
  onCategorySelect,
  selectedCategory,
  className
}) => {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [popularCategories, setPopularCategories] = useState<any[]>([]);

  useEffect(() => {
    if (description && amount > 0) {
      fetchSuggestions();
    }
  }, [description, amount, transactionType]);

  useEffect(() => {
    fetchPopularCategories();
  }, []);

  const fetchSuggestions = async () => {
    if (!description.trim() || amount <= 0) return;

    setLoading(true);
    try {
      const response = await api.transactions.suggestCategory({
        description,
        amount,
        transaction_type: transactionType,
        timestamp: new Date().toISOString()
      });
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch category suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularCategories = async () => {
    try {
      const response = await api.transactions.getPopularCategories();
      setPopularCategories(response.data?.popular_categories || []);
    } catch (error) {
      console.error('Failed to fetch popular categories:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.75) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (confidence >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <Target className="w-4 h-4" />;
    if (confidence >= 0.75) return <TrendingUp className="w-4 h-4" />;
    if (confidence >= 0.6) return <Zap className="w-4 h-4" />;
    return <Brain className="w-4 h-4" />;
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const visibleSuggestions = showAll ? suggestions : suggestions.slice(0, 3);

  if (!description && popularCategories.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border border-blue-200 bg-blue-50/50">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Smart Suggestions</h4>
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <div className="space-y-2">
            {visibleSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-sm",
                  selectedCategory === suggestion.category
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
                onClick={() => onCategorySelect(suggestion.category)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {suggestion.category}
                    </span>
                    {selectedCategory === suggestion.category && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <div className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                    getConfidenceColor(suggestion.confidence)
                  )}>
                    {getConfidenceIcon(suggestion.confidence)}
                    <span>{formatConfidence(suggestion.confidence)}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {suggestion.explanation}
                </p>

                {suggestion.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {suggestion.reasons.map((reason, reasonIndex) => (
                      <span
                        key={reasonIndex}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {suggestions.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full p-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center space-x-1"
              >
                <span>{showAll ? 'Show less' : `Show ${suggestions.length - 3} more`}</span>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  showAll && "rotate-90"
                )} />
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Popular Categories */}
      {popularCategories.length > 0 && (
        <Card>
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">Your Frequent Categories</h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {popularCategories.slice(0, 6).map((category, index) => (
              <button
                key={index}
                onClick={() => onCategorySelect(category.category)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  selectedCategory === category.category
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {category.category}
                  </span>
                  {selectedCategory === category.category && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{category.usage_count} times</span>
                  <span>•</span>
                  <span>avg €{category.average_amount}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Manual Category Input */}
      <Card className="border border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-5 h-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Custom Category</h4>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter custom category..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                onCategorySelect(e.currentTarget.value.trim());
                e.currentTarget.value = '';
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value.trim()) {
                onCategorySelect(input.value.trim());
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Add
          </button>
        </div>
      </Card>

      {/* Confidence Level Guide */}
      {suggestions.length > 0 && (
        <Card className="bg-gray-50 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-2">Confidence Levels</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-2 h-2 text-green-600" />
              </div>
              <span className="text-gray-600">90%+ Very High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-2 h-2 text-blue-600" />
              </div>
              <span className="text-gray-600">75%+ High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-100 rounded-full flex items-center justify-center">
                <Zap className="w-2 h-2 text-yellow-600" />
              </div>
              <span className="text-gray-600">60%+ Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-100 rounded-full flex items-center justify-center">
                <Brain className="w-2 h-2 text-orange-600" />
              </div>
              <span className="text-gray-600">40%+ Low</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CategorySuggestions;