'use client';

import { useBudget } from '@/lib/contexts/BudgetContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { onboardingCompleted, isAuthenticated, isLoading } = useBudget();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!onboardingCompleted) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  }, [onboardingCompleted, isAuthenticated, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Pairwise</h1>
        <p className="text-xl text-gray-600">Loading your household budget...</p>
      </div>
    </div>
  );
}
