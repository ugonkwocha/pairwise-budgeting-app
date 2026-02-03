/**
 * CSV Export Utilities
 * Functions for generating and exporting CSV files with transaction and analytics data
 */

import type { Expense, Income, BudgetHealthData } from '@/types';
import {
  calculateSpendingTrends,
  calculateIncomeTrends,
  calculateCategoryAverages,
  calculateSpendingByUser,
} from '@/lib/calculations/analyticsCalculations';
import { getMonthsInRange } from './dateRangeUtils';

/**
 * Generate a CSV string from headers and data rows
 * Properly escapes special characters and quotes
 */
function generateCSV(headers: string[], rows: string[][]): string {
  // Escape function for CSV - adds quotes around fields with special characters
  const escapeCSVField = (field: string): string => {
    if (field === null || field === undefined) return '';
    const fieldStr = String(field);
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    return fieldStr;
  };

  // Build CSV content
  const csvLines = [headers.map(escapeCSVField).join(',')];

  rows.forEach((row) => {
    csvLines.push(row.map(escapeCSVField).join(','));
  });

  return csvLines.join('\n');
}

/**
 * Trigger a CSV download in the browser
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export transactions as CSV
 * Includes both expenses and incomes in the specified date range
 */
export function exportTransactionsCSV(
  expenses: Expense[],
  incomes: Income[],
  startMonth: string,
  endMonth: string,
  household: any
): void {
  const months = getMonthsInRange(startMonth, endMonth);
  const currencySymbol = household?.currency === 'NGN' ? '₦' : '$';

  // Filter transactions in date range
  const filteredExpenses = expenses.filter((e) =>
    months.some((m) => e.date.startsWith(m))
  );
  const filteredIncomes = incomes.filter((i) =>
    months.some((m) => i.date.startsWith(m))
  );

  // Prepare headers
  const headers = ['Date', 'Type', 'Amount', 'Category', 'Member', 'Source/Category', 'Needs/Wants', 'Notes'];

  // Prepare rows
  const rows: string[][] = [];

  // Add expenses
  filteredExpenses.forEach((expense) => {
    rows.push([
      expense.date,
      'Expense',
      expense.amount.toFixed(2),
      expense.categoryName,
      expense.userName,
      expense.categoryName,
      expense.needsOrWants,
      expense.notes || '',
    ]);
  });

  // Add incomes
  filteredIncomes.forEach((income) => {
    rows.push([
      income.date,
      'Income',
      income.amount.toFixed(2),
      income.sourceName,
      income.userName,
      income.sourceName,
      '',
      income.notes || '',
    ]);
  });

  // Sort by date
  rows.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  // Generate and download
  const csv = generateCSV(headers, rows);
  const filename = `transactions-${startMonth}-to-${endMonth}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Export analytics report as CSV
 * Includes summary statistics, monthly breakdown, and category analysis
 */
export function exportAnalyticsReportCSV(
  expenses: Expense[],
  incomes: Income[],
  startMonth: string,
  endMonth: string,
  budgetHealth: BudgetHealthData | null,
  users: any[]
): void {
  const months = getMonthsInRange(startMonth, endMonth);

  // Calculate analytics data
  const spendingTrends = calculateSpendingTrends(expenses, startMonth, endMonth);
  const incomeTrends = calculateIncomeTrends(incomes, startMonth, endMonth);
  const categoryAverages = calculateCategoryAverages(expenses, months);
  const userSpending = calculateSpendingByUser(expenses, users, startMonth, endMonth);

  // Build multi-section CSV
  const sections: string[] = [];

  // SUMMARY SECTION
  sections.push('SUMMARY STATISTICS');
  sections.push('Metric,Value');

  const totalIncome = incomeTrends.reduce((sum, t) => sum + t.totalIncome, 0);
  const totalSpending = spendingTrends.reduce((sum, t) => sum + t.totalSpent, 0);
  const totalSaved = totalIncome - totalSpending;
  const savingsRate = totalIncome > 0 ? ((totalSaved / totalIncome) * 100).toFixed(1) : '0';

  sections.push(`Total Income,${totalIncome.toFixed(2)}`);
  sections.push(`Total Spending,${totalSpending.toFixed(2)}`);
  sections.push(`Total Saved,${totalSaved.toFixed(2)}`);
  sections.push(`Savings Rate,${savingsRate}%`);
  sections.push(`Average Monthly Income,${(totalIncome / months.length).toFixed(2)}`);
  sections.push(`Average Monthly Spending,${(totalSpending / months.length).toFixed(2)}`);

  if (budgetHealth) {
    sections.push(`Budget Health Score,${budgetHealth.score}`);
    sections.push(`Budget Health Status,${budgetHealth.status}`);
  }

  // MONTHLY BREAKDOWN
  sections.push('');
  sections.push('MONTHLY BREAKDOWN');
  sections.push('Month,Income,Spending,Saved,Savings Rate (%)');

  months.forEach((month) => {
    const incomeTrend = incomeTrends.find((t) => t.month === month);
    const spendingTrend = spendingTrends.find((t) => t.month === month);

    const monthIncome = incomeTrend?.totalIncome || 0;
    const monthSpending = spendingTrend?.totalSpent || 0;
    const monthSaved = monthIncome - monthSpending;
    const monthSavingsRate = monthIncome > 0 ? ((monthSaved / monthIncome) * 100).toFixed(1) : '0';

    sections.push(
      `${month},${monthIncome.toFixed(2)},${monthSpending.toFixed(2)},${monthSaved.toFixed(2)},${monthSavingsRate}`
    );
  });

  // CATEGORY AVERAGES
  sections.push('');
  sections.push('CATEGORY SPENDING AVERAGES');
  sections.push('Category,Total Spent,Average Per Month,Months Data');

  categoryAverages.forEach((cat) => {
    sections.push(
      `${cat.categoryName},${cat.totalSpent.toFixed(2)},${cat.avgSpent.toFixed(2)},${cat.monthCount}`
    );
  });

  // USER SPENDING
  if (users.length > 1) {
    sections.push('');
    sections.push('SPENDING BY MEMBER');
    sections.push('Member,Total Spent,Percentage (%)');

    userSpending.forEach((user) => {
      sections.push(`${user.userName},${user.totalSpent.toFixed(2)},${user.percentage.toFixed(1)}`);
    });
  }

  // NEEDS VS WANTS
  sections.push('');
  sections.push('NEEDS VS WANTS BREAKDOWN');
  sections.push('Category,Amount,Percentage (%)');

  const needsAmount = spendingTrends.reduce((sum, t) => sum + t.needsSpent, 0);
  const wantsAmount = spendingTrends.reduce((sum, t) => sum + t.wantsSpent, 0);
  const total = needsAmount + wantsAmount;

  sections.push(`Needs,${needsAmount.toFixed(2)},${total > 0 ? ((needsAmount / total) * 100).toFixed(1) : '0'}`);
  sections.push(`Wants,${wantsAmount.toFixed(2)},${total > 0 ? ((wantsAmount / total) * 100).toFixed(1) : '0'}`);

  const csv = sections.join('\n');
  const filename = `analytics-report-${startMonth}-to-${endMonth}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Export all data - combines transactions and analytics
 * For comprehensive backup and analysis
 */
export function exportAllDataCSV(
  expenses: Expense[],
  incomes: Income[],
  startMonth: string,
  endMonth: string,
  budgetHealth: BudgetHealthData | null,
  users: any[],
  household: any
): void {
  // We'll just call both exports but create a combined file
  // Alternatively, you could create a zip file with multiple CSVs

  // For now, export the detailed transactions report which includes everything needed
  exportTransactionsCSV(expenses, incomes, startMonth, endMonth, household);

  // Also export the analytics report
  exportAnalyticsReportCSV(expenses, incomes, startMonth, endMonth, budgetHealth, users);
}

/**
 * Export quick summary - minimal data for quick reference
 * Useful for embedding in emails or quick exports
 */
export function exportQuickSummaryCSV(
  expenses: Expense[],
  incomes: Income[],
  months: string[],
  categories: any[] = []
): void {
  const headers = ['Metric', 'Value'];
  const rows: string[][] = [];

  const totalIncome = incomes
    .filter((i) => months.some((m) => i.date.startsWith(m)))
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpenses = expenses
    .filter((e) => months.some((m) => e.date.startsWith(m)))
    .reduce((sum, e) => sum + e.amount, 0);

  rows.push(['Time Period', `${months[0]} to ${months[months.length - 1]}`]);
  rows.push(['Total Income', totalIncome.toFixed(2)]);
  rows.push(['Total Expenses', totalExpenses.toFixed(2)]);
  rows.push(['Net Savings', (totalIncome - totalExpenses).toFixed(2)]);
  rows.push(['Month Count', months.length.toString()]);

  if (categories.length > 0) {
    rows.push(['', '']); // Blank row
    rows.push(['Top 5 Categories', '']);

    const categoryTotals: Record<string, number> = {};
    expenses
      .filter((e) => months.some((m) => e.date.startsWith(m)))
      .forEach((expense) => {
        categoryTotals[expense.categoryName] = (categoryTotals[expense.categoryName] || 0) + expense.amount;
      });

    Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([name, amount]) => {
        rows.push([name, amount.toFixed(2)]);
      });
  }

  const csv = generateCSV(headers, rows);
  const filename = `budget-summary-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}
