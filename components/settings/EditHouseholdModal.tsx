'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Currency } from '@/types';

interface EditHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditHouseholdModal({ isOpen, onClose }: EditHouseholdModalProps) {
  const { household, setHousehold } = useBudget();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (household && isOpen) {
      setName(household.name);
      setCurrency(household.currency);
    }
  }, [household, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Household name is required');
      return;
    }

    if (!household) return;

    setIsSubmitting(true);

    setHousehold({
      ...household,
      name: name.trim(),
      currency,
    });

    setIsSubmitting(false);
    onClose();
  };

  const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Household">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Household Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter household name"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-4">
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
