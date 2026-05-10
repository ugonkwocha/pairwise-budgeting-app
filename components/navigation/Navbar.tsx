'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiBarChart2,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiHome,
  FiLogOut,
  FiPieChart,
  FiSettings,
  FiTrendingUp,
} from 'react-icons/fi';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { household, onboardingCompleted } = useBudget();

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
    { href: '/analytics', label: 'Analytics', icon: FiBarChart2 },
    { href: '/transactions', label: 'Transactions', icon: FiTrendingUp },
    { href: '/income', label: 'Income', icon: FiDollarSign },
    { href: '/expenses', label: 'Expenses', icon: FiCreditCard },
    { href: '/budgets', label: 'Budgets', icon: FiPieChart },
    { href: '/settings', label: 'Settings', icon: FiSettings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm transition-colors group-hover:bg-blue-700">
                <FiHome aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-none text-slate-950">
                  {household?.name || 'Pairwise'}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-500">Household budget</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
            >
              <FiLogOut aria-hidden="true" />
              Sign out
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
            <div className="flex min-w-max items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-950'
                  }`}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden min-w-max items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
            >
              <FiLogOut aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
