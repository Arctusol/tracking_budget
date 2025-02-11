import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GranularityType } from "./ChartGranularity";

interface ExpenseOverTimeProps {
  data: Array<{
    date: string;
    expenses: number;
    income: number;
  }>;
  title: string;
  granularity: GranularityType;
}

export function ExpenseOverTime({ data, title, granularity }: ExpenseOverTimeProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (granularity) {
      case "day":
        return new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
        }).format(date);
      case "week":
        return `Sem. ${new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
        }).format(date)}`;
      case "month":
        return new Intl.DateTimeFormat("fr-FR", {
          month: "short",
          year: "2-digit",
        }).format(date);
      case "year":
        return new Intl.DateTimeFormat("fr-FR", {
          year: "numeric",
        }).format(date);
      default:
        return dateStr;
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(value)
              }
              labelFormatter={formatDate}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              name="Dépenses"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              name="Revenus"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
