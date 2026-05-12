'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';
import { FiCheckCircle, FiPlus, FiTrash2 } from 'react-icons/fi';

interface MembersStepProps {
  data: {
    members: Omit<User, 'id' | 'createdAt' | 'householdId'>[];
  };
  onUpdate: {
    setMembers: (m: Omit<User, 'id' | 'createdAt' | 'householdId'>[]) => void;
  };
  primaryMember?: {
    name: string;
    email: string;
  };
}

export default function MembersStep({ data, onUpdate, primaryMember }: MembersStepProps) {
  const [members, setMembers] = useState<Omit<User, 'id' | 'createdAt' | 'householdId'>[]>(
    data.members.length > 0 ? data.members : []
  );

  const handleAddMember = () => {
    const updated: Omit<User, 'id' | 'createdAt' | 'householdId'>[] = [
      ...members,
      { name: '', email: '', role: 'member' },
    ];
    setMembers(updated);
    onUpdate.setMembers(updated);
  };

  const handleRemoveMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
    onUpdate.setMembers(updated);
  };

  const handleUpdateMember = (index: number, field: string, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
    onUpdate.setMembers(updated);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold text-emerald-950">You are the primary member</p>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              {primaryMember?.name || 'Your account'} {primaryMember?.email ? `(${primaryMember.email})` : ''} will be added automatically.
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="font-semibold text-slate-950">Additional members</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This is optional. You can invite a spouse, partner, or other adult now, or add them later from Settings.
        </p>
      </div>

      <div className="space-y-4">
        {members.map((member, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Name"
                placeholder="e.g., Sarah"
                value={member.name}
                onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="e.g., sarah@example.com"
                value={member.email}
                onChange={(e) => handleUpdateMember(index, 'email', e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveMember(index)}
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <FiTrash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          </div>
        ))}
      </div>

      <Button variant="secondary" onClick={handleAddMember} className="inline-flex w-full items-center justify-center gap-2">
        <FiPlus className="h-4 w-4" aria-hidden="true" />
        Add Optional Member
      </Button>
    </div>
  );
}
