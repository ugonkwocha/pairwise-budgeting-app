'use client';

import React, { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateMonthBudgetModal } from '@/components/budgets/CreateMonthBudgetModal';
import MonthNavigation from '@/components/navigation/MonthNavigation';

type EditMode = 'current' | 'template';

export default function BudgetsPage() {
  const {
    categories,
    monthlyCategories,
    currentMonth,
    updateCategory,
    updateMonthlyCategory,
    household,
    onboardingCompleted,
    createMonthlyBudgets,
  } = useBudget();

  const [editMode, setEditMode] = useState<EditMode>('current');
  const [budgetValues, setBudgetValues] = useState<Map<string, number>>(new Map());
  const [carryOverValues, setCarryOverValues] = useState<Map<string, boolean>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get current month's categories
  const currentMonthCategories = monthlyCategories.filter((mc) => mc.month === currentMonth);

  // Initialize form values based on mode
  const initializeFormValues = () => {
    const budgets = new Map<string, number>();
    const carryOvers = new Map<string, boolean>();

    if (editMode === 'template') {
      categories.forEach((cat) => {
        budgets.set(cat.id, cat.monthlyBudget);
        carryOvers.set(cat.id, cat.carryOverEnabled);
      });
    } else {
      currentMonthCategories.forEach((mc) => {
        budgets.set(mc.categoryId, mc.monthlyBudget);
        // CarryOver is at Category level, so fetch from categories
        const category = categories.find((c) => c.id === mc.categoryId);
        if (category) {
          carryOvers.set(mc.categoryId, category.carryOverEnabled);
        }
      });
    }

    setBudgetValues(budgets);
    setCarryOverValues(carryOvers);
  };

  // Call on mount and when mode changes
  useEffect(() => {
    initializeFormValues();
  }, [editMode, categories, monthlyCategories, currentMonth]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    console.log('showSuccess changed:', showSuccess);
    if (showSuccess) {
      console.log('Setting timer to hide success message');
      const timer = setTimeout(() => {
        console.log('Timer expired, hiding success message');
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
    createMonthlyBudgets(currentMonth);
    setShowCreateModal(false);
  };

  const handleBudgetChange = (categoryId: string, value: string) => {
    const newBudgets = new Map(budgetValues);
    newBudgets.set(categoryId, parseFloat(value) || 0);
    setBudgetValues(newBudgets);
  };

  const handleCarryOverToggle = (categoryId: string) => {
    const newCarryOvers = new Map(carryOverValues);
    newCarryOvers.set(categoryId, !newCarryOvers.get(categoryId));
    setCarryOverValues(newCarryOvers);
  };

  const handleSaveAll = async () => {
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
      // Update current month categories
      currentMonthCategories.forEach((mc) => {
        const newBudget = budgetValues.get(mc.categoryId);

        if (newBudget !== undefined) {
          updateMonthlyCategory(mc.id, {
            monthlyBudget: newBudget,
          });
        }

        // Also update carryOver in category template
        const newCarryOver = carryOverValues.get(mc.categoryId);
        if (newCarryOver !== undefined) {
          updateCategory(mc.categoryId, {
            carryOverEnabled: newCarryOver,
          });
        }
      });
    }

    console.log('Save complete, setting isSaving to false and showSuccess to true');
    setIsSaving(false);
    setShowSuccess(true);
  };

  const totalBudget = Array.from(budgetValues.values()).reduce((sum, val) => sum + val, 0);

  // Data to render
  const dataToRender = editMode === 'template' ? categories : currentMonthCategories.map((mc) => {
    const category = categories.find((c) => c.id === mc.categoryId);
    return {
      id: mc.categoryId,
      name: mc.categoryName,
      monthlyBudget: mc.monthlyBudget,
      carryOverEnabled: category?.carryOverEnabled || false,
    };
  });

  const monthDate = new Date(currentMonth + '-01');
  const monthString = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Budgets</h1>
          <p className="text-gray-600 mt-2 mb-4">Update budgets for the current month or change your template for future months</p>
          <MonthNavigation />
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 font-medium">
              ✓ Changes saved successfully!
            </p>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="mb-6 bg-white p-1 rounded-lg inline-flex shadow-sm border border-gray-200">
          <button
            onClick={() => setEditMode('current')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              editMode === 'current'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Current Month ({monthString})
          </button>
          <button
            onClick={() => setEditMode('template')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              editMode === 'template'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Template (Future Months)
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            {editMode === 'current'
              ? `Editing budgets for ${monthString} only. These changes won't affect future months.`
              : 'Editing your budget template. All future months will use these amounts.'
            }
          </p>
        </div>

        {/* Categories */}
        {currentMonthCategories.length === 0 && editMode === 'current' ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-600 mb-4">
                No budget created for {monthString} yet.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
              >
                Create Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {dataToRender.map((item) => {
                const categoryId = item.id;
                return (
                  <Card key={categoryId}>
                    <CardContent className="p-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {item.name}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium">{household?.currency === 'NGN' ? '₦' : '$'}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={budgetValues.get(categoryId) || 0}
                            onChange={(e) => handleBudgetChange(categoryId, e.target.value)}
                            className="flex-1"
                          />
                          <span className="text-gray-700 text-sm">/month</span>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={carryOverValues.get(categoryId) || false}
                          onChange={() => handleCarryOverToggle(categoryId)}
                          className="rounded border-gray-300"
                        />
                        <span>Allow unused budget to carry over to next month</span>
                      </label>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Total Budget */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <div className="text-sm text-gray-600">Total Monthly Budget</div>
              <div className="text-3xl font-bold text-blue-600">
                {household?.currency === 'NGN' ? '₦' : '$'}
                {totalBudget.toFixed(2)}
              </div>
            </div>

            {/* Save Button */}
            <Button
              variant="primary"
              onClick={handleSaveAll}
              disabled={isSaving}
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
    </div>
  );
}
