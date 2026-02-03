'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Category } from '@/types';

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
      !categories.some((c) => c.name.toLowerCase() === newCategory.toLowerCase())
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

  const handleRemoveCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
    onUpdate.setCategories(updated);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Create expense categories for your household. These are the buckets where expenses will be tracked.
      </p>

      <div className="space-y-2">
        {categories.map((cat, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{cat.name}</div>
              <div className="text-sm text-gray-600">Budget: ${cat.monthlyBudget.toFixed(2)}/month</div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRemoveCategory(index)}
            >
              Remove
            </Button>
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
