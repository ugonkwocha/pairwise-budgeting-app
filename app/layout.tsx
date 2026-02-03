import type { Metadata } from 'next';
import { BudgetProvider } from '@/lib/contexts/BudgetContext';
import Navbar from '@/components/navigation/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pairwise - Household Budgeting',
  description: 'Plan your money clearly, track spending honestly, and prevent overspending with shared visibility.',
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
          <Navbar />
          {children}
        </BudgetProvider>
      </body>
    </html>
  );
}
