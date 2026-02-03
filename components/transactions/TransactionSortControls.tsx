'use client';

import type { TransactionSort, SortField } from '@/types';

interface TransactionSortControlsProps {
  sort: TransactionSort;
  onChange: (sort: TransactionSort) => void;
}

const SORT_FIELDS: Array<{ value: SortField; label: string }> = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'categoryOrSource', label: 'Category/Source' },
  { value: 'userName', label: 'Member' },
];

export function TransactionSortControls({ sort, onChange }: TransactionSortControlsProps) {
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...sort,
      field: e.target.value as SortField,
    });
  };

  const handleDirectionToggle = () => {
    onChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
      <label htmlFor="sort-field" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="sort-field"
        value={sort.field}
        onChange={handleFieldChange}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SORT_FIELDS.map((field) => (
          <option key={field.value} value={field.value}>
            {field.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleDirectionToggle}
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
        title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sort.direction === 'asc' ? '↑' : '↓'} {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
      </button>
    </div>
  );
}
