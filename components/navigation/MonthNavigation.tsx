'use client';

import { useBudget } from '@/lib/contexts/BudgetContext';
import { getPreviousMonth, getNextMonth, formatMonthDisplay, getCurrentMonth } from '@/lib/utils/monthUtils';
import { Button } from '@/components/ui/Button';

export default function MonthNavigation() {
  const { currentMonth, setCurrentMonth } = useBudget();

  const handlePrevious = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNext = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  const handleToday = () => {
    setCurrentMonth(getCurrentMonth());
  };

  const currentMonthNow = getCurrentMonth();
  const isToday = currentMonth === currentMonthNow;

  return (
    <div className="flex items-center justify-between gap-4 bg-white rounded-lg border border-gray-200 p-3 shadow-sm mb-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePrevious}
        className="flex items-center gap-2"
      >
        <span>←</span>
        Previous
      </Button>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          {formatMonthDisplay(currentMonth)}
        </h2>
        {!isToday && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleNext}
        className="flex items-center gap-2"
      >
        Next
        <span>→</span>
      </Button>
    </div>
  );
}
