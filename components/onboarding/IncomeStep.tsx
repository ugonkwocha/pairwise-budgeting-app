'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IncomeSource } from '@/types';

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
    { name: 'Salary/Wages', description: 'Employment income' },
    { name: 'Bonus', description: 'Annual or periodic bonuses' },
    { name: 'Other', description: 'Other income sources' },
  ];

  const [sources, setSources] = useState<Omit<IncomeSource, 'id' | 'createdAt'>[]>(
    data.incomeSources.length > 0 ? data.incomeSources : defaultSources
  );
  const [newSource, setNewSource] = useState('');

  // Ensure default sources are saved to parent on mount
  React.useEffect(() => {
    if (data.incomeSources.length === 0 && sources.length > 0) {
      onUpdate.setIncomeSources(sources);
    }
  }, []);

  const handleAddSource = () => {
    if (newSource.trim() && !sources.some((s) => s.name.toLowerCase() === newSource.toLowerCase())) {
      const updated = [...sources, { name: newSource.trim(), description: '' }];
      setSources(updated);
      onUpdate.setIncomeSources(updated);
      setNewSource('');
    }
  };

  const handleRemoveSource = (index: number) => {
    const updated = sources.filter((_, i) => i !== index);
    setSources(updated);
    onUpdate.setIncomeSources(updated);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Define where household income comes from. You can customize these sources.
      </p>

      <div className="space-y-2">
        {sources.map((source, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{source.name}</div>
              {source.description && (
                <div className="text-sm text-gray-600">{source.description}</div>
              )}
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRemoveSource(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add new income source"
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSource()}
        />
        <Button onClick={handleAddSource} variant="secondary">
          Add
        </Button>
      </div>
    </div>
  );
}
