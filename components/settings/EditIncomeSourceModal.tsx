'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { IncomeSource } from '@/types';

interface EditIncomeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: IncomeSource;
}

export function EditIncomeSourceModal({ isOpen, onClose, source }: EditIncomeSourceModalProps) {
  const { updateIncomeSource, incomeSources } = useBudget();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (source && isOpen) {
      setName(source.name);
      setDescription(source.description || '');
    }
  }, [source, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Income source name is required');
      return;
    }

    // Check for duplicate income source name (case-insensitive), excluding current source
    const nameExists = incomeSources.some(
      (s) => s.id !== source.id && s.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (nameExists) {
      alert('An income source with this name already exists');
      return;
    }

    setIsSubmitting(true);

    updateIncomeSource(source.id, {
      name: name.trim(),
      description: description.trim() || undefined,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Income Source">
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
