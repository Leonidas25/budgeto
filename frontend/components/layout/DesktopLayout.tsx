"use client";

import React, { ReactNode } from 'react';
import { DesktopNavigation } from './DesktopNavigation';
import { CompactViewToggle } from '@/components/ui/ViewToggle';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DesktopLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  className?: string;
}

export function DesktopLayout({ 
  children, 
  title, 
  subtitle, 
  headerActions,
  className 
}: DesktopLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Auto-generate title from pathname if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    const pathMap: Record<string, string> = {
      '/': 'Dashboard',
      '/transactions': 'Transactions',
      '/budgets': 'Budgets',
      '/stats': 'Statistics',
      '/settings': 'Settings',
      '/help': 'Help & Support'
    };
    
    return pathMap[pathname] || 'Budgeto';
  };

  const getPageSubtitle = () => {
    if (subtitle) return subtitle;
    
    const subtitleMap: Record<string, string> = {
      '/': 'Overview of your financial health',
      '/transactions': 'Manage and track your transactions',
      '/budgets': 'Plan and monitor your spending goals',
      '/stats': 'Insights and analytics about your finances',
      '/settings': 'Customize your app experience',
      '/help': 'Get help with using Budgeto'
    };
    
    return subtitleMap[pathname];
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <DesktopNavigation />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              {getPageSubtitle() && (
                <p className="text-sm text-gray-600 mt-1">
                  {getPageSubtitle()}
                </p>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {headerActions}
              
              {/* View Toggle */}
              <div className="border-l border-gray-200 pl-4">
                <CompactViewToggle />
              </div>
              
              {/* User Info */}
              {user && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Welcome back,</span>
                  <span className="font-medium text-gray-900">
                    {user.full_name?.split(' ')[0] || user.username}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
        <main className={cn(
          "flex-1 overflow-auto bg-gray-50",
          className
        )}>
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Specialized desktop content container with proper spacing
export function DesktopContentContainer({ 
  children, 
  maxWidth = '7xl',
  padding = '6',
  className 
}: {
  children: ReactNode;
  maxWidth?: string;
  padding?: string;
  className?: string;
}) {
  const maxWidthClass = `max-w-${maxWidth}`;
  const paddingClass = `p-${padding}`;
  
  return (
    <div className={cn(
      "mx-auto w-full",
      maxWidthClass,
      paddingClass,
      className
    )}>
      {children}
    </div>
  );
}

// Desktop grid system for optimal layout
export function DesktopGrid({ 
  children,
  columns = 3,
  gap = 6,
  className
}: {
  children: ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}) {
  const columnClass = `lg:grid-cols-${columns}`;
  const gapClass = `gap-${gap}`;
  
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2",
      columnClass,
      gapClass,
      className
    )}>
      {children}
    </div>
  );
}

// Desktop card with enhanced styling for larger screens
export function DesktopCard({ 
  children,
  title,
  subtitle,
  headerActions,
  className
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden",
      className
    )}>
      {(title || subtitle || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center space-x-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}