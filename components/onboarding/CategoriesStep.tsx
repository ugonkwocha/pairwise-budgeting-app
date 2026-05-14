'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Category } from '@/types';
import { FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

interface CategoriesStepProps {
  data: {
    categories: Omit<Category, 'id' | 'createdAt'>[];
  };
  onUpdate: {
    setCategories: (c: Omit<Category, 'id' | 'createdAt'>[]) => void;
  };
}

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Groceries', monthlyBudget: 400, carryOverEnabled: false },
  { name: 'Utilities', monthlyBudget: 200, carryOverEnabled: true },
  { name: 'Rent/Mortgage', monthlyBudget: 1200, carryOverEnabled: true },
  { name: 'Transportation', monthlyBudget: 300, carryOverEnabled: false },
  { name: 'Entertainment', monthlyBudget: 150, carryOverEnabled: false },
  { name: 'Healthcare', monthlyBudget: 200, carryOverEnabled: false },
];

export default function CategoriesStep({ data, onUpdate }: CategoriesStepProps) {
  const [categories, setCategories] = useState<Omit<Category, 'id' | 'createdAt'>[]>(
    data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES
  );
  const [newCategory, setNewCategory] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftCategory, setDraftCategory] = useState({
    name: '',
    monthlyBudget: '',
    carryOverEnabled: false,
  });

  // Ensure default categories are saved to parent on mount
  React.useEffect(() => {
    if (data.categories.length === 0 && categories.length > 0) {
      onUpdate.setCategories(categories);
    }
  }, []);

  const handleAddCategory = () => {
    if (
      newCategory.trim() &&
      newBudget &&
      !categories.some((c) => c.name.toLowerCase() === newCategory.trim().toLowerCase())
    ) {
      const updated = [
        ...categories,
        { name: newCategory.trim(), monthlyBudget: parseFloat(newBudget), carryOverEnabled: false },
      ];
      setCategories(updated);
      onUpdate.setCategories(updated);
      setNewCategory('');
      setNewBudget('');
    }
  };

  const startEditing = (index: number) => {
    const category = categories[index];
    setEditingIndex(index);
    setDraftCategory({
      name: category.name,
      monthlyBudget: String(category.monthlyBudget),
      carryOverEnabled: category.carryOverEnabled,
    });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setDraftCategory({ name: '', monthlyBudget: '', carryOverEnabled: false });
  };

  const saveCategory = () => {
    if (editingIndex === null) return;

    const name = draftCategory.name.trim();
    const monthlyBudget = Number(draftCategory.monthlyBudget);
    const duplicate = categories.some(
      (category, index) => index !== editingIndex && category.name.toLowerCase() === name.toLowerCase()
    );

    if (!name || duplicate || !Number.isFinite(monthlyBudget) || monthlyBudget < 0) return;

    const updated = categories.map((category, index) =>
      index === editingIndex
        ? {
            ...category,
            name,
            monthlyBudget,
            carryOverEnabled: draftCategory.carryOverEnabled,
          }
        : category
    );
    setCategories(updated);
    onUpdate.setCategories(updated);
    cancelEditing();
  };

  const handleRemoveCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
    onUpdate.setCategories(updated);
    if (editingIndex === index) {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Create expense categories for your household. These are the buckets where expenses will be tracked.
      </p>

      <div className="space-y-2">
        {categories.map((cat, index) => (
          <div key={`${cat.name}-${index}`} className="rounded-lg bg-gray-50 p-3">
            {editingIndex === index ? (
              <div className="space-y-3">
                <Input
                  aria-label="Category name"
                  value={draftCategory.name}
                  onChange={(event) => setDraftCategory((draft) => ({ ...draft, name: event.target.value }))}
                  onKeyDown={(event) => event.key === 'Enter' && saveCategory()}
                />
                <Input
                  aria-label="Monthly budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftCategory.monthlyBudget}
                  onChange={(event) => setDraftCategory((draft) => ({ ...draft, monthlyBudget: event.target.value }))}
                  onKeyDown={(event) => event.key === 'Enter' && saveCategory()}
                />
                <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={draftCategory.carryOverEnabled}
                    onChange={(event) =>
                      setDraftCategory((draft) => ({ ...draft, carryOverEnabled: event.target.checked }))
                    }
                  />
                  Allow unused budget to carry over
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={saveCategory} className="gap-2">
                    <FiCheck aria-hidden="true" />
                    Save
                  </Button>
                  <Button variant="secondary" size="sm" onClick={cancelEditing} className="gap-2">
                    <FiX aria-hidden="true" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="break-words font-medium text-gray-900">{cat.name}</div>
                  <div className="text-sm text-gray-600">Budget: ${cat.monthlyBudget.toFixed(2)}/month</div>
                  {cat.carryOverEnabled && (
                    <div className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Carryover enabled
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEditing(index)}
                    className="gap-2"
                  >
                    <FiEdit2 aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveCategory(index)}
                    className="gap-2"
                  >
                    <FiTrash2 aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Input
            placeholder="Monthly budget"
            type="number"
            min="0"
            step="0.01"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
          />
        </div>
        <Button onClick={handleAddCategory} variant="secondary" className="w-full">
          Add Category
        </Button>
      </div>
    </div>
  );
}
