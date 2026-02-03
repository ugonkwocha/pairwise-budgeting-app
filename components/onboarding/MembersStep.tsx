'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';

interface MembersStepProps {
  data: {
    members: Omit<User, 'id' | 'createdAt' | 'householdId'>[];
  };
  onUpdate: {
    setMembers: (m: Omit<User, 'id' | 'createdAt' | 'householdId'>[]) => void;
  };
}

export default function MembersStep({ data, onUpdate }: MembersStepProps) {
  const [members, setMembers] = useState<Omit<User, 'id' | 'createdAt' | 'householdId'>[]>(
    data.members.length > 0
      ? data.members
      : [
          { name: '', email: '', role: 'primary' },
          { name: '', email: '', role: 'member' },
        ]
  );

  // Save initial template members to parent on mount
  React.useEffect(() => {
    if (data.members.length === 0 && members.length > 0) {
      onUpdate.setMembers(members);
    }
  }, []);

  const handleAddMember = () => {
    setMembers([...members, { name: '', email: '', role: 'member' }]);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length > 1) {
      const updated = members.filter((_, i) => i !== index);
      setMembers(updated);
      onUpdate.setMembers(updated);
    }
  };

  const handleUpdateMember = (index: number, field: string, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
    onUpdate.setMembers(updated);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Add all adults who will manage the household budget. You can add more later.
      </p>

      <div className="space-y-4">
        {members.map((member, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Name"
                placeholder="e.g., Sarah"
                value={member.name}
                onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="e.g., sarah@example.com"
                value={member.email}
                onChange={(e) => handleUpdateMember(index, 'email', e.target.value)}
                required
              />
            </div>
            {members.length > 1 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemoveMember(index)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="secondary" onClick={handleAddMember} className="w-full">
        + Add Member
      </Button>
    </div>
  );
}
