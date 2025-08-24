import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AuthProvider } from "@/lib/auth";
import { ViewProvider } from "@/lib/view-context";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budgeto - Student Finance App for Greece",
  description: "Track expenses, manage budgets, and level up your financial game! 🇬🇷",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Budgeto",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icon.svg", sizes: "180x180", type: "image/svg+xml" }
    ]
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // suppressHydrationWarning is used on html and body elements to prevent
  // hydration errors caused by browser extensions (like wallets) that inject
  // data attributes after the page loads
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50`} suppressHydrationWarning>
        <AuthProvider>
          <ViewProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </ViewProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
