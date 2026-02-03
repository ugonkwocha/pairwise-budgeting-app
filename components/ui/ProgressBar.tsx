import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  percentage: number;
  status: 'healthy' | 'warning' | 'danger';
  showLabel?: boolean;
  showAmount?: boolean;
  current?: number;
  total?: number;
}

export function ProgressBar({
  percentage,
  status,
  showLabel = true,
  showAmount = false,
  current,
  total,
}: ProgressBarProps) {
  const cappedPercentage = Math.min(percentage, 100);

  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            {cappedPercentage.toFixed(1)}%
          </span>
          {showAmount && current !== undefined && total !== undefined && (
            <span className="text-sm text-gray-600">
              ${current.toFixed(2)} / ${total.toFixed(2)}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-300', statusColors[status])}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>
    </div>
  );
}
