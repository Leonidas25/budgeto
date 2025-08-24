"use client";

import React from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './UIComponents';

// Loading Skeleton Components
export const TransactionSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="container-mobile py-6 space-y-6">
    {/* Header skeleton */}
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>

    {/* Cards skeleton */}
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse bg-white rounded-xl p-4 border border-gray-100">
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export const BudgetSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>
          <div className="space-x-2 flex">
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="container-mobile py-6 space-y-6">
    {/* Level card skeleton */}
    <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-8 bg-white bg-opacity-50 rounded w-24" />
          <div className="h-4 bg-white bg-opacity-50 rounded w-32" />
        </div>
        <div className="w-16 h-16 bg-white bg-opacity-50 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white bg-opacity-50 rounded w-full" />
        <div className="h-3 bg-white bg-opacity-50 rounded w-full" />
        <div className="h-4 bg-white bg-opacity-50 rounded w-3/4" />
      </div>
    </div>

    {/* Stats grid skeleton */}
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

// Error Display Components
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again."
}) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-red-500" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-600 text-center mb-6 max-w-md">{message}</p>
    {error && process.env.NODE_ENV === 'development' && (
      <details className="mb-4 p-4 bg-gray-100 rounded-lg max-w-md">
        <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
        <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap">{error.message}</pre>
      </details>
    )}
    {resetError && (
      <Button onClick={resetError} variant="primary">
        Try Again
      </Button>
    )}
  </div>
);

interface NetworkErrorProps {
  onRetry?: () => void;
  isOnline?: boolean;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, isOnline = true }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      {isOnline ? <WifiOff className="w-8 h-8 text-gray-400" /> : <Wifi className="w-8 h-8 text-gray-400" />}
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {isOnline ? 'Connection Problem' : 'No Internet Connection'}
    </h3>
    <p className="text-gray-600 text-center mb-6 max-w-sm">
      {isOnline 
        ? 'Unable to connect to our servers. Please check your connection and try again.'
        : 'Please check your internet connection and try again.'
      }
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" icon={RefreshCw}>
        Retry
      </Button>
    )}
  </div>
);

// Loading Overlay Component
interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = "Loading...", 
  className 
}) => (
  <div className={cn('loading-overlay', className)}>
    <div className="flex flex-col items-center space-y-3">
      <div className="spinner-lg" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

// Inline Loading States
export const InlineLoader: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-8">
    <div className="flex items-center space-x-3">
      <div className="spinner" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  </div>
);

export const ButtonLoader: React.FC<{ message?: string }> = ({ message = "Processing..." }) => (
  <div className="flex items-center space-x-2">
    <div className="spinner" />
    <span>{message}</span>
  </div>
);

// State Management Hook for Loading/Error
export const useAsyncState = <T,>(initialData?: T) => {
  const [data, setData] = React.useState<T | undefined>(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = React.useCallback(async (asyncFunction: () => Promise<T>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData
  };
};

// Retry Hook for Failed Requests
export const useRetry = (maxRetries: number = 3) => {
  const [retryCount, setRetryCount] = React.useState(0);

  const retry = React.useCallback(async <T,>(
    asyncFunction: () => Promise<T>,
    onError?: (error: Error, attempt: number) => void
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFunction();
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (onError) {
          onError(lastError, attempt + 1);
        }
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff: wait 1s, 2s, 4s...
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setRetryCount(maxRetries);
    throw lastError!;
  }, [maxRetries]);

  return { retry, retryCount, setRetryCount };
};

// Toast Notification System
interface ToastContextType {
  showToast: (toast: ToastOptions) => void;
  hideToast: (id: string) => void;
}

interface ToastOptions {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<(ToastOptions & { id: string })[]>([]);

  const showToast = React.useCallback((toast: ToastOptions) => {
    const id = toast.id || Date.now().toString();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    if (!toast.persistent && toast.duration !== 0) {
      setTimeout(() => {
        hideToast(id);
      }, toast.duration || 5000);
    }
  }, []);

  const hideToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const value = React.useMemo(() => ({
    showToast,
    hideToast
  }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => hideToast(toast.id)}
            autoClose={!toast.persistent}
            duration={toast.duration}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Toast Component (imported from UIComponents)
const Toast: React.FC<{
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}> = ({
  type = 'info',
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={cn(
      'max-w-sm w-full bg-white border rounded-lg shadow-lg animate-slide-in-right',
      typeClasses[type]
    )}>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {title && (
              <h4 className="font-medium mb-1">{title}</h4>
            )}
            <p className="text-sm">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-3 text-current opacity-70 hover:opacity-100 focus:outline-none"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};