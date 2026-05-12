'use client';

import { useState } from 'react';
import { FiEdit2, FiFlag, FiPlus, FiTarget, FiTrash2 } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { SavingsGoalModal } from '@/components/savings/SavingsGoalModal';
import { SavingsContributionModal } from '@/components/savings/SavingsContributionModal';
import { ConfirmDeleteModal } from '@/components/settings/ConfirmDeleteModal';
import { formatLocalDate } from '@/lib/utils/dateUtils';
import type { SavingsContribution, SavingsGoal } from '@/types';

function formatDate(value: string) {
  return formatLocalDate(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SavingsPage() {
  const {
    household,
    savingsGoals,
    savingsContributions,
    currentMonth,
    deleteSavingsGoal,
    deleteSavingsContribution,
  } = useBudget();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isDeleteGoalOpen, setIsDeleteGoalOpen] = useState(false);
  const [isDeleteContributionOpen, setIsDeleteContributionOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<SavingsContribution | null>(null);

  if (!household) {
    return null;
  }

  const currency = household.currency === 'NGN' ? '₦' : '$';
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const monthContributions = savingsContributions.filter((item) => item.date.startsWith(currentMonth));
  const monthSaved = monthContributions.reduce((sum, item) => sum + item.amount, 0);
  const progress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  const openAddGoal = () => {
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  };

  const openEditGoal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  const openContribution = (goal?: SavingsGoal) => {
    setSelectedGoal(goal || null);
    setIsContributionModalOpen(true);
  };

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Savings
          </div>
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-slate-950">Savings</h1>
              <p className="mt-3 text-sm text-slate-500">Set goals, record contributions, and track household savings progress.</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={openAddGoal}>
                <FiTarget aria-hidden="true" />
                Add Goal
              </Button>
              <Button
                type="button"
                onClick={() => openContribution()}
                disabled={savingsGoals.length === 0}
              >
                <FiPlus aria-hidden="true" />
                Add Contribution
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card className="border-0 bg-teal-50">
            <CardHeader className="mb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Saved</CardTitle>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-teal-600 shadow-sm">
                <FiTarget className="h-4 w-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{currency}{totalSaved.toFixed(2)}</div>
              <p className="mt-3 text-xs font-semibold text-teal-600">{progress.toFixed(1)}% of all goals</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-blue-50">
            <CardHeader className="mb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target</CardTitle>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-blue-600 shadow-sm">
                <FiFlag className="h-4 w-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{currency}{totalTarget.toFixed(2)}</div>
              <p className="mt-3 text-xs font-semibold text-blue-600">{savingsGoals.length} active goal{savingsGoals.length === 1 ? '' : 's'}</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-violet-50">
            <CardHeader className="mb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved This Month</CardTitle>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-violet-600 shadow-sm">
                <FiPlus className="h-4 w-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{currency}{monthSaved.toFixed(2)}</div>
              <p className="mt-3 text-xs font-semibold text-violet-600">{monthContributions.length} contribution{monthContributions.length === 1 ? '' : 's'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savingsGoals.map((goal) => {
                  const goalProgress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                  return (
                    <div key={goal.id} className="rounded-lg bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">{goal.name}</p>
                            {goal.deadline && (
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                                Due {formatDate(goal.deadline)}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${goalProgress}%` }} />
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {currency}{goal.currentAmount.toFixed(2)} saved of {currency}{goal.targetAmount.toFixed(2)} target
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 md:flex md:flex-wrap md:justify-end">
                          <Button type="button" size="sm" onClick={() => openContribution(goal)}>
                            <FiPlus className="h-4 w-4" aria-hidden="true" />
                            Contribute
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => openEditGoal(goal)}>
                            <FiEdit2 className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setIsDeleteGoalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {savingsGoals.length === 0 && (
                  <p className="rounded-lg bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No savings goals yet. Add a goal to start tracking progress.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">Recent Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...savingsContributions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 12)
                  .map((contribution) => {
                    const goal = savingsGoals.find((item) => item.id === contribution.goalId);
                    return (
                      <div key={contribution.id} className="flex flex-col gap-3 rounded-lg bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-950">{goal?.name || 'Savings goal'}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {formatDate(contribution.date)} • {contribution.userName}
                          </p>
                          {contribution.notes && <p className="mt-1 text-xs text-slate-500">{contribution.notes}</p>}
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <p className="font-semibold text-slate-950">{currency}{contribution.amount.toFixed(2)}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedContribution(contribution);
                              setIsDeleteContributionOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                {savingsContributions.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-500">No savings contributions yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
      />
      <SavingsContributionModal
        isOpen={isContributionModalOpen}
        onClose={() => {
          setIsContributionModalOpen(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
      />
      {selectedGoal && (
        <ConfirmDeleteModal
          isOpen={isDeleteGoalOpen}
          onClose={() => {
            setIsDeleteGoalOpen(false);
            setSelectedGoal(null);
          }}
          onConfirm={() => deleteSavingsGoal(selectedGoal.id)}
          title="Delete Savings Goal"
          message={`Delete ${selectedGoal.name}? Contributions for this goal will also be removed.`}
        />
      )}
      {selectedContribution && (
        <ConfirmDeleteModal
          isOpen={isDeleteContributionOpen}
          onClose={() => {
            setIsDeleteContributionOpen(false);
            setSelectedContribution(null);
          }}
          onConfirm={() => deleteSavingsContribution(selectedContribution.id)}
          title="Delete Contribution"
          message={`Delete this ${currency}${selectedContribution.amount.toFixed(2)} savings contribution?`}
        />
      )}
    </div>
  );
}
