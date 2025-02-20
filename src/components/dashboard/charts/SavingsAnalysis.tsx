import { memo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';

interface SavingsData {
  category: string;
  originalPrice: number;
  finalPrice: number;
  savings: number;
  savingsPercentage: number;
}

interface SavingsAnalysisProps {
  data: SavingsData[];
  title: string;
}

export const SavingsAnalysis = memo(({ data, title }: SavingsAnalysisProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis yAxisId="left" />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'savingsPercentage') {
                  return [`${value.toFixed(1)}%`, 'Pourcentage économisé'];
                }
                return [`${value.toFixed(2)} €`, name === 'originalPrice' ? 'Prix initial' : 
                                                name === 'finalPrice' ? 'Prix final' : 
                                                'Économies'];
              }}
            />
            <Legend />
            <Bar 
              dataKey="originalPrice" 
              fill="#8884d8" 
              yAxisId="left"
              name="Prix initial"
            />
            <Bar 
              dataKey="finalPrice" 
              fill="#82ca9d" 
              yAxisId="left"
              name="Prix final"
            />
            <Line
              type="monotone"
              dataKey="savingsPercentage"
              stroke="#ff7300"
              yAxisId="right"
              name="Pourcentage économisé"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});
