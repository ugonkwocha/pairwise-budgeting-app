'use client';

import Link from 'next/link';
import { FiBarChart2, FiCheckCircle, FiPieChart, FiShield } from 'react-icons/fi';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <div className="grid min-h-screen lg:grid-cols-[480px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white px-10 py-8 lg:flex lg:flex-col">
          <Link href="/login" className="text-lg font-bold tracking-wide text-blue-700">
            PAIRWISE
          </Link>

          <div className="mt-24">
            <div className="mb-8 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Household budgeting
            </div>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight text-slate-950">
              A calm command center for shared money decisions.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-slate-500">
              Plan budgets, track income and spending, and keep the household aligned from one private workspace.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-teal-50 p-4">
              <FiCheckCircle className="h-5 w-5 text-teal-600" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-slate-950">Guided setup</p>
            </div>
            <div className="rounded-lg bg-violet-50 p-4">
              <FiPieChart className="h-5 w-5 text-violet-600" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-slate-950">Budget clarity</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <FiBarChart2 className="h-5 w-5 text-orange-600" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-slate-950">Live insights</p>
            </div>
            <div className="rounded-lg bg-cyan-50 p-4">
              <FiShield className="h-5 w-5 text-cyan-600" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-slate-950">Private data</p>
            </div>
          </div>

          <div className="mt-auto rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Environment</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">Secure Supabase authentication</p>
          </div>
        </aside>

        <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <Link href="/login" className="mb-10 inline-block text-lg font-bold tracking-wide text-blue-700 lg:hidden">
                PAIRWISE
              </Link>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-3 text-sm font-medium text-slate-500">{subtitle}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthAlert({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'error' | 'success' | 'info';
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <div className={`mb-6 rounded-lg border p-4 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}

export const authInputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50';

export const authButtonClass =
  'w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300';
