import {
  Household,
  User,
  IncomeSource,
  Income,
  Category,
  MonthlyCategory,
  Expense,
  SavingsGoal,
  SavingsContribution,
  RecurringTransaction,
  Alert,
  HouseholdInvite,
} from '@/types';

export const STORAGE_VERSION = 1;

export interface BudgetStorageSchema {
  version: number;
  household: Household | null;
  currentUser: User | null;
  users: User[];
  householdInvites: HouseholdInvite[];
  incomeSources: IncomeSource[];
  incomes: Income[];
  categories: Category[];
  monthlyCategories: MonthlyCategory[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  recurringTransactions: RecurringTransaction[];
  alerts: Alert[];
  onboardingCompleted: boolean;
  currentMonth: string;
  lastMonthCheck: string;
}

export const INITIAL_STORAGE: BudgetStorageSchema = {
  version: STORAGE_VERSION,
  household: null,
  currentUser: null,
  users: [],
  householdInvites: [],
  incomeSources: [],
  incomes: [],
  categories: [],
  monthlyCategories: [],
  expenses: [],
  savingsGoals: [],
  savingsContributions: [],
  recurringTransactions: [],
  alerts: [],
  onboardingCompleted: false,
  currentMonth: new Date().toISOString().slice(0, 7),
  lastMonthCheck: new Date().toISOString(),
};
