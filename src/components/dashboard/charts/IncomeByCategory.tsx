import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface IncomeByCategoryProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title: string;
  onChartClick?: (category: string) => void;
}

export function IncomeByCategory({ data, title, onChartClick }: IncomeByCategoryProps) {
  const handleClick = (entry: any) => {
    if (onChartClick) {
      onChartClick(entry.name);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                `${value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`
              }
            />
            <Legend onClick={handleClick} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
