import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper functions for common UI operations
export function formatCurrency(amount: number, currency: string = '€'): string {
  return `${currency}${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffInHours = Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return 'Today';
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)} days ago`;
  } else {
    return formatDate(date);
  }
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 75) return 'text-yellow-600';
  return 'text-green-600';
}

export function getBudgetStatusColor(spent: number, budget: number): string {
  const percentage = (spent / budget) * 100;
  return getProgressColor(percentage);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Format large numbers with K/M suffixes for better display
export function formatCompactCurrency(amount: number, currency = '€'): string {
  if (Math.abs(amount) >= 1000000) {
    return `${currency}${(amount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    return `${currency}${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
}

// Calculate percentage with safe division
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min((value / total) * 100, 100);
}

// Get gamification level color
export function getLevelColor(level: number): string {
  if (level >= 10) return 'from-purple-500 to-pink-500';
  if (level >= 7) return 'from-blue-500 to-purple-500';
  if (level >= 4) return 'from-green-500 to-blue-500';
  return 'from-yellow-500 to-green-500';
}

// Greek-specific utilities
export function getGreekMonth(): string {
  const months = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ];
  return months[new Date().getMonth()];
}

// Student-friendly motivational messages
export function getMotivationalMessage(percentage: number): string {
  if (percentage <= 25) return '🎯 Great start! Keep it up!';
  if (percentage <= 50) return '📈 You\'re on track!';
  if (percentage <= 75) return '⚠️ Watch your spending!';
  if (percentage <= 90) return '🚨 Almost at your limit!';
  return '💸 Over budget - time to adjust!';
}