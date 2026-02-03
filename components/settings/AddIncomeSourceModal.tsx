'use client';

import { useState } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface AddIncomeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddIncomeSourceModal({ isOpen, onClose }: AddIncomeSourceModalProps) {
  const { addIncomeSource, incomeSources } = useBudget();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Income source name is required');
      return;
    }

    // Check for duplicate income source name (case-insensitive)
    const nameExists = incomeSources.some((source) => source.name.toLowerCase() === name.trim().toLowerCase());
    if (nameExists) {
      alert('An income source with this name already exists');
      return;
    }

    setIsSubmitting(true);

    addIncomeSource({
      name: name.trim(),
      description: description.trim() || undefined,
    });

    setName('');
    setDescription('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Income Source">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., Salary, Freelance, Bonus"
        />

        <Input
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about this income source"
        />

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Source'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
