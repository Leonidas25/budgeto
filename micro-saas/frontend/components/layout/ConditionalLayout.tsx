"use client";

import { usePathname } from 'next/navigation';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { useAuth } from '@/lib/auth';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const authPages = ['/auth/login', '/auth/register', '/auth/onboarding'];

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  
  const isAuthPage = authPages.some(page => pathname.startsWith(page));
  const shouldShowNavigation = isAuthenticated && !isAuthPage && !isLoading;

  if (isAuthPage) {
    // Full screen layout for auth pages
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content area */}
      <main className={shouldShowNavigation ? "flex-1 pb-20" : "flex-1"}>
        {children}
      </main>
      
      {/* Bottom navigation for authenticated users */}
      {shouldShowNavigation && <MobileNavigation />}
    </div>
  );
}