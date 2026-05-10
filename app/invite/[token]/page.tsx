'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AuthAlert, AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useBudget } from '@/lib/contexts/BudgetContext';

type AcceptState = 'checking' | 'signed-out' | 'accepting' | 'accepted' | 'error';

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { reload } = useBudget();
  const [state, setState] = useState<AcceptState>('checking');
  const [message, setMessage] = useState('');
  const [householdName, setHouseholdName] = useState('');

  const token = params.token;
  const invitePath = `/invite/${token}`;

  useEffect(() => {
    let cancelled = false;

    async function acceptInvite() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setState('signed-out');
        return;
      }

      setState('accepting');
      const { data, error } = await (supabase as any)
        .rpc('accept_household_invite', { invite_token: token })
        .single();

      if (cancelled) return;

      if (error) {
        setMessage(error.message || 'Unable to accept invite');
        setState('error');
        return;
      }

      setHouseholdName(data?.household_name || 'your household');
      await reload();
      setState('accepted');
    }

    acceptInvite();

    return () => {
      cancelled = true;
    };
  }, [reload, token]);

  return (
    <AuthShell title="Household invite" subtitle="Join an existing PairWise household.">
      {state === 'checking' || state === 'accepting' ? (
        <div className="space-y-3 text-center">
          <h3 className="text-lg font-semibold text-slate-950">
            {state === 'checking' ? 'Checking your session...' : 'Accepting invite...'}
          </h3>
          <p className="text-sm text-slate-500">This will only take a moment.</p>
        </div>
      ) : null}

      {state === 'signed-out' && (
        <div className="space-y-5">
          <AuthAlert variant="info">
            Sign in or create an account using the same email address this invite was sent to.
          </AuthAlert>
          <div className="grid gap-3">
            <Link href={`/login?next=${encodeURIComponent(invitePath)}`}>
              <Button className="w-full">Sign in to accept</Button>
            </Link>
            <Link href={`/signup?next=${encodeURIComponent(invitePath)}`}>
              <Button variant="secondary" className="w-full">Create account</Button>
            </Link>
          </div>
        </div>
      )}

      {state === 'accepted' && (
        <div className="space-y-5">
          <AuthAlert variant="success">
            You joined {householdName}. You can now access the shared household budget.
          </AuthAlert>
          <Button className="w-full" onClick={() => router.push('/dashboard')}>
            Go to dashboard
          </Button>
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-5">
          <AuthAlert variant="error">
            {message}
          </AuthAlert>
          <div className="grid gap-3">
            <Link href="/login">
              <Button className="w-full">Sign in with another account</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" className="w-full">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
