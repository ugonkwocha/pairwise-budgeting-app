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
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePrevious}
        className="min-w-0 justify-center gap-1 border-0 px-2 shadow-none sm:gap-2 sm:px-3"
      >
        <span aria-hidden="true">←</span>
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <div className="flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-3">
        <h2 className="whitespace-nowrap text-center text-sm font-semibold text-slate-950 sm:text-base">
          {formatMonthDisplay(currentMonth)}
        </h2>
        {!isToday && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="px-2 py-1 text-xs"
          >
            Today
          </Button>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleNext}
        className="min-w-0 justify-center gap-1 border-0 px-2 shadow-none sm:gap-2 sm:px-3"
      >
        <span className="hidden sm:inline">Next</span>
        <span aria-hidden="true">→</span>
      </Button>
    </div>
  );
}
