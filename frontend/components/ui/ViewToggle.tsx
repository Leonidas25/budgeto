"use client";

import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useView } from '@/lib/view-context';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ViewToggle({ className, size = 'md', showLabel = false }: ViewToggleProps) {
  const { viewMode, toggleView, isDesktop, isMobile } = useView();

  const sizes = {
    sm: {
      button: 'p-2',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      button: 'p-2.5',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      button: 'p-3',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {showLabel && (
        <span className={cn("font-medium text-gray-700", currentSize.text)}>
          View:
        </span>
      )}
      
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        {/* Mobile View Button */}
        <button
          onClick={() => toggleView()}
          className={cn(
            "flex items-center space-x-1 rounded-md transition-all duration-200",
            currentSize.button,
            isMobile
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
          title="Switch to Mobile View"
        >
          <Smartphone className={currentSize.icon} />
          {showLabel && (
            <span className={currentSize.text}>Mobile</span>
          )}
        </button>

        {/* Desktop View Button */}
        <button
          onClick={() => toggleView()}
          className={cn(
            "flex items-center space-x-1 rounded-md transition-all duration-200",
            currentSize.button,
            isDesktop
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
          title="Switch to Desktop View"
        >
          <Monitor className={currentSize.icon} />
          {showLabel && (
            <span className={currentSize.text}>Desktop</span>
          )}
        </button>
      </div>
    </div>
  );
}

// Alternative floating action button version for quick access
export function FloatingViewToggle() {
  const { viewMode, toggleView, isDesktop } = useView();

  return (
    <button
      onClick={toggleView}
      className={cn(
        "fixed bottom-24 right-4 z-40 p-3 rounded-full shadow-lg transition-all duration-200",
        "bg-white border border-gray-200 hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      )}
      title={`Switch to ${isDesktop ? 'Mobile' : 'Desktop'} View`}
    >
      {isDesktop ? (
        <Smartphone className="w-5 h-5 text-gray-700" />
      ) : (
        <Monitor className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
}

// Compact toggle for header bars
export function CompactViewToggle({ className }: { className?: string }) {
  const { viewMode, toggleView, isDesktop } = useView();

  return (
    <button
      onClick={toggleView}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-md",
        "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
        "transition-colors duration-200",
        className
      )}
      title={`Switch to ${isDesktop ? 'Mobile' : 'Desktop'} View`}
    >
      {isDesktop ? (
        <Smartphone className="w-4 h-4" />
      ) : (
        <Monitor className="w-4 h-4" />
      )}
    </button>
  );
}