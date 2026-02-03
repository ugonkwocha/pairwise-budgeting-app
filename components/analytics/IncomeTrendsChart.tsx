'use client';

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { IncomeTrendData } from '@/types';

interface IncomeTrendsChartProps {
  data: IncomeTrendData[];
}

const SOURCE_COLORS = [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export function IncomeTrendsChart({ data }: IncomeTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg text-gray-500">
        No income data available for this period
      </div>
    );
  }

  // Collect all unique income sources
  const allSources = new Set<string>();
  data.forEach(month => {
    Object.keys(month.bySource).forEach(source => allSources.add(source));
  });

  // Flatten data structure for chart
  const chartData = data.map(month => {
    const dataPoint: Record<string, any> = {
      month: month.month,
      'Total Income': month.totalIncome,
      ...month.bySource,
    };
    return dataPoint;
  });

  // Sort sources and take top 5 to avoid cluttered chart
  const topSources = Array.from(allSources)
    .sort((a, b) => {
      const totalA = data.reduce((sum, m) => sum + (m.bySource[a] || 0), 0);
      const totalB = data.reduce((sum, m) => sum + (m.bySource[b] || 0), 0);
      return totalB - totalA;
    })
    .slice(0, 5);

  // Format month for display
  const formatMonth = (monthStr: string): string => {
    const date = new Date(`${monthStr}-01`);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip
            formatter={(value) => `$${Number(value).toFixed(2)}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            labelFormatter={(label) => `Month: ${formatMonth(label)}`}
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} />

          {/* Total income line */}
          <Line
            type="monotone"
            dataKey="Total Income"
            stroke="#1f2937"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          {/* Individual source lines */}
          {topSources.map((source, index) => (
            <Line
              key={source}
              type="monotone"
              dataKey={source}
              stroke={SOURCE_COLORS[index % SOURCE_COLORS.length]}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              opacity={0.7}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Sources info */}
      {topSources.length > 0 && (
        <div className="mt-6 w-full">
          <div className="text-sm font-medium text-gray-700 mb-3">Income Sources</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topSources.map((source, index) => {
              const total = data.reduce((sum, m) => sum + (m.bySource[source] || 0), 0);
              const avg = total / data.length;
              return (
                <div key={source} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                    />
                    <div className="text-sm font-medium text-gray-900">{source}</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Total: ${total.toFixed(2)} | Avg/Month: ${avg.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
