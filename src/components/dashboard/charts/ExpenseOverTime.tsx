import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ExpenseOverTimeProps {
  data: Array<{
    date: string;
    expenses: number;
    income: number;
  }>;
  title: string;
}

export function ExpenseOverTime({ data, title }: ExpenseOverTimeProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              tickFormatter={(value) =>
                `${value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`.replace(
                  "EUR",
                  "€",
                )
              }
            />
            <Tooltip
              formatter={(value: number) =>
                value.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })
              }
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              name="Dépenses"
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              name="Revenus"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
