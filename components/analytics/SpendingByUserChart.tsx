'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface UserSpending {
  userId: string;
  userName: string;
  totalSpent: number;
  percentage: number;
}

interface SpendingByUserChartProps {
  data: UserSpending[];
}

const USER_COLORS = [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export function SpendingByUserChart({ data }: SpendingByUserChartProps) {
  // Only show if there are multiple users
  if (!data || data.length <= 1) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg text-gray-500">
        Member breakdown not available (single user household)
      </div>
    );
  }

  // Prepare data for pie chart
  const chartData = data.map(user => ({
    name: user.userName,
    value: Math.round(user.percentage),
    amount: user.totalSpent,
  }));

  return (
    <div className="w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={USER_COLORS[index % USER_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number') {
                // Find the data point to get amount
                return `${value}%`;
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
        </PieChart>
      </ResponsiveContainer>

      {/* Member details */}
      <div className="mt-6 w-full">
        <div className="text-sm font-medium text-gray-700 mb-3">Member Breakdown</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((user, index) => (
            <div key={user.userId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: USER_COLORS[index % USER_COLORS.length] }}
                />
                <div className="text-sm font-medium text-gray-900">{user.userName}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-600">Total Spent</div>
                  <div className="font-semibold text-gray-900">${user.totalSpent.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Percentage</div>
                  <div className="font-semibold text-gray-900">{user.percentage.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
