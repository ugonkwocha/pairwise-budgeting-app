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
  const { completeOnboarding, onboardingCompleted } = useBudget();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Redirect to dashboard when onboarding is completed
  useEffect(() => {
    console.log('OnboardingWizard: onboardingCompleted =', onboardingCompleted);
    if (onboardingCompleted) {
      console.log('OnboardingWizard: Redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [onboardingCompleted, router]);

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
      console.log('Complete button clicked');
      console.log('Household:', household);
      console.log('Members:', members);
      console.log('Categories:', categories);
      console.log('Income Sources:', incomeSources);

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

      console.log('Calling completeOnboarding with:', {
        householdWithId,
        membersWithHousehold,
        sourcesWithId,
        categoriesWithId,
      });

      completeOnboarding(householdWithId, membersWithHousehold, sourcesWithId, categoriesWithId);
      console.log('completeOnboarding called successfully');
    } catch (error) {
      console.error('Error in handleComplete:', error);
      alert('An error occurred while completing setup. Check the console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Pairwise</h1>
          <p className="text-lg text-gray-600">Let's set up your household budget in 6 steps</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep + 1} totalSteps={steps.length} />

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">{steps[currentStep].title}</h2>

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
        <div className="flex gap-4 justify-between">
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
