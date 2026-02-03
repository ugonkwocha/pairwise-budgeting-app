'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SpendingTrendData } from '@/types';

interface SpendingTrendsChartProps {
  data: SpendingTrendData[];
}

export function SpendingTrendsChart({ data }: SpendingTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No spending data available</p>
      </div>
    );
  }

  // Format data for display with shortened month labels
  const formattedData = data.map((item) => ({
    ...item,
    monthLabel: item.month.substring(5), // Just show MM
    fullMonth: item.month,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={formattedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorNeeds" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorWants" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px',
          }}
          formatter={(value) => `$${(value as number).toFixed(2)}`}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Legend
          wrapperStyle={{ paddingTop: '16px' }}
          iconType="line"
        />
        <Area
          type="monotone"
          dataKey="needsSpent"
          stackId="1"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorNeeds)"
          name="Needs"
        />
        <Area
          type="monotone"
          dataKey="wantsSpent"
          stackId="1"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorWants)"
          name="Wants"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
