"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, ArrowUpDown, DollarSign, Tag, Zap } from 'lucide-react';
import { Input, Select, Button, Card } from './UIComponents';
import { cn, formatCurrency } from '@/lib/utils';

interface FilterOptions {
  search: string;
  category: string;
  type: 'all' | 'income' | 'expense';
  source: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateStart: string;
  customDateEnd: string;
  amountMin: string;
  amountMax: string;
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
}

interface TransactionFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  transactions: any[];
  loading?: boolean;
}

const CATEGORIES = [
  'Food', 'Drinks', 'Transport', 'Shopping', 'Entertainment', 
  'Health', 'Education', 'Travel', 'Bills', 'Other'
];

const SOURCES = ['Manual', 'SMS', 'Telegram'];

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  onFiltersChange,
  transactions,
  loading = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: '',
    type: 'all',
    source: '',
    dateRange: 'all',
    customDateStart: '',
    customDateEnd: '',
    amountMin: '',
    amountMax: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      search: '',
      category: '',
      type: 'all',
      source: '',
      dateRange: 'all',
      customDateStart: '',
      customDateEnd: '',
      amountMin: '',
      amountMax: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    setShowAdvanced(false);
  };

  const hasActiveFilters = () => {
    return filters.search || filters.category || filters.type !== 'all' || 
           filters.source || filters.dateRange !== 'all' || 
           filters.amountMin || filters.amountMax;
  };

  const getFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.type !== 'all') count++;
    if (filters.source) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.amountMin || filters.amountMax) count++;
    return count;
  };

  return (
    <Card className="space-y-4" padding="md">
      {/* Search and Quick Filters */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors",
            showAdvanced 
              ? "bg-primary-50 border-primary-200 text-primary-700" 
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {getFilterCount() > 0 && (
            <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {getFilterCount()}
            </span>
          )}
        </button>
        
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Clear</span>
          </button>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Type Filter Chips */}
        {(['all', 'income', 'expense'] as const).map((type) => (
          <button
            key={type}
            onClick={() => updateFilter('type', type)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filters.type === type
                ? "bg-primary-100 text-primary-700 border border-primary-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {type === 'all' ? 'All' : type === 'income' ? '💰 Income' : '💸 Expense'}
          </button>
        ))}
        
        {/* Date Range Chips */}
        {(['today', 'week', 'month'] as const).map((range) => (
          <button
            key={range}
            onClick={() => updateFilter('dateRange', range)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filters.dateRange === range
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {range === 'today' ? '📅 Today' : 
             range === 'week' ? '📅 This Week' : 
             '📅 This Month'}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Zap className="inline w-4 h-4 mr-1" />
                Source
              </label>
              <select
                value={filters.source}
                onChange={(e) => updateFilter('source', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Sources</option>
                {SOURCES.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min amount"
                value={filters.amountMin}
                onChange={(e) => updateFilter('amountMin', e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max amount"
                value={filters.amountMax}
                onChange={(e) => updateFilter('amountMax', e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Custom Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={filters.customDateStart}
                  onChange={(e) => updateFilter('customDateStart', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.customDateEnd}
                  onChange={(e) => updateFilter('customDateEnd', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ArrowUpDown className="inline w-4 h-4 mr-1" />
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilter('sortOrder', e.target.value as any)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {hasActiveFilters() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <span className="font-medium">
                {loading ? 'Filtering...' : `Showing ${transactions.length} transactions`}
              </span>
              {getFilterCount() > 0 && (
                <span className="ml-1">
                  with {getFilterCount()} filter{getFilterCount() > 1 ? 's' : ''} applied
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

// Export the filter types for use in parent components
export type { FilterOptions };