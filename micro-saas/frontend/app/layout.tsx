import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AuthProvider } from "@/lib/auth";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budgeto - Student Finance App for Greece",
  description: "Track expenses, manage budgets, and level up your financial game! 🇬🇷",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#0ea5e9",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Budgeto",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
