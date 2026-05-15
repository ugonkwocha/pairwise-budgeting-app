'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthAlert, AuthShell, authButtonClass, authInputClass } from '@/components/auth/AuthShell';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successEmail, setSuccessEmail] = useState('');
  const [existingEmail, setExistingEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessEmail('');
    setExistingEmail('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Validate inputs
      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/onboarding';

      // Sign up user
      const { data, error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: {
            name,
          },
        },
      });

      if (signupError) {
        if (signupError.message.toLowerCase().includes('already')) {
          setExistingEmail(normalizedEmail);
          setPassword('');
          setConfirmPassword('');
          return;
        }

        setError(signupError.message);
        return;
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setExistingEmail(normalizedEmail);
        setPassword('');
        setConfirmPassword('');
        return;
      }

      if (data.session) {
        router.push(next);
        return;
      }

      setSuccessEmail(normalizedEmail);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Start your household budget workspace.">
          {error && (
            <AuthAlert variant="error">
              <p>{error}</p>
            </AuthAlert>
          )}

          {successEmail && (
            <AuthAlert variant="success">
              <p className="font-semibold">Check your email to confirm your account.</p>
              <p className="mt-1">
                We sent a confirmation link to {successEmail}. After confirming, you can continue setup.
              </p>
            </AuthAlert>
          )}

          {existingEmail && (
            <AuthAlert variant="error">
              <p className="font-semibold">That email already has a PairWise account.</p>
              <p className="mt-1">
                Sign in with {existingEmail}, or reset the password if you do not remember it.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/login?email=${encodeURIComponent(existingEmail)}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Sign in
                </Link>
                <Link
                  href={`/forgot-password?email=${encodeURIComponent(existingEmail)}`}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset password
                </Link>
              </div>
            </AuthAlert>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className={authInputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={authInputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Password
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </div>
    </AuthShell>
  );
}
