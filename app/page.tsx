'use client';

import { useBudget } from '@/lib/contexts/BudgetContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { onboardingCompleted, isLoading } = useBudget();
  const router = useRouter();

  useEffect(() => {
    console.log('Root page useEffect triggered:', {
      isLoading,
      onboardingCompleted,
    });

    if (!isLoading) {
      console.log('Not loading, checking onboarding status...');
      if (!onboardingCompleted) {
        console.log('Redirecting to onboarding');
        router.push('/onboarding');
      } else {
        console.log('Redirecting to dashboard');
        router.push('/dashboard');
      }
    }
  }, [onboardingCompleted, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Pairwise</h1>
        <p className="text-xl text-gray-600">Loading your household budget...</p>
      </div>
    </div>
  );
}
