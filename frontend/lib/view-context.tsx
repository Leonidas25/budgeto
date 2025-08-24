"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ViewMode = 'mobile' | 'desktop';

interface ViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleView: () => void;
  isDesktop: boolean;
  isMobile: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

interface ViewProviderProps {
  children: ReactNode;
}

export function ViewProvider({ children }: ViewProviderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if there's a saved preference in localStorage
    const savedViewMode = localStorage.getItem('budgeto-view-mode') as ViewMode;
    
    // Auto-detect based on screen size if no saved preference
    const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint
    
    // Use saved preference if available, otherwise auto-detect
    const initialMode = savedViewMode || (isLargeScreen ? 'desktop' : 'mobile');
    setViewMode(initialMode);
  }, []);

  useEffect(() => {
    // Save view mode preference to localStorage when it changes
    if (mounted) {
      localStorage.setItem('budgeto-view-mode', viewMode);
    }
  }, [viewMode, mounted]);

  const toggleView = () => {
    setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile');
  };

  const value: ViewContextType = {
    viewMode,
    setViewMode,
    toggleView,
    isDesktop: viewMode === 'desktop',
    isMobile: viewMode === 'mobile'
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView(): ViewContextType {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}

// Utility hook for responsive components
export function useResponsive() {
  const { viewMode, isDesktop, isMobile } = useView();
  
  return {
    viewMode,
    isDesktop,
    isMobile,
    // Responsive utilities
    containerClass: isDesktop ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'container-mobile',
    gridCols: isDesktop ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1',
    cardSpacing: isDesktop ? 'gap-6 lg:gap-8' : 'gap-4',
    padding: isDesktop ? 'p-6 lg:p-8' : 'p-4',
    margin: isDesktop ? 'mb-8' : 'mb-6'
  };
}