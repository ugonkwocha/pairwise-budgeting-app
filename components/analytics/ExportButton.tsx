'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import type { Expense, Income, TimeRange, BudgetHealthData } from '@/types';
import {
  exportTransactionsCSV,
  exportAnalyticsReportCSV,
  exportAllDataCSV,
} from '@/lib/utils/csvExport';

interface ExportButtonProps {
  expenses: Expense[];
  incomes: Income[];
  timeRange: TimeRange;
  budgetHealth?: BudgetHealthData | null;
  users: any[];
  household: any;
}

export function ExportButton({
  expenses,
  incomes,
  timeRange,
  budgetHealth,
  users,
  household,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExportTransactions = async () => {
    setIsLoading(true);
    try {
      exportTransactionsCSV(expenses, incomes, timeRange.startMonth, timeRange.endMonth, household);
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    setIsLoading(true);
    try {
      exportAnalyticsReportCSV(
        expenses,
        incomes,
        timeRange.startMonth,
        timeRange.endMonth,
        budgetHealth || null,
        users
      );
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAll = async () => {
    setIsLoading(true);
    try {
      exportAllDataCSV(
        expenses,
        incomes,
        timeRange.startMonth,
        timeRange.endMonth,
        budgetHealth || null,
        users,
        household
      );
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting all data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? 'Exporting...' : '📥 Export'}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <button
              onClick={handleExportTransactions}
              disabled={isLoading}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
            >
              <div className="font-medium text-gray-900">Export Transactions</div>
              <div className="text-xs text-gray-500">All transactions as CSV</div>
            </button>

            <button
              onClick={handleExportReport}
              disabled={isLoading}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
            >
              <div className="font-medium text-gray-900">Export Report</div>
              <div className="text-xs text-gray-500">Analytics summary as CSV</div>
            </button>

            <button
              onClick={handleExportAll}
              disabled={isLoading}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-gray-900">Export All</div>
              <div className="text-xs text-gray-500">Combined data export</div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
