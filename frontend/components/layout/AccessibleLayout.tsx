"use client";

import React, { useEffect } from 'react';
import { useSkipLinks, useAccessibleTheme } from '@/hooks/useAccessibility';

interface AccessibleLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showSkipLinks?: boolean;
}

const AccessibleLayout: React.FC<AccessibleLayoutProps> = ({
  children,
  title = "Budgeto",
  description,
  showSkipLinks = true
}) => {
  const { highContrast, reducedMotion } = useAccessibleTheme();
  
  // Initialize skip links
  useSkipLinks();
  
  useEffect(() => {
    // Set document title for screen readers
    document.title = title;
    
    // Set document language
    document.documentElement.lang = 'en';
    
    // Add viewport meta tag for mobile accessibility
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5');
    
    // Add theme-color meta tag
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', '#3B82F6');
    
  }, [title]);
  
  return (
    <>
      {/* Skip Links */}
      {showSkipLinks && (
        <div className="skip-links">
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <a href="#main-navigation" className="skip-link">
            Skip to navigation
          </a>
        </div>
      )}
      
      {/* Live Region for Announcements */}
      <div
        id="a11y-announcements"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* Main Layout */}
      <div 
        className={`min-h-screen bg-gray-50 ${highContrast ? 'high-contrast' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
      >
        {/* Header */}
        <header role="banner" className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  {title}
                </h1>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Navigation */}
        <nav 
          id="main-navigation" 
          role="navigation" 
          aria-label="Main navigation"
          className="bg-white border-b border-gray-200"
        >\n          {/* Navigation will be rendered by the specific layout component */}\n        </nav>\n        \n        {/* Main Content */}\n        <main \n          id=\"main-content\" \n          role=\"main\"\n          className=\"flex-1 relative overflow-hidden\"\n          aria-label={description || \"Main content\"}\n        >\n          {children}\n        </main>\n        \n        {/* Footer */}\n        <footer role=\"contentinfo\" className=\"bg-white border-t border-gray-200 py-8\">\n          <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n            <div className=\"text-center text-sm text-gray-500\">\n              <p>&copy; 2024 Budgeto. All rights reserved.</p>\n              <p className=\"mt-2\">\n                <a \n                  href=\"/privacy\" \n                  className=\"text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded\"\n                >\n                  Privacy Policy\n                </a>\n                {' · '}\n                <a \n                  href=\"/terms\" \n                  className=\"text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded\"\n                >\n                  Terms of Service\n                </a>\n                {' · '}\n                <a \n                  href=\"/accessibility\" \n                  className=\"text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded\"\n                >\n                  Accessibility\n                </a>\n              </p>\n            </div>\n          </div>\n        </footer>\n      </div>\n      \n      {/* Focus Indicator Styles */}\n      <style jsx global>{`\n        .focus-visible {\n          outline: 2px solid #3B82F6;\n          outline-offset: 2px;\n        }\n        \n        @media (prefers-reduced-motion: reduce) {\n          * {\n            animation-duration: 0.01ms !important;\n            animation-iteration-count: 1 !important;\n            transition-duration: 0.01ms !important;\n          }\n        }\n        \n        @media (prefers-contrast: high) {\n          .high-contrast {\n            filter: contrast(150%);\n          }\n        }\n      `}</style>\n    </>\n  );\n};\n\nexport default AccessibleLayout;"