import type { Metadata, Viewport } from 'next';
import { BudgetProvider } from '@/lib/contexts/BudgetContext';
import AppShell from '@/components/navigation/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pairwise - Household Budgeting',
  description: 'Plan your money clearly, track spending honestly, and prevent overspending with shared visibility.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BudgetProvider>
          <AppShell>{children}</AppShell>
        </BudgetProvider>
      </body>
    </html>
  );
}
