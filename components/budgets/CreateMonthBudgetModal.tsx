'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { formatMonthDisplay } from '@/lib/utils/monthUtils';

interface CreateMonthBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  onConfirm: () => void;
}

export function CreateMonthBudgetModal({
  isOpen,
  onClose,
  month,
  onConfirm,
}: CreateMonthBudgetModalProps) {
  const { categories } = useBudget();

  const totalBudget = categories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Monthly Budget" size="md">
      <div className="space-y-4">
        <p className="text-gray-700">
          No budget has been created for <strong>{formatMonthDisplay(month)}</strong> yet.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What will be created:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {categories.length} budget categories</li>
            <li>• Total monthly budget: ${totalBudget.toFixed(2)}</li>
            <li>• Budgets copied from your templates</li>
            <li>• Unused amounts from last month will carry over (if enabled)</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
          <h4 className="font-medium text-gray-900 mb-2">Categories:</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex justify-between text-sm"
              >
                <span className="text-gray-700">{category.name}</span>
                <span className="font-medium text-gray-900">
                  ${category.monthlyBudget.toFixed(2)}
                  {category.carryOverEnabled && (
                    <span className="text-xs text-blue-600 ml-1">(+carry)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            className="flex-1"
          >
            Create Budget
          </Button>
        </div>
      </div>
    </Modal>
  );
}
