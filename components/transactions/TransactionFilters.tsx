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
        ...filters.dateRange,
        start: e.target.value,
      },
    });
  };

  const handleEndMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="info" size="sm">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-600 hover:text-gray-900"
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
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.type === type || (!filters.type && type === 'all')
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="start-month" className="text-xs text-gray-600">
                  From
                </label>
                <select
                  id="start-month"
                  value={filters.dateRange?.start || ''}
                  onChange={handleStartMonthChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label htmlFor="end-month" className="text-xs text-gray-600">
                  To
                </label>
                <select
                  id="end-month"
                  value={filters.dateRange?.end || ''}
                  onChange={handleEndMonthChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Category/Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <span className="text-gray-700">{cat.name}</span>
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
                  <span className="text-gray-700">{source.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* User Filter */}
          {users.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
              <div className="space-y-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.userIds?.includes(user.id) || false}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded"
                    />
                    <span className="text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Amount Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.amountRange?.min || ''}
                  onChange={handleMinAmountChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.amountRange?.max || ''}
                  onChange={handleMaxAmountChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Needs/Wants Filter (only for expenses) */}
          {(filters.type === 'expense' || filters.type === undefined || !filters.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Needs/Wants</label>
              <div className="flex gap-2">
                {(['all', 'needs', 'wants'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => handleNeedsWantsChange(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.needsOrWants === value || (!filters.needsOrWants && value === 'all')
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Filter */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by category, member, or notes..."
              value={filters.searchText || ''}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
