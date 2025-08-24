"use client";

import { useEffect, useState } from 'react';

// Mobile detection and responsive utilities
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width < 768); // Mobile breakpoint
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isMobile,
    screenSize,
    isTablet: screenSize.width >= 768 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    orientation: screenSize.height > screenSize.width ? 'portrait' : 'landscape'
  };
};

// Touch gesture detection
export const useTouchGestures = () => {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const getSwipeDirection = () => {
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        return deltaX > 0 ? 'right' : 'left';
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        return deltaY > 0 ? 'down' : 'up';
      }
    }
    
    return null;
  };

  return {
    handleTouchStart,
    handleTouchEnd,
    getSwipeDirection,
    touchStart,
    touchEnd
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionReady: 0
  });

  useEffect(() => {
    // Measure page load performance
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        setMetrics({
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          interactionReady: navigation.domInteractive - navigation.fetchStart
        });
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  const measureComponentRender = (componentName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`${componentName} render time: ${endTime - startTime}ms`);
      };
    }
    
    return () => {};
  };

  return {
    metrics,
    measureComponentRender
  };
};

// Network status monitoring
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connection, setConnection] = useState<any>(null);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Network information API (experimental)
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      setConnection({
        effectiveType: conn?.effectiveType,
        downlink: conn?.downlink,
        rtt: conn?.rtt,
        saveData: conn?.saveData
      });
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return {
    isOnline,
    isSlowConnection: connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g',
    connection
  };
};

// Image lazy loading optimization
export const useImageOptimization = () => {
  const [imageCache, setImageCache] = useState<Set<string>>(new Set());

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Set([...prev, src]));
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  const isImageCached = (src: string) => imageCache.has(src);

  return {
    preloadImage,
    isImageCached,
    imageCache: Array.from(imageCache)
  };
};

// Viewport optimization
export const useViewportOptimization = () => {
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const visualViewport = window.visualViewport;
      
      setViewportSize({ width, height });
      
      // Detect keyboard open on mobile
      if (visualViewport) {
        const keyboardHeight = height - visualViewport.height;
        setIsKeyboardOpen(keyboardHeight > 150); // Keyboard threshold
      }
      
      // Get safe area insets from CSS environment variables
      if (typeof window !== 'undefined') {
        const computedStyle = getComputedStyle(document.documentElement);
        const safeAreaTop = computedStyle.getPropertyValue('env(safe-area-inset-top)');
        const safeAreaBottom = computedStyle.getPropertyValue('env(safe-area-inset-bottom)');
        
        setSafeAreaInsets({
          top: safeAreaTop ? parseInt(safeAreaTop.replace('px', '')) : 0,
          bottom: safeAreaBottom ? parseInt(safeAreaBottom.replace('px', '')) : 0
        });
      }
      // Visual viewport API for better mobile handling
      if (window.visualViewport) {
        setViewportSize({
          width: window.visualViewport.width,
          height: window.visualViewport.height
        });
      } else {
        setViewportSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }

      // Safe area insets for notched devices
      if (CSS.supports('top: env(safe-area-inset-top)')) {
        const style = getComputedStyle(document.documentElement);
        setSafeAreaInsets({
          top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
          bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0')
        });
      }
    };

    updateViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', updateViewport);
        window.visualViewport?.removeEventListener('scroll', updateViewport);
      };
    } else {
      window.addEventListener('resize', updateViewport);
      return () => window.removeEventListener('resize', updateViewport);
    }
  }, []);

  return {
    viewportSize,
    safeAreaInsets,
    isKeyboardOpen: viewportSize.height < window.screen.height * 0.75
  };
};

// Data prefetching for performance
export const useDataPrefetch = () => {
  const prefetchQueue = useState<string[]>([])[0];

  const prefetchData = async (url: string, priority: 'high' | 'low' = 'low') => {
    if (prefetchQueue.includes(url)) return;

    prefetchQueue.push(url);

    // Use different strategies based on priority
    if (priority === 'high') {
      // Immediate fetch
      try {
        await fetch(url, { 
          method: 'GET',
          headers: { 'Purpose': 'prefetch' }
        });
      } catch (error) {
        console.warn('Prefetch failed:', url, error);
      }
    } else {
      // Idle prefetch
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          try {
            await fetch(url, { 
              method: 'GET',
              headers: { 'Purpose': 'prefetch' }
            });
          } catch (error) {
            console.warn('Idle prefetch failed:', url, error);
          }
        });
      }
    }
  };

  return { prefetchData };
};

// Battery level optimization
export const useBatteryOptimization = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);

        const updateBattery = () => {
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);
        };

        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);

        return () => {
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingchange', updateBattery);
        };
      });
    }
  }, []);

  const shouldReduceAnimations = batteryLevel !== null && batteryLevel < 0.2 && !isCharging;
  const shouldReducePolling = batteryLevel !== null && batteryLevel < 0.1;

  return {
    batteryLevel,
    isCharging,
    shouldReduceAnimations,
    shouldReducePolling
  };
};

// Memory usage monitoring
export const useMemoryMonitoring = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const memoryUsagePercentage = memoryInfo 
    ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100 
    : 0;

  return {
    memoryInfo,
    memoryUsagePercentage,
    isHighMemoryUsage: memoryUsagePercentage > 80
  };
};

// Performance budgets and monitoring
export const usePerformanceBudget = () => {
  const [budgetStatus, setBudgetStatus] = useState({
    loadTime: { budget: 3000, actual: 0, passed: true },
    bundleSize: { budget: 500000, actual: 0, passed: true }, // 500KB
    renderTime: { budget: 100, actual: 0, passed: true },
    memoryUsage: { budget: 50000000, actual: 0, passed: true } // 50MB
  });
  
  useEffect(() => {
    const checkPerformanceBudgets = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const memory = (performance as any).memory;
        
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        
        setBudgetStatus(prev => ({
          loadTime: {
            ...prev.loadTime,
            actual: loadTime,
            passed: loadTime <= prev.loadTime.budget
          },
          bundleSize: {
            ...prev.bundleSize,
            actual: navigation.transferSize || 0,
            passed: (navigation.transferSize || 0) <= prev.bundleSize.budget
          },
          renderTime: {
            ...prev.renderTime,
            actual: renderTime,
            passed: renderTime <= prev.renderTime.budget
          },
          memoryUsage: {
            ...prev.memoryUsage,
            actual: memory?.usedJSHeapSize || 0,
            passed: (memory?.usedJSHeapSize || 0) <= prev.memoryUsage.budget
          }
        }));
      }
    };
    
    // Check after page load
    if (document.readyState === 'complete') {
      checkPerformanceBudgets();
    } else {
      window.addEventListener('load', checkPerformanceBudgets);
      return () => window.removeEventListener('load', checkPerformanceBudgets);
    }
  }, []);
  
  const getBudgetScore = () => {
    const passed = Object.values(budgetStatus).filter(budget => budget.passed).length;
    const total = Object.values(budgetStatus).length;
    return (passed / total) * 100;
  };
  
  return {
    budgetStatus,
    budgetScore: getBudgetScore(),
    isWithinBudget: getBudgetScore() >= 75
  };
};

// Service Worker integration
export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setSwRegistration(registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const updateServiceWorker = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };
  
  return {
    isOnline,
    updateAvailable,
    updateServiceWorker
  };
};

// PWA installation prompt
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };
  
  return {
    isInstallable,
    installPWA
  };
};

// Enhanced mobile gestures
export const useAdvancedGestures = () => {
  const [gestureState, setGestureState] = useState({
    isLongPress: false,
    isPinching: false,
    scale: 1,
    rotation: 0
  });
  
  const handleLongPress = (callback: () => void, delay: number = 500) => {
    let timeout: NodeJS.Timeout;
    
    const start = () => {
      timeout = setTimeout(() => {
        setGestureState(prev => ({ ...prev, isLongPress: true }));
        callback();
      }, delay);
    };
    
    const cancel = () => {
      clearTimeout(timeout);
      setGestureState(prev => ({ ...prev, isLongPress: false }));
    };
    
    return { start, cancel };
  };
  
  const handlePinch = (callback: (scale: number) => void) => {
    let initialDistance = 0;
    
    const start = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        setGestureState(prev => ({ ...prev, isPinching: true }));
      }
    };
    
    const move = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / initialDistance;
        setGestureState(prev => ({ ...prev, scale }));
        callback(scale);
      }
    };
    
    const end = () => {
      setGestureState(prev => ({ ...prev, isPinching: false, scale: 1 }));
      initialDistance = 0;
    };
    
    return { start, move, end };
  };
  
  return {
    gestureState,
    handleLongPress,
    handlePinch
  };
};

// Utility function for throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}