"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Target, TrendingUp, Settings } from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: CreditCard,
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: Target,
  },
  {
    name: "Stats",
    href: "/stats",
    icon: TrendingUp,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item min-w-0 flex-1 ${isActive ? "active" : ""}`}
            >
              <item.icon 
                className={`w-5 h-5 mb-1 ${
                  isActive ? "text-primary-500" : "text-gray-400"
                }`} 
              />
              <span 
                className={`text-xs truncate ${
                  isActive ? "text-primary-500 font-medium" : "text-gray-600"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}