'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useBudget } from '@/lib/contexts/BudgetContext';
import type { SavingsGoal } from '@/types';

interface SavingsContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: SavingsGoal | null;
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function SavingsContributionModal({ isOpen, onClose, goal }: SavingsContributionModalProps) {
  const { addSavingsContribution, savingsGoals, users, currentUser, currentMonth } = useBudget();
  const [goalId, setGoalId] = useState('');
  const [amount, setAmount] = useState('');
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(todayString());
  const [notes, setNotes] = useState('');

  const selectedGoal = useMemo(() => savingsGoals.find((item) => item.id === goalId), [goalId, savingsGoals]);
  const selectedUser = useMemo(() => users.find((user) => user.id === userId), [userId, users]);

  useEffect(() => {
    if (!isOpen) return;

    const today = todayString();
    setGoalId(goal?.id || savingsGoals[0]?.id || '');
    setAmount('');
    setUserId(currentUser?.id || users[0]?.id || '');
    setDate(today.startsWith(currentMonth) ? today : `${currentMonth}-01`);
    setNotes('');
  }, [isOpen, goal, savingsGoals, users, currentUser, currentMonth]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!selectedGoal || !selectedUser || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    addSavingsContribution({
      goalId: selectedGoal.id,
      amount: parsedAmount,
      userId: selectedUser.id,
      userName: selectedUser.name,
      date,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Savings Contribution" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Savings goal"
          options={savingsGoals.map((item) => ({ value: item.id, label: item.name }))}
          value={goalId}
          onChange={(event) => setGoalId(event.target.value)}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
        <Select
          label="Member"
          options={users.map((user) => ({ value: user.id, label: user.name }))}
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-base text-slate-950 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Optional notes"
          />
        </div>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Contribution</Button>
        </div>
      </form>
    </Modal>
  );
}
