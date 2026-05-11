'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

interface RemovedHouseholdScreenProps {
  householdName?: string;
  onStartNewHousehold: () => void;
}

export function RemovedHouseholdScreen({ householdName, onStartNewHousehold }: RemovedHouseholdScreenProps) {
  const handleSignOut = async () => {
    await createClient().auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#f7f9fd] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
            Household access removed
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">You no longer have access to this household.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {householdName
              ? `Your access to ${householdName} has been removed by a primary member.`
              : 'Your access to this household has been removed by a primary member.'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You can start a new household budget with this account, or sign out and use another account.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="primary" onClick={onStartNewHousehold}>
              Create new household
            </Button>
            <Button type="button" variant="secondary" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
