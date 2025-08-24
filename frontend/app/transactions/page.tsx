"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useView, useResponsive } from '@/lib/view-context';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SwipeableTransactionList } from '@/components/ui/SwipeableTransaction';
import { TransactionFilters, FilterOptions } from '@/components/ui/TransactionFilters';
import { NoTransactionsEmpty, NoSearchResultsEmpty, TransactionSkeleton } from '@/components/ui/EmptyStates';
import { DesktopContentContainer, DesktopCard } from '@/components/layout/DesktopLayout';
import { Plus } from 'lucide-react';
import Link from 'next/link';

type TabType = 'all' | 'pending' | 'approved';

export default function TransactionsPage() {
  const { isAuthenticated } = useAuth();
  const { isDesktop, isMobile } = useView();
  const { containerClass, padding } = useResponsive();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({} as FilterOptions);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['all', 'pending', 'approved'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
    }
  }, [isAuthenticated]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // Load all transactions for filtering
      const response = await api.transactions.getAll();
      setAllTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort transactions based on current filters and tab
  const filteredTransactions = useMemo(() => {
    if (!allTransactions.length) return [];

    let filtered = [...allTransactions];

    // Tab filtering
    if (activeTab === 'pending') {
      filtered = filtered.filter((t: any) => t.state === 'Pending');
    } else if (activeTab === 'approved') {
      filtered = filtered.filter((t: any) => t.state === 'Approved');
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((t: any) =>
        t.description?.toLowerCase().includes(searchLower) ||
        t.category?.toLowerCase().includes(searchLower) ||
        t.source?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((t: any) => t.type === filters.type);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((t: any) => t.category === filters.category);
    }

    // Source filter
    if (filters.source) {
      filtered = filtered.filter((t: any) => t.source === filters.source);
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((t: any) => {
        const transactionDate = new Date(t.timestamp);
        
        switch (filters.dateRange) {
          case 'today':
            return transactionDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            return transactionDate >= monthAgo;
          case 'custom':
            if (filters.customDateStart && filters.customDateEnd) {
              const startDate = new Date(filters.customDateStart);
              const endDate = new Date(filters.customDateEnd);
              return transactionDate >= startDate && transactionDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Amount range filter
    if (filters.amountMin || filters.amountMax) {
      filtered = filtered.filter((t: any) => {
        const amount = parseFloat(t.amount);
        if (filters.amountMin && amount < parseFloat(filters.amountMin)) return false;
        if (filters.amountMax && amount > parseFloat(filters.amountMax)) return false;
        return true;
      });
    }

    // Sorting
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'amount':
          comparison = parseFloat(a.amount) - parseFloat(b.amount);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'date':
        default:
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [allTransactions, activeTab, filters]);

  const handleApprove = async (transactionId: number) => {
    try {
      await api.transactions.approve(transactionId);
      loadTransactions(); // Refresh list
    } catch (error) {
      console.error('Failed to approve transaction:', error);
    }
  };

  const handleDelete = async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await api.transactions.delete(transactionId);
      loadTransactions(); // Refresh list
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Get counts for tabs based on all transactions
  const tabCounts = useMemo(() => {
    return {
      all: allTransactions.length,
      pending: allTransactions.filter((t: any) => t.state === 'Pending').length,
      approved: allTransactions.filter((t: any) => t.state === 'Approved').length,
    };
  }, [allTransactions]);

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  return (
    <div className={cn(
      isDesktop ? "container-content py-8" : "container-mobile py-6"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between",
        isDesktop ? "mb-8" : "mb-6"
      )}>
        <div>
          <h1 className={cn(
            "font-bold text-gray-900",
            isDesktop ? "text-3xl" : "text-2xl"
          )}>
            Transactions
          </h1>
          <p className={cn(
            "text-gray-600",
            isDesktop ? "text-lg" : "text-base"
          )}>
            Track your income and expenses
          </p>
        </div>
        <Link 
          href="/transactions/add" 
          className={cn(
            "btn-primary flex items-center space-x-2",
            isDesktop ? "px-6 py-3" : "px-4 py-2"
          )}
        >
          <Plus size={isDesktop ? 20 : 18} />
          <span>Add</span>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'all', label: 'All', count: tabCounts.all },
          { id: 'pending', label: 'Pending', count: tabCounts.pending },
          { id: 'approved', label: 'Approved', count: tabCounts.approved },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TransactionFilters
          onFiltersChange={handleFiltersChange}
          transactions={filteredTransactions}
          loading={loading}
        />
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        allTransactions.length === 0 ? (
          <NoTransactionsEmpty 
            showAddButton={true} 
            tab={activeTab}
          />
        ) : (
          <NoSearchResultsEmpty 
            query={filters.search || 'your current filters'}
            onClear={() => setFilters({} as FilterOptions)}
          />
        )
      ) : (
        <SwipeableTransactionList
          transactions={filteredTransactions}
          onApprove={handleApprove}
          onDelete={handleDelete}
          loading={loading}
        />
      )}
    </div>
  );
}