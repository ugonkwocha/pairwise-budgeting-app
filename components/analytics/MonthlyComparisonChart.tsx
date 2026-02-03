'use client';

import { BarChart, Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlyComparisonData } from '@/types';

interface MonthlyComparisonChartProps {
  data: MonthlyComparisonData[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg text-gray-500">
        No data available for this period
      </div>
    );
  }

  // Format month for display
  const formatMonth = (monthStr: string): string => {
    const date = new Date(`${monthStr}-01`);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Prepare data for display
  const chartData = data.map(item => ({
    ...item,
    monthDisplay: formatMonth(item.month),
  }));

  return (
    <div className="w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="monthDisplay"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number') {
                return `$${value.toFixed(2)}`;
              }
              return value;
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} />

          {/* Income bar */}
          <Bar yAxisId="left" dataKey="income" fill="#10b981" name="Income" opacity={0.8} />

          {/* Spending bar */}
          <Bar yAxisId="left" dataKey="spent" fill="#ef4444" name="Spending" opacity={0.8} />

          {/* Saved bar */}
          <Bar yAxisId="left" dataKey="saved" fill="#3b82f6" name="Saved" opacity={0.8} />

          {/* Savings rate line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="savingsRate"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Savings Rate (%)"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-6 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Total Income</div>
          <div className="text-xl font-bold text-green-600">
            ${data.reduce((sum, m) => sum + m.income, 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: ${(data.reduce((sum, m) => sum + m.income, 0) / data.length).toFixed(2)}
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Total Spending</div>
          <div className="text-xl font-bold text-red-600">
            ${data.reduce((sum, m) => sum + m.spent, 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: ${(data.reduce((sum, m) => sum + m.spent, 0) / data.length).toFixed(2)}
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Total Saved</div>
          <div className="text-xl font-bold text-blue-600">
            ${data.reduce((sum, m) => sum + m.saved, 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: ${(data.reduce((sum, m) => sum + m.saved, 0) / data.length).toFixed(2)}
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Avg Savings Rate</div>
          <div className="text-xl font-bold text-amber-600">
            {(data.reduce((sum, m) => sum + m.savingsRate, 0) / data.length).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Target: 20%
          </div>
        </div>
      </div>
    </div>
  );
}
