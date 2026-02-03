import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-4 py-2 border rounded-lg text-base transition-colors duration-200',
          error
            ? 'border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && <p className="mt-1 text-sm text-gray-600">{helperText}</p>}
    </div>
  );
}
