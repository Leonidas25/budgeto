"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { HelpSystem } from '@/components/help/HelpSystem';
import { HelpProvider } from '@/components/help/Tooltip';
import { FloatingViewToggle } from '@/components/ui/ViewToggle';
import { useAuth } from '@/lib/auth';
import { useView } from '@/lib/view-context';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const authPages = ['/auth/login', '/auth/register', '/auth/onboarding'];

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { isDesktop, isMobile } = useView();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isAuthPage = authPages.some(page => pathname.startsWith(page));
  const shouldShowNavigation = isAuthenticated && !isAuthPage && !isLoading;

  // Prevent hydration mismatch by showing a loading state until mounted
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (isAuthPage) {
    // Full screen layout for auth pages
    return <>{children}</>;
  }

  return (
    <HelpProvider>
      {shouldShowNavigation && isDesktop ? (
        // Desktop Layout with sidebar navigation
        <DesktopLayout>
          {children}
        </DesktopLayout>
      ) : (
        // Mobile Layout with bottom navigation
        <div className="flex flex-col min-h-screen">
          {/* Main content area */}
          <main className={shouldShowNavigation ? "flex-1 pb-20" : "flex-1"}>
            {children}
          </main>
          
          {/* Bottom navigation for mobile authenticated users */}
          {shouldShowNavigation && isMobile && <MobileNavigation />}
          
          {/* Floating view toggle for mobile when authenticated */}
          {shouldShowNavigation && isMobile && <FloatingViewToggle />}
        </div>
      )}
      
      {/* Help system available for authenticated users */}
      {shouldShowNavigation && <HelpSystem />}
    </HelpProvider>
  );
}