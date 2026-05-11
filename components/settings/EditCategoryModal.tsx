'use client';

import { useEffect, useState } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Category } from '@/types';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}

const CATEGORY_COLORS = ['#2563eb', '#16a394', '#f8b917', '#ff5a1f', '#8b5cf6', '#12aeea'];

export function EditCategoryModal({ isOpen, onClose, category }: EditCategoryModalProps) {
  const { updateCategory, categories } = useBudget();
  const [name, setName] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [carryOverEnabled, setCarryOverEnabled] = useState(false);
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(category.name);
    setMonthlyBudget(String(category.monthlyBudget));
    setCarryOverEnabled(category.carryOverEnabled);
    setColor(category.color || CATEGORY_COLORS[0]);
    setIsSubmitting(false);
  }, [category, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const budget = Number(monthlyBudget || 0);

    if (!trimmedName) {
      alert('Category name is required');
      return;
    }

    if (budget < 0) {
      alert('Monthly budget cannot be negative');
      return;
    }

    const nameExists = categories.some(
      (existingCategory) =>
        existingCategory.id !== category.id &&
        existingCategory.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      alert('A category with this name already exists');
      return;
    }

    setIsSubmitting(true);
    updateCategory(category.id, {
      name: trimmedName,
      monthlyBudget: budget,
      carryOverEnabled,
      color,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Expense Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., Groceries, Utilities, Travel"
        />

        <Input
          label="Monthly Budget"
          type="number"
          min="0"
          step="0.01"
          value={monthlyBudget}
          onChange={(e) => setMonthlyBudget(e.target.value)}
          placeholder="0.00"
        />

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Color</label>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={`Use color ${option}`}
                onClick={() => setColor(option)}
                className={`h-9 rounded-lg border-2 transition ${color === option ? 'border-slate-950' : 'border-transparent'}`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={carryOverEnabled}
            onChange={() => setCarryOverEnabled((value) => !value)}
            className="mt-0.5 rounded border-slate-300"
          />
          <span>Allow unused budget to carry over to next month</span>
        </label>

        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
