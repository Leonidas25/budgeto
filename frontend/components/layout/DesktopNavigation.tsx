"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Target, TrendingUp, Settings, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview of your finances"
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: CreditCard,
    description: "Manage your transactions"
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: Target,
    description: "Track your budget goals"
  },
  {
    name: "Statistics",
    href: "/stats",
    icon: TrendingUp,
    description: "Financial insights and analytics"
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account and app preferences"
  },
];

interface DesktopNavigationProps {
  className?: string;
}

export function DesktopNavigation({ className }: DesktopNavigationProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={cn(
      "w-64 bg-white border-r border-gray-200 flex flex-col h-full",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Budgeto</h1>
            <p className="text-sm text-gray-500">Finance Manager</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.full_name || user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Student • Level 1
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary-50 text-primary-700 border border-primary-200"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <item.icon 
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                )} 
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                {isActive && (
                  <div className="text-xs text-primary-600 mt-0.5">
                    {item.description}
                  </div>
                )}
              </div>
              {isActive && (
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </button>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Budgeto v1.0 • Made for Greek Students 🇬🇷
          </p>
        </div>
      </div>
    </div>
  );
}