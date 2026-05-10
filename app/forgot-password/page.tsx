'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthAlert, AuthShell, authButtonClass, authInputClass } from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We’ll send a secure recovery link to your email.">
          {error && (
            <AuthAlert variant="error">
              <p>{error}</p>
            </AuthAlert>
          )}

          {success && (
            <AuthAlert variant="success">
              <p>
                Check your email for a password reset link. The link expires in 1 hour.
              </p>
            </AuthAlert>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={success}
                className={authInputClass}
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter the email address associated with your account.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className={authButtonClass}
            >
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <Link href="/login" className="block font-semibold text-blue-600 hover:text-blue-700">
              Back to sign in
            </Link>
            <Link href="/signup" className="block text-slate-500 hover:text-slate-700">
              Create a new account
            </Link>
          </div>
    </AuthShell>
  );
}
