'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import type { NeedsWantsData } from '@/types';

interface NeedsVsWantsChartProps {
  data: NeedsWantsData;
}

export function NeedsVsWantsChart({ data }: NeedsVsWantsChartProps) {
  // Prepare data for pie chart
  const chartData = [
    {
      name: 'Needs',
      value: Math.round(data.needsPercentage),
      amount: data.needs,
      fill: '#10b981', // Green
    },
    {
      name: 'Wants',
      value: Math.round(data.wantsPercentage),
      amount: data.wants,
      fill: '#3b82f6', // Blue
    },
  ];

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
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} />
        </PieChart>
      </ResponsiveContainer>

      {/* Recommended Rule */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full text-center">
        <div className="text-xs text-blue-700 font-medium">
          📋 Recommended: 50% Needs, 30% Wants, 20% Savings
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-2 gap-4 w-full">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            ${data.needs.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Needs</div>
          <div className="text-xs font-medium text-gray-700">
            {data.needsPercentage.toFixed(1)}%
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            ${data.wants.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Wants</div>
          <div className="text-xs font-medium text-gray-700">
            {data.wantsPercentage.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
