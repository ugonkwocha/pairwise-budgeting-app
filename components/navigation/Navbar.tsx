'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBudget } from '@/lib/contexts/BudgetContext';

export default function Navbar() {
  const pathname = usePathname();
  const { household, onboardingCompleted } = useBudget();

  // Don't show navbar on onboarding page
  if (!onboardingCompleted || pathname === '/onboarding') {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/transactions', label: 'Transactions', icon: '📜' },
    { href: '/income', label: 'Income', icon: '💰' },
    { href: '/expenses', label: 'Expenses', icon: '💳' },
    { href: '/budgets', label: 'Budgets', icon: '📝' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Household Name */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600">
              {household?.name || 'Pairwise'}
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
