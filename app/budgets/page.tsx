'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateMonthBudgetModal } from '@/components/budgets/CreateMonthBudgetModal';
import { AddCategoryModal } from '@/components/settings/AddCategoryModal';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import { formatLocalMonth } from '@/lib/utils/dateUtils';
import { FiCheckCircle, FiPieChart, FiPlus } from 'react-icons/fi';

type EditMode = 'current' | 'template';

export default function BudgetsPage() {
  const {
    categories,
    monthlyCategories,
    currentMonth,
    updateCategory,
    updateMonthlyCategory,
    household,
    currentUser,
    onboardingCompleted,
    createMonthlyBudgets,
  } = useBudget();
  const isPrimaryMember = currentUser?.role === 'primary';

  const [editMode, setEditMode] = useState<EditMode>('current');
  const [budgetValues, setBudgetValues] = useState<Map<string, number>>(new Map());
  const [carryOverValues, setCarryOverValues] = useState<Map<string, boolean>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // Get current month's categories
  const currentMonthCategories = useMemo(
    () => monthlyCategories.filter((mc) => mc.month === currentMonth),
    [monthlyCategories, currentMonth]
  );
  const currentMonthCategoryMap = useMemo(() => {
    return new Map(currentMonthCategories.map((category) => [category.categoryId, category]));
  }, [currentMonthCategories]);

  // Initialize form values based on mode
  const initializeFormValues = useCallback(() => {
    const budgets = new Map<string, number>();
    const carryOvers = new Map<string, boolean>();

    if (editMode === 'template') {
      categories.forEach((cat) => {
        budgets.set(cat.id, cat.monthlyBudget);
        carryOvers.set(cat.id, cat.carryOverEnabled);
      });
    } else {
      categories.forEach((cat) => {
        const monthlyCategory = currentMonthCategoryMap.get(cat.id);
        budgets.set(cat.id, monthlyCategory?.monthlyBudget ?? cat.monthlyBudget);
        carryOvers.set(cat.id, cat.carryOverEnabled);
      });
    }

    setBudgetValues(budgets);
    setCarryOverValues(carryOvers);
  }, [categories, currentMonthCategoryMap, editMode]);

  // Call on mount and when mode changes
  useEffect(() => {
    initializeFormValues();
  }, [initializeFormValues]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Detect if current month needs budget creation
  useEffect(() => {
    const hasTemplates = categories.length > 0;
    const hasMonthlyBudgets = monthlyCategories.some((mc) => mc.month === currentMonth);

    if (hasTemplates && !hasMonthlyBudgets && onboardingCompleted) {
      setShowCreateModal(true);
    } else {
      setShowCreateModal(false);
    }
  }, [currentMonth, monthlyCategories, categories, onboardingCompleted]);

  const handleCreateBudget = () => {
    if (!isPrimaryMember) return;
    createMonthlyBudgets(currentMonth);
    setShowCreateModal(false);
  };

  const handleBudgetChange = (categoryId: string, value: string) => {
    if (!isPrimaryMember) return;
    const newBudgets = new Map(budgetValues);
    newBudgets.set(categoryId, parseFloat(value) || 0);
    setBudgetValues(newBudgets);
  };

  const handleCarryOverToggle = (categoryId: string) => {
    if (!isPrimaryMember) return;
    const newCarryOvers = new Map(carryOverValues);
    newCarryOvers.set(categoryId, !newCarryOvers.get(categoryId));
    setCarryOverValues(newCarryOvers);
  };

  const handleSaveAll = async () => {
    if (!isPrimaryMember) return;
    setIsSaving(true);

    if (editMode === 'template') {
      // Update all category templates
      categories.forEach((cat) => {
        const newBudget = budgetValues.get(cat.id);
        const newCarryOver = carryOverValues.get(cat.id);

        if (newBudget !== undefined || newCarryOver !== undefined) {
          updateCategory(cat.id, {
            ...(newBudget !== undefined && { monthlyBudget: newBudget }),
            ...(newCarryOver !== undefined && { carryOverEnabled: newCarryOver }),
          });
        }
      });
    } else {
      const missingCategoryIds = categories
        .filter((category) => !currentMonthCategoryMap.has(category.id))
        .map((category) => category.id);

      if (missingCategoryIds.length > 0) {
        createMonthlyBudgets(currentMonth, Object.fromEntries(budgetValues));
      }

      // Update existing current month categories
      currentMonthCategories.forEach((mc) => {
        const newBudget = budgetValues.get(mc.categoryId);

        if (newBudget !== undefined) {
          updateMonthlyCategory(mc.id, {
            monthlyBudget: newBudget,
          });
        }
      });

      // Persist carryover settings for every category, including newly-created monthly rows.
      categories.forEach((category) => {
        const newCarryOver = carryOverValues.get(category.id);
        if (newCarryOver !== undefined) {
          updateCategory(category.id, {
            carryOverEnabled: newCarryOver,
          });
        }
      });
    }
    setIsSaving(false);
    setShowSuccess(true);
  };

  const totalBudget = Array.from(budgetValues.values()).reduce((sum, val) => sum + val, 0);

  const dataToRender = editMode === 'template' ? categories : categories.map((category) => {
    const monthlyCategory = currentMonthCategoryMap.get(category.id);
    return {
      id: category.id,
      name: category.name,
      monthlyBudget: monthlyCategory?.monthlyBudget ?? category.monthlyBudget,
      carryOverEnabled: category.carryOverEnabled,
      isMissingMonthlyBudget: !monthlyCategory,
    };
  });

  const monthString = formatLocalMonth(currentMonth, { month: 'long', year: 'numeric' });
  const currency = household?.currency === 'NGN' ? '₦' : '$';

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Budgets
          </div>
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-slate-950">Budgets</h1>
              <p className="mt-6 text-base font-medium text-slate-950">Update this month or change the template for future months</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
              <div className="w-full min-w-0 xl:w-[520px]">
                <MonthNavigation />
              </div>
              {isPrimaryMember && (
                <Button onClick={() => setShowAddCategoryModal(true)} className="inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                  <FiPlus aria-hidden="true" />
                  Add Category
                </Button>
              )}
            </div>
          </div>
        </div>

        {showSuccess && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
            Changes saved successfully.
          </div>
        )}

        <div className="mb-6 grid w-full grid-cols-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:inline-grid sm:w-auto sm:grid-cols-2">
          <button
            onClick={() => setEditMode('current')}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:px-5 ${
              editMode === 'current'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            Current Month ({monthString})
          </button>
          <button
            onClick={() => setEditMode('template')}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:px-5 ${
              editMode === 'template'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            Template (Future Months)
          </button>
        </div>

        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            {!isPrimaryMember
              ? 'Only primary household members can change budget templates or monthly budget amounts.'
              : editMode === 'current'
                ? `Editing budgets for ${monthString} only. These changes won't affect future months.`
                : 'Editing your budget template. All future months will use these amounts.'
            }
          </p>
        </div>

        {/* Categories */}
        {currentMonthCategories.length === 0 && editMode === 'current' ? (
          <Card className="border-slate-200 bg-white">
            <CardContent className="py-8 text-center">
              <p className="mb-4 text-sm text-slate-500">
                No budget created for {monthString} yet.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                disabled={!isPrimaryMember}
              >
                Create Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {dataToRender.map((item) => {
                const categoryId = item.id;
                return (
                  <Card key={categoryId} className="border-slate-200 bg-white">
                    <CardContent className="p-4">
                      <div className="mb-4">
                        <label className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                          <span>{item.name}</span>
                          {'isMissingMonthlyBudget' in item && item.isMissingMonthlyBudget && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              New this month
                            </span>
                          )}
                        </label>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-2 sm:flex">
                          <span className="font-semibold text-slate-900">{currency}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={budgetValues.get(categoryId) || 0}
                            onChange={(e) => handleBudgetChange(categoryId, e.target.value)}
                            disabled={!isPrimaryMember}
                            className="flex-1"
                          />
                          <span className="col-start-2 text-sm font-medium text-slate-500 sm:col-auto">/month</span>
                        </div>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={carryOverValues.get(categoryId) || false}
                          onChange={() => handleCarryOverToggle(categoryId)}
                          disabled={!isPrimaryMember}
                          className="rounded border-slate-300"
                        />
                        <span>Allow unused budget to carry over to next month</span>
                      </label>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="mb-6 border-0 bg-violet-50">
              <CardHeader className="mb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Monthly Budget</CardTitle>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-violet-600 shadow-sm">
                  <FiPieChart className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">
                {currency}
                {totalBudget.toFixed(2)}
              </div>
              </CardContent>
            </Card>

            <Button
              variant="primary"
              onClick={handleSaveAll}
              disabled={isSaving || !isPrimaryMember}
              className="w-full py-3"
            >
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </>
        )}
      </div>

      <CreateMonthBudgetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        month={currentMonth}
        onConfirm={handleCreateBudget}
      />
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
      />
    </div>
  );
}
