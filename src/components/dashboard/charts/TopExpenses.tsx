import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopExpensesProps {
  data: Array<{
    name: string;
    amount: number;
  }>;
  title: string;
  onItemClick?: (categoryName: string) => void;
}

export function TopExpenses({ data, title, onItemClick }: TopExpensesProps) {
  const handleClick = (data: any) => {
    if (onItemClick && data?.name) {
      onItemClick(data.name);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) =>
                `${value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`.replace(
                  "EUR",
                  "€",
                )
              }
            />
            <YAxis type="category" dataKey="name" width={150} />
            <Tooltip
              formatter={(value: number) =>
                value.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })
              }
            />
            <Bar 
              dataKey="amount" 
              fill="#6366f1" 
              onClick={handleClick}
              cursor={onItemClick ? "pointer" : "default"}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
