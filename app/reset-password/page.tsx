'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthAlert, AuthShell, authButtonClass, authInputClass } from '@/components/auth/AuthShell';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create new password" subtitle="Choose a fresh password for your PairWise account.">
          {error && (
            <AuthAlert variant="error">
              <p>{error}</p>
            </AuthAlert>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={authInputClass}
              />
              <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={authInputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={authButtonClass}
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Back to sign in
            </Link>
          </div>

          <div className="mt-6">
            <AuthAlert variant="info">
              <strong>Note:</strong> This page should only be accessed via a password reset email link
              from your account recovery request.
            </AuthAlert>
          </div>
    </AuthShell>
  );
}
