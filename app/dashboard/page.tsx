'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CreateMonthBudgetModal } from '@/components/budgets/CreateMonthBudgetModal';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import { FiArrowDownRight, FiArrowUpRight, FiCreditCard, FiPieChart } from 'react-icons/fi';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function getLastMonths(currentMonth: string, count: number) {
  const [year, month] = currentMonth.split('-').map(Number);
  const start = new Date(year, month - 1, 1);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() - (count - index - 1));
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      value,
      label: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  });
}

export default function DashboardPage() {
  const {
    budgetSummary,
    categorySpending,
    incomeBreakdown,
    household,
    activeAlerts,
    currentMonth,
    monthlyCategories,
    categories,
    users,
    expenses,
    incomes,
    onboardingCompleted,
    createMonthlyBudgets,
  } = useBudget();

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const hasTemplates = categories.length > 0;
    const hasMonthlyBudgets = monthlyCategories.some((mc) => mc.month === currentMonth);

    if (hasTemplates && !hasMonthlyBudgets && onboardingCompleted) {
      setShowCreateModal(true);
    } else {
      setShowCreateModal(false);
    }
  }, [currentMonth, monthlyCategories, categories, onboardingCompleted]);

  const handleCreateBudget = () => {
    createMonthlyBudgets(currentMonth);
    setShowCreateModal(false);
  };

  if (!household) {
    return <div>Loading...</div>;
  }

  const currencySymbol = household.currency === 'NGN' ? '₦' : '$';
  const spentPercentage = budgetSummary.totalBudgeted > 0
    ? (budgetSummary.totalSpent / budgetSummary.totalBudgeted) * 100
    : 0;

  const metrics = [
    {
      label: 'Total Income',
      value: budgetSummary.totalIncome,
      icon: FiArrowUpRight,
      accent: 'text-teal-600',
      surface: 'bg-teal-50',
      delta: '+ current month',
    },
    {
      label: 'Budgeted',
      value: budgetSummary.totalBudgeted,
      icon: FiPieChart,
      accent: 'text-violet-600',
      surface: 'bg-violet-50',
      delta: 'planned',
    },
    {
      label: 'Spent',
      value: budgetSummary.totalSpent,
      icon: FiCreditCard,
      accent: 'text-orange-600',
      surface: 'bg-orange-50',
      delta: `${spentPercentage.toFixed(1)}% of budget`,
    },
    {
      label: 'Remaining',
      value: budgetSummary.remaining,
      icon: FiArrowDownRight,
      accent: budgetSummary.remaining >= 0 ? 'text-cyan-600' : 'text-red-600',
      surface: budgetSummary.remaining >= 0 ? 'bg-cyan-50' : 'bg-red-50',
      delta: budgetSummary.remaining >= 0 ? 'available' : 'over budget',
    },
  ];

  const trendData = getLastMonths(currentMonth, 7).map((month) => {
    const monthIncome = incomes
      .filter((income) => income.date.startsWith(month.value))
      .reduce((sum, income) => sum + income.amount, 0);
    const monthSpent = expenses
      .filter((expense) => expense.date.startsWith(month.value))
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      month: month.label,
      income: monthIncome,
      spent: monthSpent,
    };
  });

  const topCategories = [...categorySpending]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const allocated = Math.max(budgetSummary.totalBudgeted, 0);
  const spent = Math.max(budgetSummary.totalSpent, 0);
  const remaining = Math.max(budgetSummary.remaining, 0);
  const unallocated = Math.max(budgetSummary.totalIncome - budgetSummary.totalBudgeted, 0);
  const budgetDonutData = [
    { name: 'Spent', value: spent, color: '#ff5a1f' },
    { name: 'Remaining', value: remaining, color: '#16a394' },
    { name: 'Allocated', value: allocated, color: '#f8b917' },
    { name: 'Unallocated', value: unallocated, color: '#12aeea' },
  ].filter((item) => item.value > 0);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Budget
          </div>
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Budget</h1>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <p className="text-base font-medium text-slate-950">Hi {users[0]?.name?.split(' ')[0] || 'there'}</p>
                <a
                  href="/analytics"
                  className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-600 transition hover:bg-teal-100"
                >
                  View Analytics
                </a>
              </div>
            </div>
            <div className="min-w-0 xl:w-[520px]">
              <MonthNavigation />
            </div>
          </div>
        </div>

        {activeAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 text-sm font-medium shadow-sm ${
                  alert.severity === 'danger'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className={`overflow-hidden border-0 ${metric.surface}`}>
              <CardHeader className="mb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</CardTitle>
                <span className={`grid h-10 w-10 place-items-center rounded-lg bg-white ${metric.accent} shadow-sm`}>
                  <metric.icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight text-slate-950">
                  {currencySymbol}
                  {metric.value.toFixed(2)}
                </div>
                <div className={`mt-3 text-xs font-semibold ${metric.accent}`}>{metric.delta}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_290px]">
          <Card className="border-slate-200 bg-white p-0">
            <CardHeader className="mb-0 flex flex-row items-start justify-between border-b border-slate-100 p-5">
              <div>
                <CardTitle className="text-sm uppercase tracking-wide">Summary</CardTitle>
                <p className="mt-8 text-xs font-medium text-slate-500">Last 7 months</p>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    Income
                  </div>
                  <p className="mt-2 font-semibold text-slate-950">
                    {currencySymbol}
                    {budgetSummary.totalIncome.toFixed(0)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Spent
                  </div>
                  <p className="mt-2 font-semibold text-slate-950">
                    {currencySymbol}
                    {budgetSummary.totalSpent.toFixed(0)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[320px] p-5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 18, right: 18, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spentFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#f8b917" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f8b917" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#edf1f7" vertical={true} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9aa3b2', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9aa3b2', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)' }}
                    formatter={(value: number) => [`${currencySymbol}${Number(value).toFixed(2)}`, '']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={2} fill="url(#incomeFill)" />
                  <Area type="monotone" dataKey="spent" stroke="#f8b917" strokeWidth={2} fill="url(#spentFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-0">
            <CardHeader className="mb-0 border-b border-slate-100 p-5">
              <CardTitle className="text-sm uppercase tracking-wide">Budget</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative mx-auto h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={budgetDonutData.length > 0 ? budgetDonutData : [{ name: 'Empty', value: 1, color: '#e2e8f0' }]}
                      innerRadius="58%"
                      outerRadius="86%"
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {(budgetDonutData.length > 0 ? budgetDonutData : [{ color: '#e2e8f0' }]).map((entry, index) => (
                        <Cell key={`budget-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-400">Budgeted</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {currencySymbol}
                      {budgetSummary.totalBudgeted.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                {budgetDonutData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-slate-500">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map((cat) => (
                  <div key={cat.categoryId}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{cat.categoryName}</span>
                      <span className="font-semibold text-slate-950">
                        {currencySymbol}
                        {cat.spent.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {topCategories.length === 0 && (
                  <p className="text-sm text-slate-500">No category spending yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">Income Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incomeBreakdown.map((income) => (
                  <div key={income.sourceId} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{income.sourceName}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{income.percentage.toFixed(1)}% of income</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-950">
                      {currencySymbol}
                      {income.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                {incomeBreakdown.length === 0 && (
                  <p className="text-sm text-slate-500">No income recorded for this month.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateMonthBudgetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        month={currentMonth}
        onConfirm={handleCreateBudget}
      />
    </div>
  );
}
