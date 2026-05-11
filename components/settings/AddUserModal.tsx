'use client';

import { useState } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { MemberInviteResult } from '@/types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const { inviteUser, household } = useBudget();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'primary' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailNotice, setEmailNotice] = useState('');
  const [invite, setInvite] = useState<MemberInviteResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      alert('Name and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!household) return;

    setIsSubmitting(true);
    setError('');
    setEmailNotice('');

    try {
      const createdInvite = await inviteUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        householdId: household.id,
      });

      const response = await fetch('/api/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: createdInvite.member.email,
          name: createdInvite.member.name,
          householdName: household.name,
          inviteUrl: createdInvite.inviteUrl,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setEmailNotice(result?.error || 'Invite was created, but the email could not be sent. You can copy the link below.');
      }

      setInvite(createdInvite);
      setName('');
      setEmail('');
      setRole('member');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setRole('member');
    setError('');
    setEmailNotice('');
    setInvite(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleCopyInvite = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.inviteUrl);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Member">
      {invite ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Invite created for {invite.member.email}</p>
            <p className="mt-1 text-sm text-emerald-800">
              We sent them an email. They must sign up or sign in using the same email address.
            </p>
          </div>

          {emailNotice && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {emailNotice}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Invite link</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 break-all">
              {invite.inviteUrl}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleCopyInvite}>
              Copy link
            </Button>
            <Button type="button" variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter member name"
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter email address"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'primary' | 'member')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="member">Member</option>
            <option value="primary">Primary</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating invite...' : 'Create Invite'}
          </Button>
        </div>
      </form>
      )}
    </Modal>
  );
}
