"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn, formatCurrency, formatRelativeDate } from '@/lib/utils';

interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  timestamp: string;
  state: 'Pending' | 'Approved';
  source: string;
}

interface SwipeableTransactionProps {
  transaction: Transaction;
  onApprove: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit?: (id: number) => void;
}

export const SwipeableTransaction: React.FC<SwipeableTransactionProps> = ({
  transaction,
  onApprove,
  onDelete,
  onEdit
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const isIncome = transaction.type === 'income';
  const isPending = transaction.state === 'Pending';
  const SWIPE_THRESHOLD = 100; // pixels needed to trigger action
  const MAX_DRAG = 150; // maximum drag distance

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isPending) return;
    
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isPending) return;

    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // Limit the drag distance
    const limitedDeltaX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
    setDragX(limitedDeltaX);
    
    // Determine direction
    if (Math.abs(limitedDeltaX) > 20) {
      setDragDirection(limitedDeltaX > 0 ? 'right' : 'left');
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isPending) return;

    const deltaX = currentX.current - startX.current;
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swiped right - approve
        onApprove(transaction.id);
      } else {
        // Swiped left - delete
        onDelete(transaction.id);
      }
    }
    
    // Reset state
    setDragX(0);
    setIsDragging(false);
    setDragDirection(null);
    startX.current = 0;
    currentX.current = 0;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPending) return;
    
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isPending) return;

    currentX.current = e.clientX;
    const deltaX = currentX.current - startX.current;
    
    const limitedDeltaX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
    setDragX(limitedDeltaX);
    
    if (Math.abs(limitedDeltaX) > 20) {
      setDragDirection(limitedDeltaX > 0 ? 'right' : 'left');
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !isPending) return;

    const deltaX = currentX.current - startX.current;
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        onApprove(transaction.id);
      } else {
        onDelete(transaction.id);
      }
    }
    
    setDragX(0);
    setIsDragging(false);
    setDragDirection(null);
    startX.current = 0;
    currentX.current = 0;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const getBackgroundColor = () => {
    if (!isDragging || !dragDirection) return 'bg-white';
    
    const opacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
    
    if (dragDirection === 'right') {
      return `bg-green-${Math.floor(opacity * 100) + 50}`;
    } else {
      return `bg-red-${Math.floor(opacity * 100) + 50}`;
    }
  };

  const getSwipeIndicator = () => {
    if (!isDragging || !dragDirection || Math.abs(dragX) < 30) return null;

    const isNearThreshold = Math.abs(dragX) > SWIPE_THRESHOLD * 0.7;

    if (dragDirection === 'right') {
      return (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600">
          <CheckCircle className={cn('w-6 h-6 mr-2', isNearThreshold && 'animate-bounce')} />
          <span className="font-medium">Approve</span>
        </div>
      );
    } else {
      return (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-red-600">
          <span className="font-medium">Delete</span>
          <XCircle className={cn('w-6 h-6 ml-2', isNearThreshold && 'animate-bounce')} />
        </div>
      );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-6 bg-gray-100">
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-6 h-6 mr-2" />
          <span className="font-medium">Approve</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </div>
        <div className="flex items-center text-red-600">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="font-medium">Delete</span>
          <XCircle className="w-6 h-6 ml-2" />
        </div>
      </div>

      {/* Main transaction card */}
      <div
        ref={cardRef}
        className={cn(
          'relative bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-200',
          isDragging ? getBackgroundColor() : 'bg-white',
          isPending && 'cursor-grab active:cursor-grabbing',
          'select-none' // Prevent text selection during drag
        )}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Swipe indicator overlay */}
        {getSwipeIndicator()}

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Transaction type indicator */}
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold',
                isIncome ? 'bg-green-500' : 'bg-red-500'
              )}>
                {isIncome ? '+' : '-'}
              </div>

              {/* Transaction details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {transaction.description || 'No description'}
                  </h3>
                  {isPending && (
                    <div className="flex items-center space-x-1">
                      <Clock size={14} className="text-orange-500 flex-shrink-0" />
                      <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                        Pending
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span className="truncate">{transaction.category}</span>
                  <span>•</span>
                  <span className="whitespace-nowrap">{formatRelativeDate(transaction.timestamp)}</span>
                  <span>•</span>
                  <span className="capitalize truncate">{transaction.source}</span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right ml-4">
              <div className={cn(
                'text-lg font-bold',
                isIncome ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(transaction.amount)}
              </div>
              
              {/* Action buttons for non-pending or fallback */}
              {(!isPending || !isDragging) && isPending && (
                <div className="flex items-center space-x-1 mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(transaction.id);
                    }}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-area"
                    title="Approve"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(transaction.id);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-area"
                    title="Delete"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Swipe instructions for first-time users */}
      {isPending && !isDragging && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none">
          <div className="text-xs text-gray-500 text-center py-2">
            ← Swipe to delete • Swipe to approve →
          </div>
        </div>
      )}
    </div>
  );
};

// List component for multiple swipeable transactions
interface SwipeableTransactionListProps {
  transactions: Transaction[];
  onApprove: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit?: (id: number) => void;
  loading?: boolean;
}

export const SwipeableTransactionList: React.FC<SwipeableTransactionListProps> = ({
  transactions,
  onApprove,
  onDelete,
  onEdit,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions</h3>
        <p className="text-gray-500">
          Your transactions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <SwipeableTransaction
          key={transaction.id}
          transaction={transaction}
          onApprove={onApprove}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};