import React from 'react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={clsx('relative max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto rounded-lg bg-white p-4 shadow-lg sm:max-h-[calc(100dvh-2rem)] sm:p-6', sizeClasses[size])}>
        {title && (
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="min-w-0 text-lg font-semibold text-gray-900 sm:text-xl">{title}</h2>
            <button
              onClick={onClose}
              className="shrink-0 text-2xl leading-none text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
