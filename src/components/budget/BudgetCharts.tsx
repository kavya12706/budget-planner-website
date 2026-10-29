import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/hooks/useBudget";

// Warm editorial palette drawn from the site's rose / blush / sand tones
export const CHART_COLORS = [
  "hsl(15 45% 62%)",
  "hsl(30 30% 55%)",
  "hsl(10 35% 78%)",
  "hsl(35 25% 45%)",
  "hsl(15 25% 40%)",
  "hsl(35 45% 70%)",
  "hsl(30 10% 30%)",
  "hsl(10 20% 65%)",
];

interface CategorySlice {
  name: string;
  value: number;
}

const compactINR = (n: number) => {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
};

export const SpendingDonut = ({ data }: { data: CategorySlice[] }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        No spending recorded this month yet.
      </div>
    );
  }
  return (
    <div className="h-72 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            strokeWidth={2}
            stroke="hsl(40 33% 96%)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | string) => formatCurrency(Number(value))}
            contentStyle={{
              background: "hsl(40 30% 98%)",
              border: "1px solid hsl(35 20% 88%)",
              borderRadius: 4,
              fontFamily: "Inter, sans-serif",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Spent
        </span>
        <span className="font-serif text-2xl">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

export const BudgetVsSpentBars = ({
  data,
}: {
  data: { name: string; budgeted: number; spent: number }[];
}) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        Add a category to compare plan vs actual.
      </div>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(30 8% 45%)", fontFamily: "Inter" }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={compactINR}
            tick={{ fontSize: 11, fill: "hsl(30 8% 45%)", fontFamily: "Inter" }}
          />
          <Tooltip
            formatter={(value: number | string) => formatCurrency(Number(value))}
            contentStyle={{
              background: "hsl(40 30% 98%)",
              border: "1px solid hsl(35 20% 88%)",
              borderRadius: 4,
              fontFamily: "Inter, sans-serif",
            }}
          />
          <Bar dataKey="budgeted" name="Budgeted" fill="hsl(35 20% 80%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="spent" name="Spent" fill="hsl(15 45% 62%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
