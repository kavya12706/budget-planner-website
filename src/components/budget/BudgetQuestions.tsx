import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetStore, formatCurrency, todayISO } from "@/hooks/useBudget";

export function BudgetQuestions({ store, month, onMonthChange }: {
  store: BudgetStore;
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [allocation, setAllocation] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const move = (next: number) => { setStep(next); setError(""); setSaved(""); };
  const saveCategory = () => {
    if (!name.trim() || !allocation.trim() || !Number.isFinite(Number(allocation)) || Number(allocation) < 0) {
      setError("Enter a category name and an amount of zero or more.");
      return;
    }
    store.addCategory(name.trim(), Number(allocation));
    setSaved(`${name.trim()} · ${formatCurrency(Number(allocation))} allocated`);
    setName(""); setAllocation(""); setError("");
  };
  const saveExpense = () => {
    if (!description.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !date) {
      setError("Enter what you paid for, an amount greater than zero, and a date.");
      return;
    }
    store.addExpense({ description: description.trim(), amount: Number(amount), categoryId, date });
    onMonthChange(date.slice(0, 7));
    setSaved(`${description.trim()} · ${formatCurrency(Number(amount))} recorded`);
    setDescription(""); setAmount(""); setError("");
  };
  const questions = ["Which month are you planning for?", "What is your monthly take-home income?", "What do you want to set money aside for?", "What have you already spent?", "Your budget"];
  const spent = store.expenses.filter(e => e.date.slice(0, 7) === month).reduce((sum, e) => sum + e.amount, 0);

  return (
    <section className="max-w-3xl mx-auto mt-8 text-left border-y border-border/50 py-8" aria-label="Budget questions">
      <div className="flex justify-between items-center gap-4 mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{step < 4 ? `Question ${step + 1} of 4` : "Ready"}</p>
        {step > 0 && <Button variant="ghost" size="sm" onClick={() => move(step - 1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>}
      </div>
      <h2 className="font-serif text-2xl mb-6">{questions[step]}</h2>
      <form onSubmit={e => { e.preventDefault(); if (step === 2) saveCategory(); else if (step === 3) saveExpense(); else move(step + 1); }} className="space-y-4">
        {step === 0 && <label className="block space-y-2"><span className="text-sm">Budget month</span><Input required type="month" value={month} onChange={e => onMonthChange(e.target.value)} /></label>}
        {step === 1 && <label className="block space-y-2"><span className="text-sm">Take-home income (₹)</span><Input required type="number" min="0" step="0.01" value={store.income || ""} placeholder="Enter your income" onChange={e => store.setIncome(Number(e.target.value) || 0)} /></label>}
        {step === 2 && <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-2"><span className="text-sm">Category name</span><Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter a category" /></label>
          <label className="block space-y-2"><span className="text-sm">Amount to set aside (₹)</span><Input type="number" min="0" step="0.01" value={allocation} onChange={e => setAllocation(e.target.value)} placeholder="Enter your amount" /></label>
        </div>}
        {step === 3 && <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-2"><span className="text-sm">What did you pay for?</span><Input value={description} onChange={e => setDescription(e.target.value)} /></label>
          <label className="block space-y-2"><span className="text-sm">How much did you spend (₹)?</span><Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <label className="block space-y-2"><span className="text-sm">Which category?</span><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Uncategorised</option>{store.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="block space-y-2"><span className="text-sm">When did you pay?</span><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        </div>}
        {step === 4 && <div className="flex flex-wrap gap-6"><p>Income <strong className="block text-xl">{formatCurrency(store.income)}</strong></p><p>Spent <strong className="block text-xl">{formatCurrency(spent)}</strong></p><p>Remaining balance <strong className="block text-xl">{formatCurrency(store.income - spent)}</strong></p></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {saved && <p role="status" className="text-sm text-muted-foreground flex items-center gap-2"><Check className="w-4 h-4" />{saved}</p>}
        <div className="flex flex-wrap gap-3">
          {step < 2 && <Button type="submit">Continue<ArrowRight className="w-4 h-4 ml-2" /></Button>}
          {step === 2 && <><Button type="submit"><Plus className="w-4 h-4 mr-2" />Save category</Button><Button type="button" variant="outline" onClick={() => move(3)}>Next: expenses<ArrowRight className="w-4 h-4 ml-2" /></Button></>}
          {step === 3 && <><Button type="submit"><Plus className="w-4 h-4 mr-2" />Save expense</Button><Button type="button" variant="outline" onClick={() => move(4)}>Finish<Check className="w-4 h-4 ml-2" /></Button></>}
          {step === 4 && <><Button type="button" variant="outline" onClick={() => move(2)}><Plus className="w-4 h-4 mr-2" />Add category</Button><Button type="button" onClick={() => move(3)}><Plus className="w-4 h-4 mr-2" />Add expense</Button></>}
        </div>
      </form>
    </section>
  );
}