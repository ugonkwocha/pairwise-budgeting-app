'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthAlert, AuthShell, authButtonClass, authInputClass } from '@/components/auth/AuthShell';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState('/');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const errorParam = params.get('error');
    const next = params.get('next') || '/';

    if (emailParam) {
      setEmail(emailParam);
    }

    if (errorParam) {
      setError(errorParam);
    }

    setNextPath(next.startsWith('/') ? next : '/');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (!data.session) {
        setError('Sign in did not return a session. Please confirm your email and try again.');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/';
      window.location.assign(next.startsWith('/') ? next : '/');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to your household budget.">
          {error && (
            <AuthAlert variant="error">
              <p>{error}</p>
            </AuthAlert>
          )}

          <div className="space-y-4">
            <GoogleAuthButton label="Continue with Google" nextPath={nextPath} onError={setError} />
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>Email</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-4 space-y-4">
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className={authButtonClass}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm">
            <Link
              href="/forgot-password"
              className="block text-center font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
            <div className="text-center text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-blue-600 hover:text-blue-700">
                Sign up
              </Link>
            </div>
          </div>
    </AuthShell>
  );
}
