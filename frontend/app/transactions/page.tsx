"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Filter, ArrowUpDown, CheckCircle, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';

type TabType = 'all' | 'pending' | 'approved';

export default function TransactionsPage() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
  }, [isAuthenticated, activeTab]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      let response;
      
      if (activeTab === 'pending') {
        response = await api.transactions.getPending();
      } else {
        const filters = activeTab === 'approved' ? { state: 'Approved' as const } : {};
        response = await api.transactions.getAll(filters);
      }
      
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const sortedTransactions = [...transactions].sort((a: any, b: any) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  return (
    <div className=\"container-mobile py-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between mb-6\">
        <div>
          <h1 className=\"text-2xl font-bold text-gray-900\">Transactions</h1>
          <p className=\"text-gray-600\">Track your income and expenses</p>
        </div>
        <Link 
          href=\"/transactions/add\" 
          className=\"btn-primary flex items-center space-x-2\"
        >
          <Plus size={18} />
          <span>Add</span>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className=\"flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg\">
        {[
          { id: 'all', label: 'All', count: transactions.length },
          { id: 'pending', label: 'Pending', count: transactions.filter((t: any) => t.state === 'Pending').length },
          { id: 'approved', label: 'Approved', count: transactions.filter((t: any) => t.state === 'Approved').length },
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

      {/* Sort Controls */}
      <div className=\"flex items-center justify-between mb-4\">
        <div className=\"flex items-center space-x-2\">
          <Filter size={16} className=\"text-gray-400\" />
          <span className=\"text-sm text-gray-600\">Filters</span>
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className=\"flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900\"
        >
          <ArrowUpDown size={16} />
          <span>{sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}</span>
        </button>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className=\"text-center py-12\">
          <div className=\"w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Loading transactions...</p>
        </div>
      ) : sortedTransactions.length === 0 ? (
        <div className=\"text-center py-12\">
          <div className=\"text-4xl mb-4\">💳</div>
          <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">No transactions yet</h3>
          <p className=\"text-gray-600 mb-6\">
            {activeTab === 'pending' ? 'No pending transactions' : 'Start tracking your finances by adding your first transaction'}
          </p>
          <Link href=\"/transactions/add\" className=\"btn-primary\">
            Add Transaction
          </Link>
        </div>
      ) : (
        <div className=\"space-y-3\">
          {sortedTransactions.map((transaction: any) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionCard({ 
  transaction, 
  onApprove, 
  onDelete 
}: { 
  transaction: any; 
  onApprove: (id: number) => void; 
  onDelete: (id: number) => void; 
}) {
  const isIncome = transaction.type === 'income';
  const isPending = transaction.state === 'Pending';
  
  return (
    <div className=\"card-hover\">
      <div className=\"flex items-center justify-between\">
        <div className=\"flex-1\">
          <div className=\"flex items-center space-x-3\">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {isIncome ? '↗️' : '↙️'}
            </div>
            
            <div className=\"flex-1\">
              <div className=\"flex items-center space-x-2\">
                <h3 className=\"font-medium text-gray-900\">
                  {transaction.description || 'No description'}
                </h3>
                {isPending && (
                  <div className=\"flex items-center space-x-1\">
                    <Clock size={14} className=\"text-orange-500\" />
                    <span className=\"text-xs text-orange-600 font-medium\">Pending</span>
                  </div>
                )}
              </div>
              
              <div className=\"flex items-center space-x-4 text-sm text-gray-500\">
                <span>{transaction.category}</span>
                <span>•</span>
                <span>{new Date(transaction.timestamp).toLocaleDateString()}</span>
                <span>•</span>
                <span className=\"capitalize\">{transaction.source}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className=\"flex items-center space-x-3\">
          <div className={`text-lg font-bold ${
            isIncome ? 'text-green-600' : 'text-red-600'
          }`}>
            {isIncome ? '+' : '-'}€{transaction.amount}
          </div>
          
          {isPending && (
            <div className=\"flex items-center space-x-1\">
              <button
                onClick={() => onApprove(transaction.id)}
                className=\"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors\"
                title=\"Approve\"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => onDelete(transaction.id)}
                className=\"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors\"
                title=\"Delete\"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}