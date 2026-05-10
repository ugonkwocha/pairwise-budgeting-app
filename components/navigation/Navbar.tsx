'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiPieChart,
  FiSettings,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { household, users, onboardingCompleted } = useBudget();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (!onboardingCompleted || pathname === '/onboarding') {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { href: '/budgets', label: 'Budgets', icon: FiPieChart },
    { href: '/analytics', label: 'Analytics', icon: FiBarChart2 },
    { href: '/transactions', label: 'Transactions', icon: FiTrendingUp },
    { href: '/income', label: 'Income', icon: FiDollarSign },
    { href: '/expenses', label: 'Expenses', icon: FiCreditCard },
    { href: '/settings', label: 'Settings', icon: FiSettings },
  ];

  const isActive = (href: string) => pathname === href;
  const primaryUser = users[0];

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-7">
        <Link href="/dashboard" className="text-lg font-bold tracking-wide text-blue-700">
          PAIRWISE
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close navigation"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-5 rounded-xl bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Household</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950">{household?.name || 'Pairwise'}</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </span>
              {isActive(item.href) && <span className="text-base leading-none">›</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-8 space-y-1 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400">
            <FiCalendar className="h-4 w-4" aria-hidden="true" />
            Calendar
          </div>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400">
            <FiBookOpen className="h-4 w-4" aria-hidden="true" />
            Reports
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {(primaryUser?.name || primaryUser?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950">{primaryUser?.name || 'Account'}</p>
            <p className="truncate text-xs text-slate-500">{primaryUser?.email || 'Signed in'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          <FiLogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="text-base font-bold tracking-wide text-blue-700">
          PAIRWISE
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="rounded-lg border border-slate-200 p-2 text-slate-600"
          aria-label="Open navigation"
        >
          <FiMenu className="h-5 w-5" />
        </button>
      </header>

      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        {sidebar}
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation overlay"
          />
          <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">{sidebar}</div>
        </div>
      )}
    </>
  );
}
