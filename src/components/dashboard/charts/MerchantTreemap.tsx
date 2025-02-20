import { memo } from 'react';
import {
  Treemap,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Card } from '@/components/ui/card';

interface MerchantData {
  name: string;
  size: number;
  color: string;
  category: string;
}

interface MerchantTreemapProps {
  data: MerchantData[];
  title: string;
}

interface TreemapContentProps {
  root?: any;
  depth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: {
    color: string;
    name: string;
  };
  colors?: string[];
  rank?: number;
  name?: string;
}

const TreemapContent = memo(({
  depth = 0,
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
  name = '',
}: TreemapContentProps) => {
  if (!payload) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: payload.color || '#8884d8',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 && width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={14}
        >
          {name}
        </text>
      )}
    </g>
  );
});

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border rounded shadow">
        <p className="font-semibold">{data.name}</p>
        <p>Catégorie: {data.category}</p>
        <p>Total: {data.size.toFixed(2)} €</p>
      </div>
    );
  }
  return null;
};

export const MerchantTreemap = memo(({ data, title }: MerchantTreemapProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Aucune donnée disponible</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            aspectRatio={4/3}
            stroke="#fff"
            content={<TreemapContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});
