import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useBudget } from "./useBudget";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("user-entered budgets", () => {
  it("starts without simulated income, categories, or expenses", () => {
    const { result } = renderHook(useBudget);
    expect(result.current.income).toBe(0);
    expect(result.current.categories).toEqual([]);
    expect(result.current.expenses).toEqual([]);
  });
  it("does not reuse legacy simulated entries", () => {
    localStorage.setItem("budget-calculator-v1", JSON.stringify({ income: 50000, categories: [{ id: "c-rent", name: "Rent", budgeted: 18000 }], expenses: [] }));
    const { result } = renderHook(useBudget);
    expect(result.current.income).toBe(0);
    expect(result.current.categories).toEqual([]);
  });
  it("updates and reloads only the user's answers", () => {
    const first = renderHook(useBudget);
    act(() => first.result.current.setIncome(62000));
    act(() => first.result.current.addCategory("My bills", 12000));
    const categoryId = first.result.current.categories[0]?.id ?? "";
    act(() => first.result.current.addExpense({ description: "My payment", amount: 2300, categoryId, date: "2026-10-19" }));
    expect(first.result.current.income - first.result.current.expenses.reduce((sum, e) => sum + e.amount, 0)).toBe(59700);
    first.unmount();
    const second = renderHook(useBudget);
    expect(second.result.current.income).toBe(62000);
    expect(second.result.current.categories).toHaveLength(1);
    expect(second.result.current.expenses[0]?.amount).toBe(2300);
  });
});