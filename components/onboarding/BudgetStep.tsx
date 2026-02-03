'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Category } from '@/types';

interface BudgetStepProps {
  data: {
    categories: Omit<Category, 'id' | 'createdAt'>[];
  };
  onUpdate: {
    setCategories: (c: Omit<Category, 'id' | 'createdAt'>[]) => void;
  };
}

export default function BudgetStep({ data, onUpdate }: BudgetStepProps) {
  const handleUpdateBudget = (index: number, budget: string) => {
    const updated = [...data.categories];
    updated[index] = { ...updated[index], monthlyBudget: parseFloat(budget) || 0 };
    onUpdate.setCategories(updated);
  };

  const handleToggleCarryOver = (index: number) => {
    const updated = [...data.categories];
    updated[index] = { ...updated[index], carryOverEnabled: !updated[index].carryOverEnabled };
    onUpdate.setCategories(updated);
  };

  const totalBudget = data.categories.reduce((sum, c) => sum + c.monthlyBudget, 0);

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Set monthly budgets for each category. You can adjust these anytime.
      </p>

      <div className="space-y-4">
        {data.categories.map((cat, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {cat.name}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cat.monthlyBudget}
                  onChange={(e) => handleUpdateBudget(index, e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-900">/month</span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={cat.carryOverEnabled}
                onChange={() => handleToggleCarryOver(index)}
                className="rounded"
              />
              <span>Allow unused budget to carry over to next month</span>
            </label>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-600">Total Monthly Budget</div>
        <div className="text-3xl font-bold text-blue-600">${totalBudget.toFixed(2)}</div>
      </div>

      <p className="text-sm text-gray-600">
        Your household will be ready to track expenses once you complete this setup. You can update these budgets
        anytime from the settings.
      </p>
    </div>
  );
}
