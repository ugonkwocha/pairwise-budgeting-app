'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IncomeSource } from '@/types';
import { FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

interface IncomeStepProps {
  data: {
    incomeSources: Omit<IncomeSource, 'id' | 'createdAt'>[];
  };
  onUpdate: {
    setIncomeSources: (s: Omit<IncomeSource, 'id' | 'createdAt'>[]) => void;
  };
}

export default function IncomeStep({ data, onUpdate }: IncomeStepProps) {
  const defaultSources: Omit<IncomeSource, 'id' | 'createdAt'>[] = [
    { name: 'Salary/Wages', description: 'Employment income', monthlyAmount: 0 },
    { name: 'Bonus', description: 'Annual or periodic bonuses', monthlyAmount: 0 },
    { name: 'Other', description: 'Other income sources', monthlyAmount: 0 },
  ];

  const [sources, setSources] = useState<Omit<IncomeSource, 'id' | 'createdAt'>[]>(
    data.incomeSources.length > 0
      ? data.incomeSources.map((source) => ({ ...source, monthlyAmount: source.monthlyAmount || 0 }))
      : defaultSources
  );
  const [newSource, setNewSource] = useState('');
  const [newSourceAmount, setNewSourceAmount] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftSource, setDraftSource] = useState({ name: '', description: '', monthlyAmount: '' });

  // Ensure default sources are saved to parent on mount
  React.useEffect(() => {
    if (data.incomeSources.length === 0 && sources.length > 0) {
      onUpdate.setIncomeSources(sources);
    }
  }, []);

  const handleAddSource = () => {
    if (newSource.trim() && !sources.some((s) => s.name.toLowerCase() === newSource.trim().toLowerCase())) {
      const plannedAmount = Number(newSourceAmount || 0);
      if (!Number.isFinite(plannedAmount) || plannedAmount < 0) return;

      const updated = [...sources, { name: newSource.trim(), description: '', monthlyAmount: plannedAmount }];
      setSources(updated);
      onUpdate.setIncomeSources(updated);
      setNewSource('');
      setNewSourceAmount('');
    }
  };

  const startEditing = (index: number) => {
    const source = sources[index];
    setEditingIndex(index);
    setDraftSource({
      name: source.name,
      description: source.description || '',
      monthlyAmount: String(source.monthlyAmount || 0),
    });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setDraftSource({ name: '', description: '', monthlyAmount: '' });
  };

  const saveSource = () => {
    if (editingIndex === null) return;

    const name = draftSource.name.trim();
    const description = draftSource.description.trim();
    const monthlyAmount = Number(draftSource.monthlyAmount || 0);
    const duplicate = sources.some(
      (source, index) => index !== editingIndex && source.name.toLowerCase() === name.toLowerCase()
    );

    if (!name || duplicate || !Number.isFinite(monthlyAmount) || monthlyAmount < 0) return;

    const updated = sources.map((source, index) =>
      index === editingIndex ? { ...source, name, description, monthlyAmount } : source
    );
    setSources(updated);
    onUpdate.setIncomeSources(updated);
    cancelEditing();
  };

  const handleRemoveSource = (index: number) => {
    const updated = sources.filter((_, i) => i !== index);
    setSources(updated);
    onUpdate.setIncomeSources(updated);
    if (editingIndex === index) {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Define where household income comes from. You can customize these sources.
      </p>

      <div className="space-y-2">
        {sources.map((source, index) => (
          <div key={`${source.name}-${index}`} className="rounded-lg bg-gray-50 p-3">
            {editingIndex === index ? (
              <div className="space-y-3">
                <Input
                  aria-label="Income source name"
                  value={draftSource.name}
                  onChange={(event) => setDraftSource((draft) => ({ ...draft, name: event.target.value }))}
                  onKeyDown={(event) => event.key === 'Enter' && saveSource()}
                />
                <Input
                  aria-label="Income source description"
                  value={draftSource.description}
                  onChange={(event) => setDraftSource((draft) => ({ ...draft, description: event.target.value }))}
                  onKeyDown={(event) => event.key === 'Enter' && saveSource()}
                  placeholder="Description"
                />
                <Input
                  aria-label="Planned monthly amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftSource.monthlyAmount}
                  onChange={(event) => setDraftSource((draft) => ({ ...draft, monthlyAmount: event.target.value }))}
                  onKeyDown={(event) => event.key === 'Enter' && saveSource()}
                  placeholder="Planned monthly amount"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={saveSource} className="gap-2">
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
                  <div className="break-words font-medium text-gray-900">{source.name}</div>
                  {source.description && (
                    <div className="break-words text-sm text-gray-600">{source.description}</div>
                  )}
                  <div className="mt-1 text-sm font-medium text-gray-600">
                    Planned: ${(source.monthlyAmount || 0).toFixed(2)}/month
                  </div>
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
                    onClick={() => handleRemoveSource(index)}
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_auto]">
        <Input
          placeholder="Add new income source"
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Monthly amount"
          value={newSourceAmount}
          onChange={(e) => setNewSourceAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
        />
        <Button onClick={handleAddSource} variant="secondary" className="sm:w-auto">
          Add
        </Button>
      </div>
    </div>
  );
}
