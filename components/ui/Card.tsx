import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ className, variant = 'default', padding = 'md', ...props }: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantClasses = {
    default: 'border-gray-200 bg-white border',
    outlined: 'border-gray-300 bg-transparent border',
  };

  return (
    <div className={clsx('rounded-lg', variantClasses[variant], paddingClasses[padding], className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('mb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={clsx('text-lg font-semibold text-gray-900', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('', className)} {...props} />;
}
