'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { createClient } from '@/lib/supabase/client';

const PENDING_INVITE_PATH_KEY = 'pairwise:pending-invite-path';

interface GoogleAuthButtonProps {
  label: string;
  nextPath: string;
  onError: (message: string) => void;
}

export function GoogleAuthButton({ label, nextPath, onError }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    onError('');

    try {
      const safeNextPath = nextPath.startsWith('/') ? nextPath : '/';

      if (safeNextPath.startsWith('/invite/')) {
        window.localStorage.setItem(PENDING_INVITE_PATH_KEY, safeNextPath);
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`,
        },
      });

      if (error) {
        onError(error.message);
        setLoading(false);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to continue with Google');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      <FcGoogle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{loading ? 'Opening Google...' : label}</span>
    </button>
  );
}
