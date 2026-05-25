'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiRepeat,
  FiTarget,
  FiTrash2,
} from 'react-icons/fi';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { formatLocalDate, getLocalDateString, parseLocalDate } from '@/lib/utils/dateUtils';
import type { RecurringFrequency, RecurringTransaction } from '@/types';

type CalendarItemType = 'income' | 'expense' | 'recurring_income' | 'recurring_expense' | 'savings_goal';

interface CalendarItem {
  id: string;
  type: CalendarItemType;
  date: string;
  title: string;
  subtitle: string;
  amount?: number;
  recurringId?: string;
  actualId?: string;
  actualType?: 'income' | 'expense';
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateString(date: Date) {
  return getLocalDateString(date);
}

function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function getNextDueDate(date: Date, frequency: RecurringFrequency): Date {
  const next = new Date(date);

  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'biweekly') {
    next.setDate(next.getDate() + 14);
  } else if (frequency === 'monthly') {
    return addMonthsClamped(next, 1);
  } else if (frequency === 'quarterly') {
    return addMonthsClamped(next, 3);
  } else {
    return addMonthsClamped(next, 12);
  }

  return next;
}

function getMonthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 0);
  return { start, end };
}

function getCalendarDays(month: string) {
  const { start, end } = getMonthBounds(month);
  const first = new Date(start);
  first.setDate(first.getDate() - first.getDay());
  const last = new Date(end);
  last.setDate(last.getDate() + (6 - last.getDay()));

  const days: Date[] = [];
  const cursor = new Date(first);
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function daysUntil(value: string) {
  const today = parseLocalDate(getLocalDateString());
  const due = parseLocalDate(value);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function generateRecurringOccurrences(item: RecurringTransaction, month: string): CalendarItem[] {
  if (!item.isActive) return [];

  const { start, end } = getMonthBounds(month);
  const hardEnd = item.endDate ? parseLocalDate(item.endDate) : end;
  const monthEnd = hardEnd < end ? hardEnd : end;
  let cursor = parseLocalDate(item.nextDueDate);

  while (cursor < start) {
    cursor = getNextDueDate(cursor, item.frequency);
  }

  const occurrences: CalendarItem[] = [];
  let guard = 0;
  while (cursor <= monthEnd && guard < 40) {
    const date = toDateString(cursor);
    occurrences.push({
      id: `recurring-${item.id}-${date}`,
      recurringId: item.id,
      type: item.type === 'income' ? 'recurring_income' : 'recurring_expense',
      date,
      title: item.name,
      subtitle: item.type === 'income' ? item.sourceName || 'Recurring income' : item.categoryName || 'Recurring expense',
      amount: item.amount,
    });
    cursor = getNextDueDate(cursor, item.frequency);
    guard += 1;
  }

  return occurrences;
}

function itemTone(type: CalendarItemType) {
  if (type === 'income' || type === 'recurring_income') return 'bg-teal-50 text-teal-700 border-teal-100';
  if (type === 'expense' || type === 'recurring_expense') return 'bg-orange-50 text-orange-700 border-orange-100';
  return 'bg-blue-50 text-blue-700 border-blue-100';
}

function itemIcon(type: CalendarItemType) {
  if (type === 'income') return FiArrowUpRight;
  if (type === 'expense') return FiCreditCard;
  if (type === 'recurring_income' || type === 'recurring_expense') return FiRepeat;
  return FiTarget;
}

function isPostedFromRecurring(item: RecurringTransaction, date: string, actuals: { date: string; amount: number; userId: string; sourceId?: string; sourceName?: string; categoryId?: string; categoryName?: string; notes?: string }[]) {
  return actuals.some((actual) =>
    actual.date === date &&
    actual.amount === item.amount &&
    actual.userId === item.userId &&
    (item.type === 'income'
      ? actual.sourceId === item.sourceId || actual.sourceName === (item.sourceName || item.name)
      : actual.categoryId === item.categoryId || actual.categoryName === (item.categoryName || item.name)) &&
    (actual.notes === item.name || actual.notes?.startsWith(`${item.name}:`))
  );
}

export default function CalendarPage() {
  const {
    household,
    currentMonth,
    incomes,
    expenses,
    recurringTransactions,
    savingsGoals,
    postRecurringTransaction,
    deleteIncome,
    deleteExpense,
  } = useBudget();

  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today.startsWith(currentMonth) ? today : `${currentMonth}-01`);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currency = household?.currency === 'NGN' ? '₦' : '$';
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  useEffect(() => {
    setSelectedDate(today.startsWith(currentMonth) ? today : `${currentMonth}-01`);
  }, [currentMonth, today]);

  const items = useMemo<CalendarItem[]>(() => {
    const actualIncomeItems = incomes
      .filter((income) => income.date.startsWith(currentMonth))
      .map((income) => ({
        id: `income-${income.id}`,
        type: 'income' as const,
        date: income.date,
        title: income.sourceName,
        subtitle: income.userName,
        amount: income.amount,
        actualId: income.id,
        actualType: 'income' as const,
      }));

    const actualExpenseItems = expenses
      .filter((expense) => expense.date.startsWith(currentMonth))
      .map((expense) => ({
        id: `expense-${expense.id}`,
        type: 'expense' as const,
        date: expense.date,
        title: expense.categoryName,
        subtitle: expense.userName,
        amount: expense.amount,
        actualId: expense.id,
        actualType: 'expense' as const,
      }));

    const recurringItems = recurringTransactions
      .flatMap((recurring) =>
        generateRecurringOccurrences(recurring, currentMonth)
          .filter((occurrence) =>
            recurring.type === 'income'
              ? !isPostedFromRecurring(recurring, occurrence.date, incomes)
              : !isPostedFromRecurring(recurring, occurrence.date, expenses)
          )
      );

    const goalItems = savingsGoals
      .filter((goal) => goal.deadline?.startsWith(currentMonth))
      .map((goal) => ({
        id: `goal-${goal.id}`,
        type: 'savings_goal' as const,
        date: goal.deadline as string,
        title: goal.name,
        subtitle: `${currency}${Math.max(goal.targetAmount - goal.currentAmount, 0).toFixed(2)} remaining`,
        amount: goal.targetAmount,
      }));

    return [...actualIncomeItems, ...actualExpenseItems, ...recurringItems, ...goalItems]
      .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  }, [currentMonth, currency, expenses, incomes, recurringTransactions, savingsGoals]);

  const itemsByDate = useMemo(() => {
    return items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
      acc[item.date] = [...(acc[item.date] || []), item];
      return acc;
    }, {});
  }, [items]);

  const selectedItems = itemsByDate[selectedDate] || [];
  const actualIncome = incomes
    .filter((income) => income.date.startsWith(currentMonth))
    .reduce((sum, income) => sum + income.amount, 0);
  const actualExpenses = expenses
    .filter((expense) => expense.date.startsWith(currentMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const scheduledIncome = items
    .filter((item) => item.type === 'recurring_income')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const scheduledExpenses = items
    .filter((item) => item.type === 'recurring_expense')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const upcomingItems = items
    .filter((item) => item.date >= today && (item.type === 'recurring_expense' || item.type === 'recurring_income' || item.type === 'savings_goal'))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const metricCards = [
    { label: 'Actual income', value: actualIncome, icon: FiArrowUpRight, tone: 'bg-teal-50 text-teal-700' },
    { label: 'Actual expenses', value: actualExpenses, icon: FiCreditCard, tone: 'bg-orange-50 text-orange-700' },
    { label: 'Scheduled income', value: scheduledIncome, icon: FiDollarSign, tone: 'bg-cyan-50 text-cyan-700' },
    { label: 'Scheduled expenses', value: scheduledExpenses, icon: FiClock, tone: 'bg-violet-50 text-violet-700' },
  ];

  if (!household) return null;

  const handlePostRecurring = async (item: CalendarItem) => {
    if (!item.recurringId) return;
    setPostingId(item.recurringId);
    setNotice(null);

    try {
      const result = await postRecurringTransaction(item.recurringId);
      const postedDate = result?.income?.date || result?.expense?.date || item.date;
      setNotice({
        type: 'success',
        message: `${item.title} was posted for ${formatLocalDate(postedDate)}. Delete the posted entry on this calendar day to reverse it.`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to post recurring item.',
      });
    } finally {
      setPostingId(null);
    }
  };

  const handleDeleteActualItem = (item: CalendarItem) => {
    if (!item.actualId || !item.actualType) return;

    if (item.actualType === 'income') {
      deleteIncome(item.actualId);
      setNotice({ type: 'success', message: `${item.title} income was deleted.` });
    } else {
      deleteExpense(item.actualId);
      setNotice({ type: 'success', message: `${item.title} expense was deleted.` });
    }
  };

  const renderAgendaItem = (item: CalendarItem) => {
    const Icon = itemIcon(item.type);
    const dueIn = daysUntil(item.date);

    return (
      <div key={item.id} className="grid grid-cols-[auto_1fr] gap-3 rounded-lg bg-slate-50 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <span className={`grid h-9 w-9 place-items-center rounded-lg border ${itemTone(item.type)}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950">{item.title}</p>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${itemTone(item.type)}`}>
              {item.type.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatLocalDate(item.date, { month: 'short', day: 'numeric', year: 'numeric' })} • {item.subtitle}
            {item.date >= today && item.type.startsWith('recurring') ? (
              <span className={dueIn <= 3 ? 'font-semibold text-orange-600' : 'text-slate-500'}>
                {' '}• {dueIn === 0 ? 'due today' : `due in ${dueIn} day${dueIn === 1 ? '' : 's'}`}
              </span>
            ) : null}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
          {typeof item.amount === 'number' && (
            <p className="font-semibold text-slate-950">
              {currency}
              {item.amount.toFixed(2)}
            </p>
          )}
          {item.actualId && (
            <Button type="button" size="sm" variant="ghost" onClick={() => handleDeleteActualItem(item)}>
              <FiTrash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          )}
          {item.recurringId && item.date <= today && (
            <Button
              type="button"
              size="sm"
              disabled={postingId === item.recurringId}
              onClick={() => handlePostRecurring(item)}
            >
              <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
              {postingId === item.recurringId ? 'Posting...' : 'Post'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Calendar
          </div>
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-slate-950">Calendar</h1>
              <p className="mt-3 text-sm text-slate-500">
                Plan around income, spending, recurring bills, and savings deadlines.
              </p>
            </div>
            <div className="w-full min-w-0 xl:w-[520px]">
              <MonthNavigation />
            </div>
          </div>
        </div>

        {notice && (
          <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${
            notice.type === 'success'
              ? 'border-teal-200 bg-teal-50 text-teal-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {notice.message}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metricCards.map((metric) => (
            <Card key={metric.label} className={`border-0 p-3 sm:p-4 ${metric.tone.split(' ')[0]}`}>
              <CardHeader className="mb-4 flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:text-xs">
                  {metric.label}
                </CardTitle>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm ${metric.tone.split(' ').slice(1).join(' ')}`}>
                  <metric.icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="whitespace-nowrap text-xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-2xl">
                  {currency}
                  {metric.value.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          <Card className="border-slate-200 bg-white p-0">
            <CardHeader className="mb-0 border-b border-slate-100 p-4 sm:p-5">
              <CardTitle className="text-sm uppercase tracking-wide">Month View</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-5">
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:gap-2 sm:text-xs">
                {WEEKDAY_LABELS.map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((date) => {
                  const dateString = toDateString(date);
                  const dayItems = itemsByDate[dateString] || [];
                  const inMonth = dateString.startsWith(currentMonth);
                  const isToday = dateString === today;
                  const isSelected = dateString === selectedDate;

                  return (
                    <button
                      key={dateString}
                      type="button"
                      onClick={() => setSelectedDate(dateString)}
                      className={`min-h-[88px] min-w-0 rounded-lg border p-2 text-left transition sm:min-h-[130px] ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : inMonth
                            ? 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                            : 'border-slate-100 bg-slate-50 text-slate-300'
                      }`}
                    >
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                        isToday ? 'bg-blue-600 text-white' : inMonth ? 'text-slate-950' : 'text-slate-300'
                      }`}>
                        {date.getDate()}
                      </span>
                      <div className="mt-2 space-y-1">
                        {dayItems.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className={`truncate rounded-md border px-1.5 py-1 text-[10px] font-semibold sm:text-xs ${itemTone(item.type)}`}
                          >
                            {item.title}
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <p className="text-[10px] font-semibold text-slate-400">+{dayItems.length - 3} more</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="border-slate-200 bg-white p-0">
              <CardHeader className="mb-0 border-b border-slate-100 p-5">
                <CardTitle className="text-sm uppercase tracking-wide">
                  {formatLocalDate(selectedDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3">
                  {selectedItems.map(renderAgendaItem)}
                  {selectedItems.length === 0 && (
                    <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Nothing scheduled for this day.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white p-0">
              <CardHeader className="mb-0 border-b border-slate-100 p-5">
                <CardTitle className="text-sm uppercase tracking-wide">Upcoming</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3">
                  {upcomingItems.map(renderAgendaItem)}
                  {upcomingItems.length === 0 && (
                    <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No upcoming scheduled items this month.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
