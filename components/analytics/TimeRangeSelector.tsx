'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { TimeRange } from '@/types';
import { getPresetRange, getMonthsInRange } from '@/lib/utils/dateRangeUtils';
import { getCurrentMonth } from '@/lib/utils/monthUtils';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  const handlePreset = (preset: '3months' | '6months' | '12months') => {
    const range = getPresetRange(preset);
    onChange({
      startMonth: range.start,
      endMonth: range.end,
      preset,
    });
    setShowCustom(false);
  };

  const handleCustom = () => {
    setShowCustom(true);
    // Initialize custom range to last 3 months if not already set
    if (value.preset !== 'custom') {
      const range = getPresetRange('3months');
      onChange({
        startMonth: range.start,
        endMonth: range.end,
        preset: 'custom',
      });
    }
  };

  const handleStartMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      startMonth: e.target.value,
      preset: 'custom',
    });
  };

  const handleEndMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      endMonth: e.target.value,
      preset: 'custom',
    });
  };

  // Generate list of months available for selection (last 24 months)
  const currentMonth = getCurrentMonth();
  const availableMonths: string[] = [];
  let month = currentMonth;
  for (let i = 0; i < 24; i++) {
    availableMonths.unshift(month);
    const [year, monthNum] = month.split('-');
    let m = parseInt(monthNum);
    let y = parseInt(year);
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    month = `${y}-${String(m).padStart(2, '0')}`;
  }

  const formatMonth = (monthStr: string): string => {
    const date = new Date(`${monthStr}-01`);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8 shadow-sm">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Time Period</h3>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={value.preset === '3months' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handlePreset('3months')}
            className="px-4"
          >
            Last 3 Months
          </Button>
          <Button
            variant={value.preset === '6months' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handlePreset('6months')}
            className="px-4"
          >
            Last 6 Months
          </Button>
          <Button
            variant={value.preset === '12months' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handlePreset('12months')}
            className="px-4"
          >
            Last 12 Months
          </Button>
          <Button
            variant={showCustom ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleCustom}
            className="px-4"
          >
            Custom
          </Button>
        </div>

        {/* Custom Date Range Selector */}
        {showCustom && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Month
              </label>
              <select
                value={value.startMonth}
                onChange={handleStartMonthChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Month
              </label>
              <select
                value={value.endMonth}
                onChange={handleEndMonthChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Display selected range info */}
        <div className="text-sm text-gray-600">
          {getMonthsInRange(value.startMonth, value.endMonth).length} months of data
        </div>
      </div>
    </div>
  );
}
