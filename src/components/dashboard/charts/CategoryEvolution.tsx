import { memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

interface CategoryEvolutionData {
  date: string;
  [key: string]: number | string;
}

interface CategoryEvolutionProps {
  data: CategoryEvolutionData[];
  categories: { id: string; name: string; color: string }[];
  title: string;
}

export const CategoryEvolution = memo(({ data, categories, title }: CategoryEvolutionProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'dd/MM')}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} €`,
                categories.find(c => c.id === name)?.name || name
              ]}
              labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
            />
            {categories.map((category) => (
              <Area
                key={category.id}
                type="monotone"
                dataKey={category.id}
                name={category.name}
                stackId="1"
                stroke={category.color}
                fill={category.color}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});
