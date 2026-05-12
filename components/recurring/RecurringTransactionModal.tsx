'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { getLocalDateString } from '@/lib/utils/dateUtils';
import type { RecurringFrequency, RecurringTransaction } from '@/types';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurring?: RecurringTransaction | null;
}

const frequencyOptions: Array<{ value: RecurringFrequency; label: string }> = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function RecurringTransactionModal({ isOpen, onClose, recurring }: RecurringTransactionModalProps) {
  const {
    addRecurringTransaction,
    updateRecurringTransaction,
    categories,
    incomeSources,
    users,
    currentUser,
  } = useBudget();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [needsOrWants, setNeedsOrWants] = useState<'needs' | 'wants'>('needs');
  const [userId, setUserId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [nextDueDate, setNextDueDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const isEditing = Boolean(recurring);
  const selectedSource = useMemo(() => incomeSources.find((source) => source.id === sourceId), [incomeSources, sourceId]);
  const selectedCategory = useMemo(() => categories.find((category) => category.id === categoryId), [categories, categoryId]);
  const selectedUser = useMemo(() => users.find((user) => user.id === userId), [users, userId]);

  useEffect(() => {
    if (!isOpen) return;

    if (recurring) {
      setType(recurring.type);
      setName(recurring.name);
      setAmount(String(recurring.amount));
      setSourceId(recurring.sourceId || '');
      setCategoryId(recurring.categoryId || '');
      setNeedsOrWants(recurring.needsOrWants || 'needs');
      setUserId(recurring.userId || currentUser?.id || users[0]?.id || '');
      setFrequency(recurring.frequency);
      setStartDate(recurring.startDate);
      setNextDueDate(recurring.nextDueDate);
      setEndDate(recurring.endDate || '');
      setNotes(recurring.notes || '');
      setIsActive(recurring.isActive);
      return;
    }

    const today = getLocalDateString();
    setType('expense');
    setName('');
    setAmount('');
    setSourceId(incomeSources[0]?.id || '');
    setCategoryId(categories[0]?.id || '');
    setNeedsOrWants('needs');
    setUserId(currentUser?.id || users[0]?.id || '');
    setFrequency('monthly');
    setStartDate(today);
    setNextDueDate(today);
    setEndDate('');
    setNotes('');
    setIsActive(true);
  }, [isOpen, recurring, categories, incomeSources, users, currentUser]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !userId) {
      return;
    }

    if (type === 'income' && !selectedSource) {
      return;
    }

    if (type === 'expense' && !selectedCategory) {
      return;
    }

    const payload = {
      type,
      name: name.trim(),
      amount: parsedAmount,
      sourceId: type === 'income' ? selectedSource?.id : undefined,
      sourceName: type === 'income' ? selectedSource?.name : undefined,
      categoryId: type === 'expense' ? selectedCategory?.id : undefined,
      categoryName: type === 'expense' ? selectedCategory?.name : undefined,
      needsOrWants: type === 'expense' ? needsOrWants : undefined,
      userId,
      userName: selectedUser?.name || 'Household',
      frequency,
      startDate,
      nextDueDate,
      endDate: endDate || undefined,
      notes: notes.trim() || undefined,
      autoPost: false,
      isActive,
      createdBy: currentUser?.id || userId,
    };

    if (recurring) {
      updateRecurringTransaction(recurring.id, payload);
    } else {
      addRecurringTransaction(payload);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Recurring Item' : 'Add Recurring Item'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
            value={type}
            onChange={(event) => setType(event.target.value as 'income' | 'expense')}
          />
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={type === 'income' ? 'Salary' : 'Rent'}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
          />
          <Select
            label="Member"
            options={users.map((user) => ({ value: user.id, label: user.name }))}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            required
          />
        </div>

        {type === 'income' ? (
          <Select
            label="Income Source"
            options={incomeSources.map((source) => ({ value: source.id, label: source.name }))}
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
            required
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Expense Category"
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
            />
            <Select
              label="Type"
              options={[
                { value: 'needs', label: 'Needs' },
                { value: 'wants', label: 'Wants' },
              ]}
              value={needsOrWants}
              onChange={(event) => setNeedsOrWants(event.target.value as 'needs' | 'wants')}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Frequency"
            options={frequencyOptions}
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as RecurringFrequency)}
            required
          />
          <Input
            label="Starts"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
          <Input
            label="Next due"
            type="date"
            value={nextDueDate}
            onChange={(event) => setNextDueDate(event.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label="Ends"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active
          </label>
        </div>

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
          <Button type="submit">
            {isEditing ? 'Save Changes' : 'Add Recurring Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
