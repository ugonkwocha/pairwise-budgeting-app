'use client';

import { usePathname } from 'next/navigation';
import { useBudget } from '@/lib/contexts/BudgetContext';
import Navbar from '@/components/navigation/Navbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { onboardingCompleted } = useBudget();
  const shouldShowShell = onboardingCompleted && pathname !== '/onboarding';

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
