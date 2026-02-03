'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Household } from '@/types';

interface HouseholdStepProps {
  data: {
    household: Omit<Household, 'id' | 'createdAt' | 'updatedAt'> | null;
  };
  onUpdate: {
    setHousehold: (h: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>) => void;
  };
}

export default function HouseholdStep({ data, onUpdate }: HouseholdStepProps) {
  const [name, setName] = useState(data.household?.name || '');
  const [currency, setCurrency] = useState(data.household?.currency || 'USD');

  const handleSave = () => {
    if (name.trim()) {
      onUpdate.setHousehold({
        name: name.trim(),
        currency: currency as any,
      });
    }
  };

  React.useEffect(() => {
    handleSave();
  }, [name, currency, onUpdate]);

  return (
    <div className="space-y-6">
      <Input
        label="Household Name"
        placeholder="e.g., Smith Family, Our Home"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        helperText="Give your household a name so everyone knows what to call it"
      />

      <p className="text-gray-600">
        Your household is where all family members track income and expenses together.
      </p>
    </div>
  );
}
