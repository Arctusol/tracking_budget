import { Transaction } from "@/types/expense";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface TransactionChartProps {
  transactions?: Transaction[];
  type: "expense" | "income";
  title: string;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B6B",
];

const CATEGORY_LABELS: Record<string, string> = {
  food: "Alimentation",
  transport: "Transport",
  leisure: "Loisirs",
  housing: "Logement",
  health: "Santé",
  shopping: "Shopping",
  salary: "Salaire",
  investment: "Investissement",
  other: "Autre",
};

export function ExpenseChart({
  transactions = [],
  type,
  title,
}: TransactionChartProps) {
  const filteredTransactions = transactions.filter((t) => t.type === type);
  const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Group transactions by category and calculate totals
  const categoryData = filteredTransactions.reduce(
    (acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Convert to array format for Recharts
  const data = Object.entries(categoryData).map(([category, amount]) => ({
    name: CATEGORY_LABELS[category] || category,
    value: amount,
    percentage: ((amount / total) * 100).toFixed(1),
  }));

  return (
    <div className="w-full h-[300px] bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-sm text-muted-foreground">
          Total: {total.toFixed(2)} €
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percentage }) => `${name} (${percentage}%)`}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
