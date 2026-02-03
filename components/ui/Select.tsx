import React from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export function Select({
  label,
  options,
  error,
  helperText,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-4 py-2 border rounded-lg text-base transition-colors duration-200',
          error
            ? 'border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && <p className="mt-1 text-sm text-gray-600">{helperText}</p>}
    </div>
  );
}
