'use client';

import { useState } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EditHouseholdModal } from '@/components/settings/EditHouseholdModal';
import { AddUserModal } from '@/components/settings/AddUserModal';
import { EditUserModal } from '@/components/settings/EditUserModal';
import { AddIncomeSourceModal } from '@/components/settings/AddIncomeSourceModal';
import { EditIncomeSourceModal } from '@/components/settings/EditIncomeSourceModal';
import { ConfirmDeleteModal } from '@/components/settings/ConfirmDeleteModal';
import type { User, IncomeSource } from '@/types';

export default function SettingsPage() {
  const { household, users, incomeSources, incomes, deleteUser, deleteIncomeSource } = useBudget();

  // Modal states
  const [isEditHouseholdOpen, setIsEditHouseholdOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isEditSourceOpen, setIsEditSourceOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isDeleteSourceOpen, setIsDeleteSourceOpen] = useState(false);

  // Selected items for editing/deleting
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSource, setSelectedSource] = useState<IncomeSource | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = (user: User) => {
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
    setSelectedSource(source);
    setIsEditSourceOpen(true);
  };

  const handleDeleteSource = (source: IncomeSource) => {
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

  if (!household) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Settings
          </div>
          <div className="border-b border-slate-200 pb-6">
            <h1 className="text-2xl font-semibold text-slate-950">Settings</h1>
            <p className="mt-6 text-base font-medium text-slate-950">Manage your household, members, and income sources</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle className="text-sm uppercase tracking-wide">Household Information</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => setIsEditHouseholdOpen(true)}>
              Edit
            </Button>
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

        <div className="space-y-6">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle className="text-sm uppercase tracking-wide">Members</CardTitle>
            <Button variant="primary" size="sm" onClick={() => setIsAddUserOpen(true)}>
              Add Member
            </Button>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No members yet. Add one to get started.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-4 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <Badge variant={user.role === 'primary' ? 'success' : 'default'} size="sm">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                    </div>
                    <div className="flex gap-2">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle className="text-sm uppercase tracking-wide">Income Sources</CardTitle>
            <Button variant="primary" size="sm" onClick={() => setIsAddSourceOpen(true)}>
              Add Source
            </Button>
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
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{source.name}</div>
                      {source.description && (
                        <div className="mt-1 text-sm text-slate-500">{source.description}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
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
    </div>
  );
}
