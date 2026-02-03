'use client';

import React, { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Income } from '@/types';

interface EditIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: Income;
}

export function EditIncomeModal({ isOpen, onClose, income }: EditIncomeModalProps) {
  const { updateIncome, incomeSources, users } = useBudget();
  const [amount, setAmount] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate form when modal opens
  useEffect(() => {
    if (income && isOpen) {
      setAmount(income.amount.toString());
      setSourceId(income.sourceId);
      setUserId(income.userId);
      setDate(income.date);
      setNotes(income.notes || '');
    }
  }, [income, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !sourceId || !userId) {
      alert('Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const source = incomeSources.find((s) => s.id === sourceId);
      const user = users.find((u) => u.id === userId);

      if (!source || !user) {
        alert('Invalid source or user selected');
        return;
      }

      updateIncome(income.id, {
        amount: parsedAmount,
        sourceId,
        sourceName: source.name,
        userId,
        userName: user.name,
        date,
        notes: notes || undefined,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Income" size="md">
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
            label="Income Source *"
            options={[
              { value: '', label: 'Select an income source' },
              ...incomeSources.map((source) => ({
                value: source.id,
                label: source.name,
              })),
            ]}
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
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
