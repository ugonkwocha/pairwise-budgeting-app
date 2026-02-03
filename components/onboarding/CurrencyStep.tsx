'use client';

import React from 'react';
import { Household } from '@/types';

interface CurrencyStepProps {
  data: {
    household: Omit<Household, 'id' | 'createdAt' | 'updatedAt'> | null;
  };
  onUpdate: {
    setHousehold: (h: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>) => void;
  };
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar (C$)', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
  { code: 'NGN', name: 'Nigerian Naira (₦)', symbol: '₦' },
];

export default function CurrencyStep({ data, onUpdate }: CurrencyStepProps) {
  const selectedCurrency = data.household?.currency || 'USD';

  const handleSelect = (currency: string) => {
    if (data.household) {
      onUpdate.setHousehold({ ...data.household, currency: currency as any });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Select the currency you'll use for all transactions in this household.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CURRENCIES.map((curr) => (
          <button
            key={curr.code}
            onClick={() => handleSelect(curr.code)}
            className={`p-4 rounded-lg border-2 transition-colors text-left ${
              selectedCurrency === curr.code
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-lg font-semibold text-gray-900">{curr.code}</div>
            <div className="text-sm text-gray-600">{curr.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
