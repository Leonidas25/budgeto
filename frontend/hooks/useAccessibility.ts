"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

// Accessibility announcements hook
export const useA11yAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create a unique ID for this announcement
    const id = `announcement-${Date.now()}`;
    
    // Add to announcements list
    setAnnouncements(prev => [...prev, message]);
    
    // Create temporary live region if one doesn't exist
    const existingRegion = document.getElementById('a11y-announcements');
    if (!existingRegion) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'a11y-announcements';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
      
      // Clean up old announcements after they've been read
      setTimeout(() => {
        liveRegion.textContent = message;
        setTimeout(() => {
          setAnnouncements(prev => prev.filter(a => a !== message));
        }, 1000);
      }, 100);
    } else {
      existingRegion.textContent = message;
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a !== message));
      }, 1000);
    }
  }, []);

  return { announce, announcements };
};

// Focus management hook
export const useFocusManagement = () => {
  const [focusStack, setFocusStack] = useState<HTMLElement[]>([]);
  
  const pushFocus = useCallback((element: HTMLElement | null) => {
    if (element && document.activeElement instanceof HTMLElement) {
      setFocusStack(prev => [...prev, document.activeElement as HTMLElement]);
      element.focus();
    }
  }, []);
  
  const popFocus = useCallback(() => {
    setFocusStack(prev => {
      const newStack = [...prev];
      const elementToFocus = newStack.pop();
      if (elementToFocus) {
        elementToFocus.focus();
      }
      return newStack;
    });
  }, []);
  
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { pushFocus, popFocus, trapFocus, focusStack };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  items: any[],
  onSelect: (item: any, index: number) => void,
  options: {
    orientation?: 'horizontal' | 'vertical';
    loop?: boolean;
    initialIndex?: number;
  } = {}
) => {
  const { orientation = 'vertical', loop = true, initialIndex = 0 } = options;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isActive, setIsActive] = useState(false);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive || items.length === 0) return;
    
    const isNext = (orientation === 'vertical' && e.key === 'ArrowDown') || 
                   (orientation === 'horizontal' && e.key === 'ArrowRight');
    const isPrev = (orientation === 'vertical' && e.key === 'ArrowUp') || 
                   (orientation === 'horizontal' && e.key === 'ArrowLeft');
    
    if (isNext || isPrev) {
      e.preventDefault();
      
      setCurrentIndex(prevIndex => {
        let newIndex = prevIndex;
        
        if (isNext) {
          newIndex = loop ? (prevIndex + 1) % items.length : Math.min(prevIndex + 1, items.length - 1);
        } else {
          newIndex = loop ? (prevIndex - 1 + items.length) % items.length : Math.max(prevIndex - 1, 0);
        }
        
        return newIndex;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(items[currentIndex], currentIndex);
    } else if (e.key === 'Escape') {
      setIsActive(false);
    }
  }, [isActive, items, currentIndex, orientation, loop, onSelect]);
  
  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, handleKeyDown]);
  
  return {
    currentIndex,
    setCurrentIndex,
    isActive,
    setIsActive,
    getItemProps: (index: number) => ({
      'aria-selected': index === currentIndex,
      'tabIndex': index === currentIndex ? 0 : -1,
      'role': 'option'
    })
  };
};

// Color contrast and theme hook
export const useAccessibleTheme = () => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check for user preferences
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setHighContrast(highContrastQuery.matches);
    setReducedMotion(reducedMotionQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    
    highContrastQuery.addEventListener('change', handleContrastChange);
    reducedMotionQuery.addEventListener('change', handleMotionChange);
    
    // Apply theme classes to body
    document.body.classList.toggle('high-contrast', highContrast);
    document.body.classList.toggle('reduced-motion', reducedMotion);
    
    return () => {
      highContrastQuery.removeEventListener('change', handleContrastChange);
      reducedMotionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [highContrast, reducedMotion]);
  
  return { highContrast, reducedMotion };
};

// Screen reader utilities
export const useScreenReader = () => {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  
  useEffect(() => {
    // Detect if screen reader is active (simplified detection)
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                           window.navigator.userAgent.includes('JAWS') || 
                           window.speechSynthesis.getVoices().length > 0;
    
    setIsScreenReaderActive(hasScreenReader);
  }, []);
  
  const getAriaLabel = useCallback((text: string, context?: string) => {
    return context ? `${text}, ${context}` : text;
  }, []);
  
  const getAriaDescription = useCallback((description: string, status?: string) => {
    return status ? `${description}. ${status}` : description;
  }, []);
  
  return {
    isScreenReaderActive,
    getAriaLabel,
    getAriaDescription
  };
};

// Form accessibility hook
export const useFormAccessibility = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const getFieldProps = useCallback((fieldName: string, label: string, required: boolean = false) => {
    const hasError = errors[fieldName] && touched[fieldName];
    
    return {
      'aria-label': label,
      'aria-required': required,
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': hasError ? `${fieldName}-error` : undefined,
      onBlur: () => setTouched(prev => ({ ...prev, [fieldName]: true }))
    };
  }, [errors, touched]);
  
  const getErrorProps = useCallback((fieldName: string) => ({
    id: `${fieldName}-error`,
    role: 'alert',
    'aria-live': 'polite'
  }), []);
  
  const addError = useCallback((fieldName: string, message: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: message }));
  }, []);
  
  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);
  
  return {
    errors,
    touched,
    getFieldProps,
    getErrorProps,
    addError,
    clearError,
    hasErrors: Object.keys(errors).length > 0
  };
};

// Skip links hook
export const useSkipLinks = () => {
  const createSkipLink = useCallback((target: string, label: string) => {
    const skipLink = document.createElement('a');
    skipLink.href = target;
    skipLink.textContent = label;
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow-lg';
    
    // Insert at the beginning of body
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    return skipLink;
  }, []);
  
  useEffect(() => {
    // Create default skip links
    const mainContentLink = createSkipLink('#main-content', 'Skip to main content');
    const navigationLink = createSkipLink('#main-navigation', 'Skip to navigation');
    
    return () => {
      // Cleanup on unmount
      if (mainContentLink.parentNode) {
        mainContentLink.parentNode.removeChild(mainContentLink);
      }
      if (navigationLink.parentNode) {
        navigationLink.parentNode.removeChild(navigationLink);
      }
    };
  }, [createSkipLink]);
};

// Modal accessibility hook
export const useModalAccessibility = (isOpen: boolean) => {
  const { pushFocus, popFocus, trapFocus } = useFocusManagement();
  const { announce } = useA11yAnnouncements();
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Announce modal opening
      announce('Dialog opened', 'assertive');
      
      // Set up escape key handler
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          // This should be handled by the modal component
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to previously focused element
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
      
      // Announce modal closing
      announce('Dialog closed', 'assertive');
    }
  }, [isOpen, announce]);
  
  const getModalProps = useCallback(() => ({
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'modal-title',
    'aria-describedby': 'modal-description'
  }), []);
  
  return { getModalProps, trapFocus };
};

// Touch and gesture accessibility
export const useTouchAccessibility = () => {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const handleTouchStart = () => setIsTouch(true);
    const handleMouseDown = () => setIsTouch(false);
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('mousedown', handleMouseDown);
    
    // Apply touch-specific classes
    document.body.classList.toggle('touch-device', isTouch);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isTouch]);
  
  const getTouchProps = useCallback((label: string) => ({
    'aria-label': label,
    style: { minHeight: '44px', minWidth: '44px' } // WCAG minimum touch target size
  }), []);
  
  return { isTouch, getTouchProps };
};

// Export all hooks
export {
  useA11yAnnouncements,
  useFocusManagement,
  useKeyboardNavigation,
  useAccessibleTheme,
  useScreenReader,
  useFormAccessibility,
  useSkipLinks,
  useModalAccessibility,
  useTouchAccessibility
};