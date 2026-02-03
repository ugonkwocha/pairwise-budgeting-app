'use client';

import React, { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const { addExpense, categories, users, currentMonth } = useBudget();
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [needsOrWants, setNeedsOrWants] = useState<'needs' | 'wants'>('needs');
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update date when modal opens to ensure it's in the current viewed month
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const localDateStr = getLocalDateString();

      // If current date is in the viewed month, use it; otherwise use first day of viewed month
      if (localDateStr.startsWith(currentMonth)) {
        setDate(localDateStr);
      } else {
        setDate(`${currentMonth}-01`);
      }
    }
  }, [isOpen, currentMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !categoryId || !userId) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const category = categories.find((c) => c.id === categoryId);
      const user = users.find((u) => u.id === userId);

      if (!category || !user) {
        alert('Invalid category or user selected');
        return;
      }

      addExpense({
        amount: parseFloat(amount),
        categoryId,
        categoryName: category.name,
        needsOrWants,
        userId,
        userName: user.name,
        date,
        notes: notes || undefined,
        createdBy: userId,
      });

      // Reset form
      setAmount('');
      setCategoryId('');
      setNeedsOrWants('needs');
      setUserId('');
      setDate(getLocalDateString());
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Select
            label="Category *"
            options={[
              { value: '', label: 'Select a category' },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Select
            label="Type *"
            options={[
              { value: 'needs', label: 'Needs' },
              { value: 'wants', label: 'Wants' },
            ]}
            value={needsOrWants}
            onChange={(e) => setNeedsOrWants(e.target.value as 'needs' | 'wants')}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Select
            label="Member *"
            options={[
              { value: '', label: 'Select a member' },
              ...users.map((user) => ({
                value: user.id,
                label: user.name,
              })),
            ]}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
