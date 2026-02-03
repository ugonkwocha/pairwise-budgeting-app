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
  Alert,
} from '@/types';

export const STORAGE_VERSION = 1;

export interface BudgetStorageSchema {
  version: number;
  household: Household | null;
  users: User[];
  incomeSources: IncomeSource[];
  incomes: Income[];
  categories: Category[];
  monthlyCategories: MonthlyCategory[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  alerts: Alert[];
  onboardingCompleted: boolean;
  currentMonth: string;
  lastMonthCheck: string;
}

export const INITIAL_STORAGE: BudgetStorageSchema = {
  version: STORAGE_VERSION,
  household: null,
  users: [],
  incomeSources: [],
  incomes: [],
  categories: [],
  monthlyCategories: [],
  expenses: [],
  savingsGoals: [],
  savingsContributions: [],
  alerts: [],
  onboardingCompleted: false,
  currentMonth: new Date().toISOString().slice(0, 7),
  lastMonthCheck: new Date().toISOString(),
};
