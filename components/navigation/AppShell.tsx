'use client';

import { usePathname } from 'next/navigation';
import { useBudget } from '@/lib/contexts/BudgetContext';
import Navbar from '@/components/navigation/Navbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, onboardingCompleted } = useBudget();
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  const shouldShowShell = isAuthenticated && onboardingCompleted && !isAuthRoute && pathname !== '/onboarding';

  if (!shouldShowShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Navbar />
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
