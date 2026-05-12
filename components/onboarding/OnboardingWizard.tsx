'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Household, User, IncomeSource, Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
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
  const [setupError, setSetupError] = useState<string | null>(null);
  const [primaryMember, setPrimaryMember] = useState({ name: 'Primary member', email: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, onboardingCompleted, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadPrimaryMember = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setPrimaryMember({
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Primary member',
        email: user.email || '',
      });
    };

    void loadPrimaryMember();
  }, [isAuthenticated]);

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

  const getValidAdditionalMembers = () => members
    .map((member) => ({
      ...member,
      name: member.name.trim(),
      email: member.email.trim().toLowerCase(),
      role: 'member' as const,
    }))
    .filter((member) => member.name.length > 0 || member.email.length > 0);

  const validateMembers = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const filledMembers = getValidAdditionalMembers();
    const incompleteMember = filledMembers.find((member) => !member.name || !member.email);
    if (incompleteMember) {
      return 'Optional members need both a name and email. Remove blank rows or complete the member details.';
    }

    const invalidEmail = filledMembers.find((member) => !emailRegex.test(member.email));
    if (invalidEmail) {
      return 'Enter a valid email address for each optional member.';
    }

    return null;
  };

  const validateCurrentStep = () => {
    if (currentStep === 0 && !household?.name?.trim()) {
      return 'Enter a household name to continue.';
    }

    if (currentStep === 1) {
      return validateMembers();
    }

    if (currentStep === 4 && categories.length === 0) {
      return 'Add at least one expense category to continue.';
    }

    return null;
  };

  const handleNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setSetupError(validationError);
      return;
    }

    setSetupError(null);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setSetupError(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    try {
      setSetupError(null);
      if (!household) {
        setSetupError('Enter a household name to continue.');
        return;
      }

      if (!primaryMember.email) {
        setSetupError('Your account details are still loading. Please wait a moment and try again.');
        return;
      }

      if (categories.length === 0) {
        setSetupError('Add at least one expense category to continue.');
        return;
      }

      const memberValidationError = validateMembers();
      if (memberValidationError) {
        setSetupError(memberValidationError);
        return;
      }

      // Create household with ID
      const householdWithId: Household = {
        ...household,
        id: `household_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const primaryUser: User = {
        id: `user_${Date.now()}_primary`,
        name: primaryMember.name.trim() || primaryMember.email.split('@')[0] || 'Primary member',
        email: primaryMember.email.trim().toLowerCase(),
        role: 'primary',
        createdAt: new Date().toISOString(),
        householdId: householdWithId.id,
      };

      const additionalMembers: User[] = getValidAdditionalMembers()
        .map((m) => ({
          ...m,
          id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          createdAt: new Date().toISOString(),
          householdId: householdWithId.id,
        }));
      const membersWithHousehold: User[] = [primaryUser, ...additionalMembers];

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
      setSetupError('An error occurred while completing setup. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">Welcome to Pairwise</h1>
          <p className="text-base text-gray-600 sm:text-lg">Let&apos;s set up your household budget in 6 quick steps</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep + 1} totalSteps={steps.length} />

        {(error || setupError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {setupError || error}
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
            primaryMember={primaryMember}
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
