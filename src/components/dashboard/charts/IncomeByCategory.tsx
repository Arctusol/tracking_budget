import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Label,
  Sector
} from "recharts";
import { useState, useCallback } from "react";
import type { CategoryChartProps, ChartTooltipProps, ChartLegendProps, ActiveShapeProps } from "@/types/charts";

const renderActiveShape = (props: ActiveShapeProps) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload[0].payload.total;
    return (
      <div className="bg-white p-2 border rounded shadow-lg">
        <p className="font-semibold">{data.name}</p>
        <p>
          {data.value.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR"
          })}
        </p>
        <p className="text-sm text-gray-600">
          {`${(data.value / total * 100).toFixed(1)}% du total`}
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: ChartLegendProps) => {
  if (!payload) return null;
  
  return (
    <ul className="flex flex-wrap justify-center gap-2 mt-4">
      {payload.map((entry, index) => (
        <li
          key={`item-${index}`}
          className="flex items-center gap-1 text-sm px-2 py-1 rounded-full"
          style={{ backgroundColor: `${entry.color}20` }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
};

export function IncomeByCategory({ data, title, onChartClick }: CategoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>();

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleClick = (entry: any) => {
    if (onChartClick) {
      onChartClick(entry.name);
    }
  };

  // Filtrer les données pour n'inclure que les catégories avec des valeurs
  const filteredData = data.filter(item => item.value > 0);

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              onClick={handleClick}
              onMouseEnter={onPieEnter}
              onMouseLeave={() => setActiveIndex(undefined)}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              style={{ cursor: 'pointer' }}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="transition-all duration-200"
                />
              ))}
              <Label
                value={`${total.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0
                })}`}
                position="center"
                className="font-semibold"
              />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
