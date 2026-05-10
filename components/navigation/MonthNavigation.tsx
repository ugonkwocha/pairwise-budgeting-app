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
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePrevious}
        className="flex items-center gap-2 border-0 shadow-none"
      >
        <span>←</span>
        Previous
      </Button>

      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-950 sm:text-base">
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
        className="flex items-center gap-2 border-0 shadow-none"
      >
        Next
        <span>→</span>
      </Button>
    </div>
  );
}
