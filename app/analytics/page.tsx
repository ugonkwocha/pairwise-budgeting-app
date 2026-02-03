'use client';

import { useState, useMemo, useCallback } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { TimeRangeSelector } from '@/components/analytics/TimeRangeSelector';
import { ExportButton } from '@/components/analytics/ExportButton';
import { SpendingTrendsChart } from '@/components/analytics/SpendingTrendsChart';
import { IncomeTrendsChart } from '@/components/analytics/IncomeTrendsChart';
import { BudgetHealthGauge } from '@/components/analytics/BudgetHealthGauge';
import { NeedsVsWantsChart } from '@/components/analytics/NeedsVsWantsChart';
import { MonthlyComparisonChart } from '@/components/analytics/MonthlyComparisonChart';
import { CategoryTrendsChart } from '@/components/analytics/CategoryTrendsChart';
import { SpendingByUserChart } from '@/components/analytics/SpendingByUserChart';
import type { TimeRange } from '@/types';
import {
  calculateSpendingTrends,
  calculateIncomeTrends,
  calculateCategoryTrends,
  calculateMonthOverMonthComparison,
  calculateBudgetHealthScore,
  calculateSpendingByUser,
  calculateSpendingByNeedsWants,
  calculateTopSpendingCategories,
} from '@/lib/calculations/analyticsCalculations';
import { getMonthsInRange, getCurrentMonth } from '@/lib/utils/dateRangeUtils';

export default function AnalyticsPage() {
  const { expenses, incomes, categories, users, household, budgetSummary, categorySpending } = useBudget();
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const currentMonth = getCurrentMonth();
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const startMonth = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    return {
      startMonth,
      endMonth: currentMonth,
      preset: '3months',
    };
  });

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const months = getMonthsInRange(timeRange.startMonth, timeRange.endMonth);
    return {
      expenses: expenses.filter(e => months.some(m => e.date.startsWith(m))),
      incomes: incomes.filter(i => months.some(m => i.date.startsWith(m))),
    };
  }, [expenses, incomes, timeRange]);

  // Calculate all analytics
  const analytics = useMemo(() => {
    const months = getMonthsInRange(timeRange.startMonth, timeRange.endMonth);
    const hasData = filteredData.expenses.length > 0 || filteredData.incomes.length > 0;

    return {
      hasData,
      monthCount: months.length,
      spendingTrends: calculateSpendingTrends(
        filteredData.expenses,
        timeRange.startMonth,
        timeRange.endMonth
      ),
      incomeTrends: calculateIncomeTrends(
        filteredData.incomes,
        timeRange.startMonth,
        timeRange.endMonth
      ),
      categoryTrends: calculateCategoryTrends(
        filteredData.expenses,
        categories,
        timeRange.startMonth,
        timeRange.endMonth
      ),
      monthlyComparison: calculateMonthOverMonthComparison(
        filteredData.expenses,
        filteredData.incomes,
        months
      ),
      budgetHealth: calculateBudgetHealthScore(budgetSummary, categorySpending),
      userSpending: calculateSpendingByUser(
        filteredData.expenses,
        users,
        timeRange.startMonth,
        timeRange.endMonth
      ),
      needsWants: calculateSpendingByNeedsWants(
        filteredData.expenses,
        timeRange.startMonth,
        timeRange.endMonth
      ),
      topCategories: calculateTopSpendingCategories(
        filteredData.expenses,
        5,
        timeRange.startMonth,
        timeRange.endMonth
      ),
    };
  }, [
    filteredData,
    timeRange,
    categories,
    users,
    budgetSummary,
    categorySpending,
  ]);

  // Calculate quick stats
  const quickStats = useMemo(() => {
    const totalIncome = analytics.incomeTrends.reduce((sum, t) => sum + t.totalIncome, 0);
    const totalSpending = analytics.spendingTrends.reduce((sum, t) => sum + t.totalSpent, 0);
    const totalSaved = totalIncome - totalSpending;
    const savingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
    const avgIncome = analytics.monthCount > 0 ? totalIncome / analytics.monthCount : 0;
    const avgSpending = analytics.monthCount > 0 ? totalSpending / analytics.monthCount : 0;

    return {
      totalIncome,
      totalSpending,
      totalSaved,
      savingsRate,
      avgIncome,
      avgSpending,
    };
  }, [analytics]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">Detailed spending analysis, trends, and financial insights</p>
        </div>

        {/* Time Range Selector */}
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />

        {/* No Data State */}
        {!analytics.hasData && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl mb-3">📭</div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">No Data Available</h3>
                <p className="text-amber-800">
                  No transactions found in the selected period. Add expenses or income to see analytics.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {analytics.hasData && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Avg Monthly Income</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${quickStats.avgIncome.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Total: ${quickStats.totalIncome.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Avg Monthly Spending</div>
                    <div className="text-2xl font-bold text-red-600">
                      ${quickStats.avgSpending.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Total: ${quickStats.totalSpending.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Total Saved</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${quickStats.totalSaved.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Savings Rate: {quickStats.savingsRate.toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Budget Health</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.budgetHealth.score}/100
                    </div>
                    <div className="text-xs text-gray-500 mt-2 capitalize">
                      {analytics.budgetHealth.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Spending Trends Chart */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Spending Trends</h2>
              </CardHeader>
              <CardContent>
                <SpendingTrendsChart data={analytics.spendingTrends} />
              </CardContent>
            </Card>

            {/* Income Trends Chart */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Income Trends</h2>
              </CardHeader>
              <CardContent>
                <IncomeTrendsChart data={analytics.incomeTrends} />
              </CardContent>
            </Card>

            {/* Two Column Layout: Budget Health & Needs vs Wants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Budget Health</h2>
                </CardHeader>
                <CardContent>
                  <BudgetHealthGauge data={analytics.budgetHealth} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Needs vs Wants</h2>
                </CardHeader>
                <CardContent>
                  <NeedsVsWantsChart data={analytics.needsWants} />
                </CardContent>
              </Card>
            </div>

            {/* Monthly Comparison Chart */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Monthly Comparison</h2>
              </CardHeader>
              <CardContent>
                <MonthlyComparisonChart data={analytics.monthlyComparison} />
              </CardContent>
            </Card>

            {/* Category Trends Chart */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Category Trends</h2>
              </CardHeader>
              <CardContent>
                <CategoryTrendsChart data={analytics.categoryTrends} />
              </CardContent>
            </Card>

            {/* Spending by User Chart */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Spending by Member</h2>
              </CardHeader>
              <CardContent>
                <SpendingByUserChart data={analytics.userSpending} />
              </CardContent>
            </Card>

            {/* Top Categories */}
            {analytics.topCategories.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Top Spending Categories</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topCategories.map((category, index) => (
                      <div key={category.categoryId} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-gray-900">{index + 1}.</div>
                          <div>
                            <div className="font-medium text-gray-900">{category.categoryName}</div>
                            <div className="text-xs text-gray-500">
                              {category.percentage.toFixed(1)}% of total spending
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ${category.totalSpent.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Section */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600">
                    Export your analytics and transaction data for further analysis
                  </p>
                  <ExportButton
                    expenses={filteredData.expenses}
                    incomes={filteredData.incomes}
                    timeRange={timeRange}
                    budgetHealth={analytics.budgetHealth}
                    users={users}
                    household={household}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
