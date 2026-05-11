'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useBudget } from '@/lib/contexts/BudgetContext';
import type { SavingsGoal } from '@/types';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: SavingsGoal | null;
}

export function SavingsGoalModal({ isOpen, onClose, goal }: SavingsGoalModalProps) {
  const { addSavingsGoal, updateSavingsGoal } = useBudget();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setName(goal?.name || '');
    setTargetAmount(goal ? String(goal.targetAmount) : '');
    setCurrentAmount(goal ? String(goal.currentAmount) : '0');
    setDeadline(goal?.deadline || '');
  }, [isOpen, goal]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedTarget = Number(targetAmount);
    const parsedCurrent = Number(currentAmount);

    if (!name.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0 || !Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      return;
    }

    const payload = {
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      deadline: deadline || undefined,
    };

    if (goal) {
      updateSavingsGoal(goal.id, payload);
    } else {
      addSavingsGoal(payload);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={goal ? 'Edit Savings Goal' : 'Add Savings Goal'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Emergency fund"
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Target amount"
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
            required
          />
          <Input
            label="Current saved"
            type="number"
            min="0"
            step="0.01"
            value={currentAmount}
            onChange={(event) => setCurrentAmount(event.target.value)}
            required
          />
        </div>
        <Input
          label="Deadline"
          type="date"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
        />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{goal ? 'Save Changes' : 'Add Goal'}</Button>
        </div>
      </form>
    </Modal>
  );
}
