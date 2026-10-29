import { useEffect, useState } from "react";

export interface Category {
  id: string;
  name: string;
  budgeted: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string; // "" = uncategorised
  date: string; // YYYY-MM-DD
}

interface BudgetState {
  income: number;
  categories: Category[];
  expenses: Expense[];
}

const STORAGE_KEY = "budget-calculator-v2";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const currentMonthISO = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const monthOf = (date: string): string => date.slice(0, 7);

export const todayISO = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

export const formatCurrency = (n: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetState;
      if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.expenses)) {
        return parsed;
      }
    }
  } catch {
    // Corrupted storage starts empty; never invent budget entries.
  }
  return { income: 0, categories: [], expenses: [] };
}

export function useBudget() {
  const [state, setState] = useState<BudgetState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — keep working in-memory
    }
  }, [state]);

  const setIncome = (income: number) =>
    setState((s) => ({ ...s, income: Math.max(0, income) }));

  const addCategory = (name: string, budgeted: number) =>
    setState((s) => ({
      ...s,
      categories: [...s.categories, { id: uid(), name, budgeted }],
    }));

  const updateCategory = (id: string, patch: Partial<Omit<Category, "id">>) =>
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  // Deleting a category keeps its expenses — they become uncategorised.
  const deleteCategory = (id: string) =>
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      expenses: s.expenses.map((e) =>
        e.categoryId === id ? { ...e, categoryId: "" } : e
      ),
    }));

  const addExpense = (expense: Omit<Expense, "id">) =>
    setState((s) => ({
      ...s,
      expenses: [...s.expenses, { ...expense, id: uid() }],
    }));

  const updateExpense = (id: string, patch: Partial<Omit<Expense, "id">>) =>
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const deleteExpense = (id: string) =>
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));

  const clearAll = () =>
    setState({ income: 0, categories: [], expenses: [] });

  return {
    income: state.income,
    categories: state.categories,
    expenses: state.expenses,
    setIncome,
    addCategory,
    updateCategory,
    deleteCategory,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAll,
  };
}

export type BudgetStore = ReturnType<typeof useBudget>;
