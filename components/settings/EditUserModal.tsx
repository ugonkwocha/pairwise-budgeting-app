'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const { updateUser } = useBudget();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'primary' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user, isOpen]);

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

    setIsSubmitting(true);

    updateUser(user.id, {
      name: name.trim(),
      email: email.trim(),
      role,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Member">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
