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
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex sm:flex-wrap sm:items-center">
      <label htmlFor="sort-field" className="text-sm font-semibold text-slate-700 sm:shrink-0">
        Sort by:
      </label>
      <select
        id="sort-field"
        value={sort.field}
        onChange={handleFieldChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-auto"
      >
        {SORT_FIELDS.map((field) => (
          <option key={field.value} value={field.value}>
            {field.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleDirectionToggle}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
        title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sort.direction === 'asc' ? '↑' : '↓'} {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
      </button>
    </div>
  );
}
