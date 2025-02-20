import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card } from '@/components/ui/card';

interface ShoppingHabitsProps {
  data: {
    dayOfWeek: string;
    count: number;
    total: number;
  }[];
  title: string;
}

export const ShoppingHabits = memo(({ data, title }: ShoppingHabitsProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="dayOfWeek" 
              type="category"
              tick={{ fontSize: 14 }}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value} achats`,
                'Fréquence'
              ]}
            />
            <Bar 
              dataKey="count" 
              fill="#8884d8"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});
