'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryTrendData } from '@/types';

interface CategoryTrendsChartProps {
  data: CategoryTrendData[];
}

const CATEGORY_COLORS = [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export function CategoryTrendsChart({ data }: CategoryTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg text-gray-500">
        No category data available for this period
      </div>
    );
  }

  // Collect all months from the data
  const allMonths = new Set<string>();
  data.forEach(category => {
    category.monthlyData.forEach(month => allMonths.add(month.month));
  });
  const months = Array.from(allMonths).sort();

  // Flatten data: each row is a month with all categories as columns
  const chartData = months.map(month => {
    const dataPoint: Record<string, any> = { month };
    data.forEach(category => {
      const monthData = category.monthlyData.find(m => m.month === month);
      dataPoint[category.categoryName] = monthData?.spent || 0;
    });
    return dataPoint;
  });

  // Take top 8 categories by total spending to avoid cluttering
  const topCategories = data
    .sort((a, b) => {
      const totalA = a.monthlyData.reduce((sum, m) => sum + m.spent, 0);
      const totalB = b.monthlyData.reduce((sum, m) => sum + m.spent, 0);
      return totalB - totalA;
    })
    .slice(0, 8);

  // Format month for display
  const formatMonth = (monthStr: string): string => {
    const date = new Date(`${monthStr}-01`);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} />

          {/* Bars for each category */}
          {topCategories.map((category, index) => (
            <Bar
              key={category.categoryId}
              dataKey={category.categoryName}
              fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
              opacity={0.8}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Category summary */}
      <div className="mt-6 w-full">
        <div className="text-sm font-medium text-gray-700 mb-3">Category Summary</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {topCategories.map((category, index) => {
            const total = category.monthlyData.reduce((sum, m) => sum + m.spent, 0);
            const avg = total / category.monthlyData.length;
            const maxMonth = Math.max(...category.monthlyData.map(m => m.spent));

            return (
              <div key={category.categoryId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                  />
                  <div className="text-sm font-medium text-gray-900 truncate">{category.categoryName}</div>
                </div>
                <div className="text-xs text-gray-600">
                  Total: ${total.toFixed(2)}
                  <br />
                  Avg: ${avg.toFixed(2)}
                  <br />
                  Peak: ${maxMonth.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
