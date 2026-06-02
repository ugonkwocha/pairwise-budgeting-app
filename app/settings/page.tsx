'use client';

import { useState } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EditHouseholdModal } from '@/components/settings/EditHouseholdModal';
import { AddUserModal } from '@/components/settings/AddUserModal';
import { EditUserModal } from '@/components/settings/EditUserModal';
import { AddCategoryModal } from '@/components/settings/AddCategoryModal';
import { EditCategoryModal } from '@/components/settings/EditCategoryModal';
import { AddIncomeSourceModal } from '@/components/settings/AddIncomeSourceModal';
import { EditIncomeSourceModal } from '@/components/settings/EditIncomeSourceModal';
import { ConfirmDeleteModal } from '@/components/settings/ConfirmDeleteModal';
import type { User, IncomeSource, Category, HouseholdInvite } from '@/types';
import { FiMail } from 'react-icons/fi';

function getInviteStatus(invite?: HouseholdInvite): 'none' | 'pending' | 'accepted' | 'expired' {
  if (!invite) return 'none';
  if (invite.acceptedAt) return 'accepted';
  return new Date(invite.expiresAt).getTime() < Date.now() ? 'expired' : 'pending';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export default function SettingsPage() {
  const {
    household,
    currentUser,
    users,
    householdInvites,
    categories,
    incomeSources,
    incomes,
    expenses,
    currentMonth,
    deleteUser,
    deleteInvite,
    deleteIncomeSource,
    deleteCategory,
  } = useBudget();

  // Modal states
  const [isEditHouseholdOpen, setIsEditHouseholdOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isEditSourceOpen, setIsEditSourceOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isDeleteInviteOpen, setIsDeleteInviteOpen] = useState(false);
  const [isDeleteSourceOpen, setIsDeleteSourceOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);

  // Selected items for editing/deleting
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<HouseholdInvite | null>(null);
  const [selectedSource, setSelectedSource] = useState<IncomeSource | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSendingSummary, setIsSendingSummary] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const isPrimaryMember = currentUser?.role === 'primary';

  const handleEditUser = (user: User) => {
    if (!isPrimaryMember) return;
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    if (!isPrimaryMember) return;
    // Prevent deletion if it's the only member
    if (users.length === 1) {
      alert('Cannot delete the last member. At least one member is required.');
      return;
    }

    // Prevent deletion of primary role user
    if (user.role === 'primary') {
      alert(
        'Cannot delete the primary member. Please assign primary role to another member first.'
      );
      return;
    }

    setSelectedUser(user);
    setIsDeleteUserOpen(true);
  };

  const handleEditSource = (source: IncomeSource) => {
    if (!isPrimaryMember) return;
    setSelectedSource(source);
    setIsEditSourceOpen(true);
  };

  const handleDeleteSource = (source: IncomeSource) => {
    if (!isPrimaryMember) return;
    // Check if there are income records with this source
    const relatedIncomes = incomes.filter((income) => income.sourceId === source.id);
    if (relatedIncomes.length > 0) {
      alert(
        `Cannot delete this income source. It has ${relatedIncomes.length} income record(s) associated with it. Please delete those records first.`
      );
      return;
    }

    setSelectedSource(source);
    setIsDeleteSourceOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    if (!isPrimaryMember) return;
    setSelectedCategory(category);
    setIsEditCategoryOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    if (!isPrimaryMember) return;
    setSelectedCategory(category);
    setIsDeleteCategoryOpen(true);
  };

  const getInviteForUser = (user: User) =>
    householdInvites.find((invite) => invite.budgetMemberId === user.id) ||
    householdInvites.find((invite) => invite.email.toLowerCase() === user.email.toLowerCase());

  const handleCopyInvite = async (invite: HouseholdInvite) => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
  };

  const handleDeleteInvite = (invite: HouseholdInvite) => {
    if (!isPrimaryMember) return;
    setSelectedInvite(invite);
    setIsDeleteInviteOpen(true);
  };

  const handleSendMonthlySummary = async () => {
    if (!isPrimaryMember) return;
    setIsSendingSummary(true);
    setSummaryStatus(null);
    setSummaryError(null);

    try {
      const response = await fetch('/api/monthly-summary/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to send monthly summary');
      }

      setSummaryStatus(`Monthly summary sent to ${result?.recipients || 0} active member${result?.recipients === 1 ? '' : 's'}.`);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Unable to send monthly summary');
    } finally {
      setIsSendingSummary(false);
    }
  };

  if (!household) {
    return <div>Loading...</div>;
  }

  const currencySymbol = household.currency === 'NGN' ? '₦' : '$';

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Settings
          </div>
          <div className="border-b border-slate-200 pb-6">
            <h1 className="text-2xl font-semibold text-slate-950">Settings</h1>
            <p className="mt-6 text-base font-medium text-slate-950">Manage your household, members, and income sources</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-12">
        <Card className="border-slate-200 bg-white xl:col-span-4">
          <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <CardTitle className="text-sm uppercase tracking-wide">Household Information</CardTitle>
            {isPrimaryMember && (
              <Button variant="secondary" size="sm" onClick={() => setIsEditHouseholdOpen(true)}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{household.name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{household.currency}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white xl:col-span-8">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm uppercase tracking-wide">Email Summaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <FiMail className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-950">Monthly budget summary</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Send income, spending, over-budget categories, and upcoming bills to active household members.
                </p>
              </div>
            </div>
            {summaryStatus && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                {summaryStatus}
              </div>
            )}
            {summaryError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {summaryError}
              </div>
            )}
            <Button
              type="button"
              className="mt-5 w-full"
              onClick={handleSendMonthlySummary}
              disabled={!isPrimaryMember || isSendingSummary}
            >
              {isSendingSummary ? 'Sending...' : 'Send Monthly Summary'}
            </Button>
            {!isPrimaryMember && (
              <p className="mt-3 text-xs font-medium text-slate-500">Only primary members can send household summary emails.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white xl:col-span-6">
          <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <CardTitle className="text-sm uppercase tracking-wide">Members</CardTitle>
            {isPrimaryMember && (
              <Button variant="primary" size="sm" onClick={() => setIsAddUserOpen(true)}>
                Add Member
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No members yet. Add one to get started.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  (() => {
                    const invite = getInviteForUser(user);
                    const inviteStatus = getInviteStatus(invite);
                    const isPendingInvite = inviteStatus === 'pending';
                    const isExpiredInvite = inviteStatus === 'expired';
                    const isAcceptedInvite = inviteStatus === 'accepted';

                    return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-4 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 break-words font-medium text-slate-900">{user.name}</div>
                        <Badge variant={user.role === 'primary' ? 'success' : 'default'} size="sm">
                          {user.role}
                        </Badge>
                        {invite && inviteStatus !== 'none' && (
                          <Badge
                            variant={
                              isAcceptedInvite
                                ? 'success'
                                : isExpiredInvite
                                  ? 'danger'
                                  : 'warning'
                            }
                            size="sm"
                          >
                            {isAcceptedInvite ? 'accepted invite' : isExpiredInvite ? 'invite expired' : 'invite pending'}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 break-all text-sm text-slate-500">{user.email}</div>
                      {invite && (
                        <div className="mt-2 text-xs text-slate-500">
                          {isAcceptedInvite
                            ? `Accepted ${formatDate(invite.acceptedAt || invite.createdAt)}`
                            : `Invite expires ${formatDate(invite.expiresAt)}`}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:justify-end">
                      {isPrimaryMember && invite && (isPendingInvite || isExpiredInvite) && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleCopyInvite(invite)}>
                            Copy invite
                          </Button>
                        </>
                      )}
                      {isPrimaryMember && invite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvite(invite)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete invite
                        </Button>
                      )}
                      {isPrimaryMember && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={users.length === 1 || user.role === 'primary'}
                            className={
                              users.length === 1 || user.role === 'primary'
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-700'
                            }
                            title={
                              users.length === 1
                                ? 'Cannot delete the last member'
                                : user.role === 'primary'
                                  ? 'Cannot delete the primary member'
                                  : 'Delete member'
                            }
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white xl:col-span-6">
          <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <CardTitle className="text-sm uppercase tracking-wide">Income Sources</CardTitle>
            {isPrimaryMember && (
              <Button variant="primary" size="sm" onClick={() => setIsAddSourceOpen(true)}>
                Add Source
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {incomeSources.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No income sources yet. Add one to get started.</p>
            ) : (
              <div className="space-y-3">
                {incomeSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex flex-col gap-4 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="break-words font-medium text-slate-900">{source.name}</div>
                      {source.description && (
                        <div className="mt-1 break-words text-sm text-slate-500">{source.description}</div>
                      )}
                      <div className="mt-2 text-sm text-slate-500">
                        {currencySymbol}
                        {(source.monthlyAmount || 0).toFixed(2)} planned monthly income
                      </div>
                    </div>
                    {isPrimaryMember && (
                      <div className="grid grid-cols-2 gap-2 min-[420px]:flex">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSource(source)}>
                          Edit
                        </Button>
                        {(() => {
                          const relatedIncomes = incomes.filter((income) => income.sourceId === source.id);
                          const hasRelated = relatedIncomes.length > 0;
                          return (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSource(source)}
                              disabled={hasRelated}
                              className={
                                hasRelated
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-700'
                              }
                              title={
                                hasRelated
                                  ? `Cannot delete - ${relatedIncomes.length} income record(s) use this source`
                                  : 'Delete income source'
                              }
                            >
                              Delete
                            </Button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white lg:col-span-2 xl:col-span-12">
          <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <CardTitle className="text-sm uppercase tracking-wide">Expense Categories</CardTitle>
            {isPrimaryMember && (
              <Button variant="primary" size="sm" onClick={() => setIsAddCategoryOpen(true)}>
                Add Category
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No categories yet. Add one to start tracking expenses.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => (
                  <div key={category.id} className="rounded-lg bg-slate-50 p-4">
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: category.color || '#2563eb' }}
                            />
                            <div className="min-w-0 break-words font-medium text-slate-900">{category.name}</div>
                            {category.carryOverEnabled && (
                              <Badge variant="info" size="sm" className="shrink-0 px-2 py-0.5 text-[11px] leading-4">
                                Carry over
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            {currencySymbol}
                            {category.monthlyBudget.toFixed(2)} monthly budget
                          </div>
                        </div>
                      {isPrimaryMember && (
                        <div className="grid grid-cols-2 gap-2 min-[420px]:flex">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Modals */}
      <EditHouseholdModal
        isOpen={isEditHouseholdOpen}
        onClose={() => setIsEditHouseholdOpen(false)}
      />
      <AddUserModal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} />
      {selectedUser && (
        <EditUserModal
          isOpen={isEditUserOpen}
          onClose={() => {
            setIsEditUserOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
      <AddIncomeSourceModal isOpen={isAddSourceOpen} onClose={() => setIsAddSourceOpen(false)} />
      <AddCategoryModal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} />
      {selectedCategory && (
        <EditCategoryModal
          isOpen={isEditCategoryOpen}
          onClose={() => {
            setIsEditCategoryOpen(false);
            setSelectedCategory(null);
          }}
          category={selectedCategory}
        />
      )}
      {selectedSource && (
        <EditIncomeSourceModal
          isOpen={isEditSourceOpen}
          onClose={() => {
            setIsEditSourceOpen(false);
            setSelectedSource(null);
          }}
          source={selectedSource}
        />
      )}
      {selectedUser && (
        <ConfirmDeleteModal
          isOpen={isDeleteUserOpen}
          onClose={() => {
            setIsDeleteUserOpen(false);
            setSelectedUser(null);
          }}
          onConfirm={() => deleteUser(selectedUser.id)}
          title="Delete Member"
          message={`Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`}
        />
      )}
      {selectedInvite && (
        <ConfirmDeleteModal
          isOpen={isDeleteInviteOpen}
          onClose={() => {
            setIsDeleteInviteOpen(false);
            setSelectedInvite(null);
          }}
          onConfirm={() => deleteInvite(selectedInvite.id)}
          title="Delete Invite"
          message={
            selectedInvite.acceptedAt
              ? `Delete the invite record for ${selectedInvite.email}? This will not remove the household member.`
              : `Delete the invite for ${selectedInvite.email}? If they have not accepted yet, they will no longer be able to use this invite link.`
          }
        />
      )}
      {selectedSource && (
        <ConfirmDeleteModal
          isOpen={isDeleteSourceOpen}
          onClose={() => {
            setIsDeleteSourceOpen(false);
            setSelectedSource(null);
          }}
          onConfirm={() => deleteIncomeSource(selectedSource.id)}
          title="Delete Income Source"
          message={`Are you sure you want to delete ${selectedSource.name}? This action cannot be undone.`}
        />
      )}
      {selectedCategory && (
        <ConfirmDeleteModal
          isOpen={isDeleteCategoryOpen}
          onClose={() => {
            setIsDeleteCategoryOpen(false);
            setSelectedCategory(null);
          }}
          onConfirm={() => deleteCategory(selectedCategory.id)}
          title="Delete Expense Category"
          message={
            expenses.some((expense) => expense.categoryId === selectedCategory.id)
              ? `Delete ${selectedCategory.name}? Existing expenses in this category will stay in your history, but the category will no longer be available for new expenses or budgets.`
              : `Are you sure you want to delete ${selectedCategory.name}? This action cannot be undone.`
          }
        />
      )}
    </div>
  );
}
