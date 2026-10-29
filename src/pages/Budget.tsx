import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  RotateCcw,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetQuestions } from "@/components/budget/BudgetQuestions";
import {
  BudgetVsSpentBars,
  SpendingDonut,
} from "@/components/budget/BudgetCharts";
import {
  currentMonthISO,
  formatCurrency,
  monthOf,
  todayISO,
  useBudget,
} from "@/hooks/useBudget";

const UNCATEGORISED = "";

const monthLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const dayLabel = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

interface ExpenseForm {
  description: string;
  amount: string;
  categoryId: string;
  date: string;
}

const emptyForm = (): ExpenseForm => ({
  description: "",
  amount: "",
  categoryId: UNCATEGORISED,
  date: todayISO(),
});

const SummaryCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-card border border-border/50 p-6 hover-lift">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-rose">{icon}</span>
    </div>
    <p className="font-serif text-2xl md:text-3xl">{value}</p>
  </div>
);

const BudgetPage = () => {
  const store = useBudget();
  const [month, setMonth] = useState(currentMonthISO());
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", budgeted: "" });
  const [formError, setFormError] = useState("");

  const monthExpenses = useMemo(
    () => store.expenses.filter((e) => monthOf(e.date) === month),
    [store.expenses, month]
  );

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach((e) =>
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount)
    );
    return map;
  }, [monthExpenses]);

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudgeted = store.categories.reduce((s, c) => s + c.budgeted, 0);
  const unallocated = store.income - totalBudgeted;

  const chartData = useMemo(() => {
    const slices: { name: string; value: number }[] = [];
    const spent = (id: string) => spentByCategory.get(id) ?? 0;
    store.categories.forEach((c) => {
      if (spent(c.id) > 0)
        slices.push({ name: c.name, value: spent(c.id) });
    });
    if (spent(UNCATEGORISED) > 0)
      slices.push({ name: "Uncategorised", value: spent(UNCATEGORISED) });
    return slices;
  }, [store.categories, spentByCategory]);

  const barData = useMemo(() => {
    const rows = store.categories.map((c) => ({
      name: c.name.length > 12 ? c.name.slice(0, 11) + "…" : c.name,
      budgeted: c.budgeted,
      spent: spentByCategory.get(c.id) ?? 0,
    }));
    if ((spentByCategory.get(UNCATEGORISED) ?? 0) > 0)
      rows.push({
        name: "Uncategorised",
        budgeted: 0,
        spent: spentByCategory.get(UNCATEGORISED) ?? 0,
      });
    return rows;
  }, [store.categories, spentByCategory]);

  const categoryName = (id: string) =>
    id === UNCATEGORISED
      ? "Uncategorised"
      : store.categories.find((c) => c.id === id)?.name ?? "Uncategorised";

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormError("");
  };

  const submitExpense = () => {
    const amount = Number(form.amount);
    if (!form.description.trim()) return setFormError("Please add a description");
    if (!amount || amount <= 0)
      return setFormError("Please enter an amount greater than zero");
    if (!form.date) return setFormError("Please pick a date");
    if (editingId) {
      store.updateExpense(editingId, {
        description: form.description.trim(),
        amount,
        categoryId: form.categoryId,
        date: form.date,
      });
    } else {
      store.addExpense({
        description: form.description.trim(),
        amount,
        categoryId: form.categoryId,
        date: form.date,
      });
    }
    resetForm();
  };

  const startEdit = (id: string) => {
    const e = store.expenses.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setForm({
      description: e.description,
      amount: String(e.amount),
      categoryId: e.categoryId,
      date: e.date,
    });
    setFormError("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const addCategory = () => {
    const budgeted = Number(newCategory.budgeted);
    if (!newCategory.name.trim()) return;
    store.addCategory(newCategory.name.trim(), budgeted > 0 ? budgeted : 0);
    setNewCategory({ name: "", budgeted: "" });
  };

  const sortedExpenses = useMemo(
    () =>
      [...monthExpenses].sort((a, b) =>
        a.date === b.date ? b.amount - a.amount : a.date < b.date ? 1 : -1
      ),
    [monthExpenses]
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-serif text-xl tracking-wide">
            Budget Planner
          </span>
          <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground hidden sm:block">
            {monthLabel(month)}
          </span>
        </div>
      </header>

      {/* Header */}
      <section className="pt-32 md:pt-40 pb-10 md:pb-14">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Know Where Every Rupee Goes
            </p>
            <h1 className="heading-elegant font-serif text-4xl md:text-5xl lg:text-6xl">
              Budget Calculator
            </h1>
            <div className="divider-editorial mt-8" />
          </motion.div>

          <BudgetQuestions store={store} month={month} onMonthChange={setMonth} />

          {/* Month + income controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-10 max-w-3xl mx-auto grid sm:grid-cols-2 gap-4"
          >
            <label className="block">
              <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Viewing month
              </span>
              <Input
                type="month"
                value={month}
                onChange={(e) => e.target.value && setMonth(e.target.value)}
                className="mt-2 bg-card border-border/50 focus:border-rose/50"
              />
            </label>
            <label className="block">
              <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Monthly income (₹)
              </span>
              <Input
                type="number"
                min="0"
                value={store.income || ""}
                placeholder="Enter your income"
                onChange={(e) => store.setIncome(Number(e.target.value) || 0)}
                className="mt-2 bg-card border-border/50 focus:border-rose/50"
              />
            </label>
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("Clear all saved budget data?")) store.clearAll();
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Clear all data
            </Button>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="pb-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
            <SummaryCard
              label="Monthly income"
              value={formatCurrency(store.income)}
              icon={<Wallet className="w-4 h-4" />}
            />
            <SummaryCard
              label="Allocated"
              value={formatCurrency(totalBudgeted)}
              icon={<PiggyBank className="w-4 h-4" />}
            />
            <SummaryCard
              label={`Spent · ${monthLabel(month)}`}
              value={formatCurrency(totalSpent)}
              icon={<Receipt className="w-4 h-4" />}
            />
            <SummaryCard
              label={unallocated >= 0 ? "Unallocated" : "Over-allocated"}
              value={formatCurrency(Math.abs(unallocated))}
              icon={<Wallet className="w-4 h-4" />}
            />
          </div>

          {/* Overall spend vs income */}
          <div className="max-w-6xl mx-auto mt-8">
            <p className={`mb-4 text-lg ${totalSpent > store.income ? "text-destructive" : "text-foreground"}`}>
              Remaining balance: {formatCurrency(store.income - totalSpent)}
            </p>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Spent {formatCurrency(totalSpent)} of {formatCurrency(store.income)} income
              </span>
              <span
                className={
                  totalSpent > store.income ? "text-destructive" : "text-muted-foreground"
                }
              >
                {store.income > 0
                  ? Math.round((totalSpent / store.income) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalSpent > store.income ? "bg-destructive" : "bg-primary"
                }`}
                style={{
                  width: `${
                    store.income > 0
                      ? Math.min(100, (totalSpent / store.income) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="pb-16 bg-card py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="heading-elegant font-serif text-3xl md:text-4xl">
              {monthLabel(month)} at a Glance
            </h2>
            <div className="divider-editorial mt-6" />
          </div>
          <div className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto items-start">
            <div className="bg-background border border-border/50 p-6">
              <h3 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 text-center">
                Where money went
              </h3>
              <SpendingDonut data={chartData} />
              {/* Legend */}
              <ul className="mt-6 grid grid-cols-2 gap-2 text-sm">
                {chartData.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        background: [
                          "hsl(15 45% 62%)",
                          "hsl(30 30% 55%)",
                          "hsl(10 35% 78%)",
                          "hsl(35 25% 45%)",
                          "hsl(15 25% 40%)",
                          "hsl(35 45% 70%)",
                          "hsl(30 10% 30%)",
                          "hsl(10 20% 65%)",
                        ][i % 8],
                      }}
                    />
                    <span className="truncate">{d.name}</span>
                    <span className="ml-auto text-muted-foreground">
                      {formatCurrency(d.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-background border border-border/50 p-6">
              <h3 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 text-center">
                Budgeted vs actually spent
              </h3>
              <BudgetVsSpentBars data={barData} />
              <p className="mt-4 text-xs text-center text-muted-foreground">
                Bars in sand show what you planned; rose bars show what you
                actually spent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category allocation */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Give Every Rupee a Job
            </p>
            <h2 className="heading-elegant font-serif text-3xl md:text-4xl">
              Allocate Your Income
            </h2>
            <div className="divider-editorial mt-6" />
            <p
              className={`mt-6 text-sm ${
                unallocated < 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {unallocated >= 0
                ? `${formatCurrency(unallocated)} of your income is still unallocated.`
                : `You've allocated ${formatCurrency(
                    Math.abs(unallocated)
                  )} more than your income.`}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {store.categories.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                No categories yet — add your first one below.
              </p>
            )}
            {store.categories.map((c) => {
              const spent = spentByCategory.get(c.id) ?? 0;
              const pct = c.budgeted > 0 ? (spent / c.budgeted) * 100 : spent > 0 ? 100 : 0;
              const over = spent > c.budgeted;
              return (
                <div
                  key={c.id}
                  className="bg-card border border-border/50 p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      value={c.name}
                      onChange={(e) =>
                        store.updateCategory(c.id, { name: e.target.value })
                      }
                      className="flex-1 min-w-[160px] font-serif text-lg bg-background border-transparent hover:border-border/50 focus:border-rose/50"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={c.budgeted || ""}
                        placeholder="Budgeted"
                        onChange={(e) =>
                          store.updateCategory(c.id, {
                            budgeted: Number(e.target.value) || 0,
                          })
                        }
                        className="w-28 bg-background border-border/50 focus:border-rose/50"
                      />
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-sm">
                        {formatCurrency(spent)}{" "}
                        <span className="text-muted-foreground">spent</span>
                      </p>
                      <p
                        className={`text-xs ${
                          over ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {over
                          ? `${formatCurrency(spent - c.budgeted)} over budget`
                          : `${formatCurrency(c.budgeted - spent)} left`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => store.deleteCategory(c.id)}
                      aria-label={`Delete category ${c.name}`}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        over ? "bg-destructive" : "bg-rose"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Add category */}
            <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-border/50">
              <label className="flex-1 min-w-[180px]">
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                  New category
                </span>
                <Input
                  value={newCategory.name}
                  placeholder="e.g. Health & Fitness"
                  onChange={(e) =>
                    setNewCategory((s) => ({ ...s, name: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  className="mt-2 bg-card border-border/50 focus:border-rose/50"
                />
              </label>
              <label className="w-36">
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                  Amount (₹)
                </span>
                <Input
                  type="number"
                  min="0"
                  value={newCategory.budgeted}
                  placeholder="e.g. 5000"
                  onChange={(e) =>
                    setNewCategory((s) => ({ ...s, budgeted: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  className="mt-2 bg-card border-border/50 focus:border-rose/50"
                />
              </label>
              <Button
                onClick={addCategory}
                disabled={!newCategory.name.trim()}
                className="bg-foreground text-background hover:bg-foreground/90 py-5 text-sm tracking-[0.15em] uppercase"
              >
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Expenses */}
      <section className="py-16 md:py-20 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Track What Leaves Your Pocket
            </p>
            <h2 className="heading-elegant font-serif text-3xl md:text-4xl">
              Log Expenses
            </h2>
            <div className="divider-editorial mt-6" />
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Expense form */}
            <div className="bg-background border border-border/50 p-6 mb-10">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="lg:col-span-1">
                  <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                    Description
                  </span>
                  <Input
                    value={form.description}
                    placeholder="e.g. Vegetable market"
                    onChange={(e) =>
                      setForm((s) => ({ ...s, description: e.target.value }))
                    }
                    className="mt-2 bg-card border-border/50 focus:border-rose/50"
                  />
                </label>
                <label>
                  <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                    Amount (₹)
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={form.amount}
                    placeholder="0"
                    onChange={(e) =>
                      setForm((s) => ({ ...s, amount: e.target.value }))
                    }
                    className="mt-2 bg-card border-border/50 focus:border-rose/50"
                  />
                </label>
                <label>
                  <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                    Category
                  </span>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, categoryId: e.target.value }))
                    }
                    className="mt-2 w-full h-10 rounded-md border border-border/50 bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <option value={UNCATEGORISED}>Uncategorised</option>
                    {store.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                    Date
                  </span>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, date: e.target.value }))
                    }
                    className="mt-2 bg-card border-border/50 focus:border-rose/50"
                  />
                </label>
              </div>
              {formError && (
                <p className="mt-3 text-sm text-destructive">{formError}</p>
              )}
              <div className="mt-5 flex gap-3">
                <Button
                  onClick={submitExpense}
                  className="bg-foreground text-background hover:bg-foreground/90 py-5 text-sm tracking-[0.15em] uppercase"
                >
                  {editingId ? "Save changes" : "Add expense"}
                </Button>
                {editingId && (
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    className="py-5 text-sm tracking-[0.15em] uppercase"
                  >
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* Expense list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl">
                  {monthLabel(month)} · {sortedExpenses.length}{" "}
                  {sortedExpenses.length === 1 ? "entry" : "entries"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Total {formatCurrency(totalSpent)}
                </p>
              </div>
              {sortedExpenses.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-10">
                  Nothing logged for {monthLabel(month)} yet.
                </p>
              )}
              {sortedExpenses.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-4 bg-background border border-border/50 px-5 py-3 ${
                    editingId === e.id ? "border-rose/50" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {categoryName(e.categoryId)} · {dayLabel(e.date)}
                    </p>
                  </div>
                  <p className="font-serif text-lg whitespace-nowrap">
                    {formatCurrency(e.amount)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(e.id)}
                    aria-label={`Edit ${e.description}`}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => store.deleteExpense(e.id)}
                    aria-label={`Delete ${e.description}`}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <section className="py-12 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
          Your data stays in this browser — nothing is sent anywhere
        </p>
      </section>
    </main>
  );
};

export default BudgetPage;
