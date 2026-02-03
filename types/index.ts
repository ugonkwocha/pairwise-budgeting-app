// Core Data Models

export interface Household {
  id: string;
  name: string;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'primary' | 'member';
  householdId: string;
  createdAt: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Income {
  id: string;
  amount: number;
  sourceId: string;
  sourceName: string;
  userId: string;
  userName: string;
  date: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  revisions?: IncomeRevision[];
}

export interface IncomeRevision {
  id: string;
  originalIncomeId: string;
  amount: number;
  sourceId: string;
  date: string;
  notes?: string;
  editedAt: string;
  editedBy: string;
}

export interface Category {
  id: string;
  name: string;
  monthlyBudget: number;
  carryOverEnabled: boolean;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface MonthlyCategory {
  id: string;
  categoryId: string;
  categoryName: string;
  monthlyBudget: number;
  currentSpent: number;
  carryOverAmount: number;
  month: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  needsOrWants: 'needs' | 'wants';
  userId: string;
  userName: string;
  date: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  revisions?: ExpenseRevision[];
}

export interface ExpenseRevision {
  id: string;
  originalExpenseId: string;
  amount: number;
  categoryId: string;
  needsOrWants: 'needs' | 'wants';
  date: string;
  notes?: string;
  editedAt: string;
  editedBy: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  userId: string;
  userName: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: 'category_warning' | 'category_exceeded' | 'total_exceeded' | 'info';
  severity: 'info' | 'warning' | 'danger';
  message: string;
  categoryId?: string;
  dismissed: boolean;
  createdAt: string;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  household?: Partial<Household>;
  members?: Partial<User>[];
  incomeSources?: Partial<IncomeSource>[];
  categories?: Partial<Category>[];
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'CAD' | 'AUD';
export type TimeRange = 'weekly' | 'monthly' | 'annual';

export interface BudgetSummary {
  totalIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  netDisposableIncome: number;
  savingsBalance: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'danger';
}

export interface IncomeBreakdown {
  sourceId: string;
  sourceName: string;
  amount: number;
  percentage: number;
}

// Analytics & Reports Types

export interface TimeRange {
  startMonth: string;
  endMonth: string;
  preset?: '3months' | '6months' | '12months' | 'custom';
}

export interface SpendingTrendData {
  month: string;
  totalSpent: number;
  needsSpent: number;
  wantsSpent: number;
}

export interface IncomeTrendData {
  month: string;
  totalIncome: number;
  bySource: Record<string, number>;
}

export interface CategoryTrendData {
  categoryId: string;
  categoryName: string;
  monthlyData: Array<{ month: string; spent: number }>;
}

export interface BudgetHealthData {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  factors: string[];
}

export interface MonthlyComparisonData {
  month: string;
  income: number;
  spent: number;
  saved: number;
  savingsRate: number;
}

export interface UserSpendingData {
  userId: string;
  userName: string;
  totalSpent: number;
  percentage: number;
}

export interface NeedsWantsData {
  needs: number;
  wants: number;
  needsPercentage: number;
  wantsPercentage: number;
}

export interface TopCategoryData {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
  percentage: number;
}

export interface CategoryAverageData {
  categoryId: string;
  categoryName: string;
  avgSpent: number;
  totalSpent: number;
  monthCount: number;
}

// Transaction History Types

export interface UnifiedTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryOrSource: string; // categoryName or sourceName
  categoryOrSourceId: string; // categoryId or sourceId
  userId: string;
  userName: string;
  date: string;
  notes?: string;
  needsOrWants?: 'needs' | 'wants'; // only for expenses
  createdAt: string;
}

export interface TransactionFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  type?: 'all' | 'income' | 'expense';
  categoryOrSourceIds?: string[];
  userIds?: string[];
  amountRange?: {
    min?: number;
    max?: number;
  };
  needsOrWants?: 'all' | 'needs' | 'wants'; // for expenses
  searchText?: string;
}

export type SortField = 'date' | 'amount' | 'categoryOrSource' | 'userName';
export type SortDirection = 'asc' | 'desc';

export interface TransactionSort {
  field: SortField;
  direction: SortDirection;
}

export interface TransactionStats {
  totalCount: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  averageAmount: number;
  dateRange: {
    start: string;
    end: string;
  };
}
