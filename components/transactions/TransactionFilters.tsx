'use client';

import { useState } from 'react';
import type { TransactionFilters, Category, IncomeSource, User } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  categories: Category[];
  incomeSources: IncomeSource[];
  users: User[];
  availableMonths?: { min: string; max: string };
}

export function TransactionFilters({
  filters,
  onChange,
  categories,
  incomeSources,
  users,
  availableMonths,
}: TransactionFiltersProps) {
  const [showDetails, setShowDetails] = useState(true);

  // Generate list of months for date range picker
  const allMonths = availableMonths
    ? generateMonthList(availableMonths.min, availableMonths.max)
    : [];

  const formatMonth = (monthStr: string): string => {
    const date = new Date(`${monthStr}-01`);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    onChange({
      ...filters,
      type,
      // Reset needs/wants if switching away from expense filter
      needsOrWants: type === 'expense' ? filters.needsOrWants : undefined,
    });
  };

  const handleStartMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      dateRange: {
        start: e.target.value,
        end: filters.dateRange?.end || e.target.value,
      },
    });
  };

  const handleEndMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      dateRange: {
        start: filters.dateRange?.start || e.target.value,
        end: e.target.value,
      },
    });
  };

  const handleCategoryToggle = (id: string) => {
    const current = filters.categoryOrSourceIds || [];
    const updated = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    onChange({
      ...filters,
      categoryOrSourceIds: updated.length > 0 ? updated : undefined,
    });
  };

  const handleUserToggle = (id: string) => {
    const current = filters.userIds || [];
    const updated = current.includes(id)
      ? current.filter((u) => u !== id)
      : [...current, id];
    onChange({
      ...filters,
      userIds: updated.length > 0 ? updated : undefined,
    });
  };

  const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = e.target.value ? parseFloat(e.target.value) : undefined;
    onChange({
      ...filters,
      amountRange: {
        ...filters.amountRange,
        min,
      },
    });
  };

  const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = e.target.value ? parseFloat(e.target.value) : undefined;
    onChange({
      ...filters,
      amountRange: {
        ...filters.amountRange,
        max,
      },
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      searchText: e.target.value || undefined,
    });
  };

  const handleNeedsWantsChange = (value: 'all' | 'needs' | 'wants') => {
    onChange({
      ...filters,
      needsOrWants: value,
    });
  };

  const handleClearFilters = () => {
    onChange({});
  };

  const activeFilterCount = [
    filters.type && filters.type !== 'all' ? 1 : 0,
    filters.dateRange?.start || filters.dateRange?.end ? 1 : 0,
    filters.categoryOrSourceIds?.length ? 1 : 0,
    filters.userIds?.length ? 1 : 0,
    filters.amountRange?.min !== undefined || filters.amountRange?.max !== undefined ? 1 : 0,
    filters.needsOrWants && filters.needsOrWants !== 'all' ? 1 : 0,
    filters.searchText ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-950">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="info" size="sm">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            {showDetails ? 'Hide' : 'Show'}
          </button>
          {activeFilterCount > 0 && (
            <Button onClick={handleClearFilters} variant="secondary" size="sm">
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showDetails && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.type === type || (!filters.type && type === 'all')
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="start-month" className="text-xs text-slate-500">
                  From
                </label>
                <select
                  id="start-month"
                  value={filters.dateRange?.start || ''}
                  onChange={handleStartMonthChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select start month</option>
                  {allMonths.map((month) => (
                    <option key={month} value={month}>
                      {formatMonth(month)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="end-month" className="text-xs text-slate-500">
                  To
                </label>
                <select
                  id="end-month"
                  value={filters.dateRange?.end || ''}
                  onChange={handleEndMonthChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select end month</option>
                  {allMonths.map((month) => (
                    <option key={month} value={month}>
                      {formatMonth(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Categories & Sources
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.categoryOrSourceIds?.includes(cat.id) || false}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className="rounded"
                  />
                  <span className="text-slate-700">{cat.name}</span>
                </label>
              ))}
              {incomeSources.map((source) => (
                <label key={source.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.categoryOrSourceIds?.includes(source.id) || false}
                    onChange={() => handleCategoryToggle(source.id)}
                    className="rounded"
                  />
                  <span className="text-slate-700">{source.name}</span>
                </label>
              ))}
            </div>
          </div>

          {users.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Members</label>
              <div className="space-y-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.userIds?.includes(user.id) || false}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded"
                    />
                    <span className="text-slate-700">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Amount Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.amountRange?.min || ''}
                  onChange={handleMinAmountChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.amountRange?.max || ''}
                  onChange={handleMaxAmountChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {(filters.type === 'expense' || filters.type === undefined || !filters.type) && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Needs/Wants</label>
              <div className="flex gap-2">
                {(['all', 'needs', 'wants'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => handleNeedsWantsChange(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.needsOrWants === value || (!filters.needsOrWants && value === 'all')
                        ? 'bg-blue-600 text-white border border-blue-600'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by category, member, or notes..."
              value={filters.searchText || ''}
              onChange={handleSearchChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generate list of months between min and max
 */
function generateMonthList(minMonth: string, maxMonth: string): string[] {
  const months: string[] = [];
  let current = minMonth;

  while (current <= maxMonth) {
    months.push(current);
    const [year, month] = current.split('-');
    let m = parseInt(month) + 1;
    let y = parseInt(year);

    if (m > 12) {
      m = 1;
      y += 1;
    }

    current = `${y}-${String(m).padStart(2, '0')}`;
  }

  return months;
}
