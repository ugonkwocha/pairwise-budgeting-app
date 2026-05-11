'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Household, User, IncomeSource, Category, Currency } from '@/types';
import { Button } from '@/components/ui/Button';
import StepIndicator from './StepIndicator';
import HouseholdStep from './HouseholdStep';
import MembersStep from './MembersStep';
import CurrencyStep from './CurrencyStep';
import IncomeStep from './IncomeStep';
import CategoriesStep from './CategoriesStep';
import BudgetStep from './BudgetStep';

export default function OnboardingWizard() {
  const { completeOnboarding, onboardingCompleted, isAuthenticated, error } = useBudget();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, onboardingCompleted, router]);

  // Step data
  const [household, setHousehold] = useState<Omit<Household, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [members, setMembers] = useState<Omit<User, 'id' | 'createdAt' | 'householdId'>[]>([]);
  const [incomeSources, setIncomeSources] = useState<Omit<IncomeSource, 'id' | 'createdAt'>[]>([]);
  const [categories, setCategories] = useState<Omit<Category, 'id' | 'createdAt'>[]>([]);

  const steps = [
    { title: 'Household', component: HouseholdStep },
    { title: 'Members', component: MembersStep },
    { title: 'Currency', component: CurrencyStep },
    { title: 'Income Sources', component: IncomeStep },
    { title: 'Categories', component: CategoriesStep },
    { title: 'Budgets', component: BudgetStep },
  ];

  const StepComponent = steps[currentStep].component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    try {
      if (!household) {
        alert('Please enter a household name to continue');
        return;
      }

      if (members.length === 0) {
        alert('Please add at least one member to continue');
        return;
      }

      if (categories.length === 0) {
        alert('Please add at least one category to continue');
        return;
      }

      // Validate that at least one member has a name
      const hasValidMember = members.some(m => m.name.trim().length > 0);
      if (!hasValidMember) {
        alert('Please fill in at least one member name to continue');
        return;
      }

      // Create household with ID
      const householdWithId: Household = {
        ...household,
        id: `household_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add household ID to members (filter out empty names)
      const membersWithHousehold: User[] = members
        .filter(m => m.name.trim().length > 0)
        .map((m) => ({
          ...m,
          name: m.name.trim(),
          email: m.email.trim(),
          id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          createdAt: new Date().toISOString(),
          householdId: householdWithId.id,
        }));

      // Create income sources with IDs
      const sourcesWithId: IncomeSource[] = incomeSources.map((s) => {
        return {
          ...s,
          id: `source_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          createdAt: new Date().toISOString(),
        };
      });

      // Create categories with IDs
      const categoriesWithId: Category[] = categories.map((c) => ({
        ...c,
        id: `category_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      }));

      completeOnboarding(householdWithId, membersWithHousehold, sourcesWithId, categoriesWithId);
    } catch (error) {
      console.error('Error in handleComplete:', error);
      alert('An error occurred while completing setup. Check the console for details.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">Welcome to Pairwise</h1>
          <p className="text-base text-gray-600 sm:text-lg">Let's set up your household budget in 6 steps</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep + 1} totalSteps={steps.length} />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8 rounded-lg bg-white p-5 shadow-lg sm:p-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 sm:text-2xl">{steps[currentStep].title}</h2>

          <StepComponent
            data={{
              household,
              members,
              incomeSources,
              categories,
            }}
            onUpdate={{
              setHousehold,
              setMembers,
              setIncomeSources,
              setCategories,
            }}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between sm:gap-4">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="primary">
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} variant="primary">
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
