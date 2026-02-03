'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { BudgetHealthData } from '@/types';

interface BudgetHealthGaugeProps {
  data: BudgetHealthData;
}

export function BudgetHealthGauge({ data }: BudgetHealthGaugeProps) {
  // Prepare data for radial chart
  const chartData = [
    {
      name: 'Health Score',
      value: Math.min(data.score, 100),
      fill: getHealthColor(data.status),
    },
  ];

  function getHealthColor(status: string): string {
    switch (status) {
      case 'excellent':
        return '#10b981'; // Green
      case 'good':
        return '#3b82f6'; // Blue
      case 'fair':
        return '#f59e0b'; // Amber
      case 'poor':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Needs Improvement';
      default:
        return 'Unknown';
    }
  }

  return (
    <div className="w-full h-64 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          data={chartData}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
            fill={chartData[0].fill}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Score Display */}
      <div className="text-center mt-4">
        <div className="text-4xl font-bold" style={{ color: chartData[0].fill }}>
          {Math.round(data.score)}
        </div>
        <div className="text-sm font-medium text-gray-700 mt-1">
          {getStatusLabel(data.status)}
        </div>
      </div>

      {/* Factors */}
      <div className="mt-6 space-y-2 w-full">
        {data.factors.map((factor, index) => (
          <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>{factor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
