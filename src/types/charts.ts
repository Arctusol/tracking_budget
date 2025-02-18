// Types de base pour les données des graphiques
export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  total?: number;
}

// Types pour les graphiques en camembert
export interface PieChartData extends ChartDataPoint {}

// Types pour les graphiques temporels
export interface TimeChartDataPoint {
  date: string;
  expenses: number;
  income: number;
  [key: string]: number | string;
}

// Props génériques pour les graphiques
export interface BaseChartProps<T> {
  data: T[];
  title: string;
}

// Props spécifiques pour les graphiques en camembert
export interface PieChartProps extends BaseChartProps<PieChartData> {
  onChartClick?: (category: string) => void;
}

// Props pour les graphiques de dépenses/revenus
export interface CategoryChartProps extends PieChartProps {
  className?: string;
  showPercentage?: boolean;
}

// Types pour les tooltips
export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
}

// Types pour les légendes personnalisées
export interface ChartLegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

// Types pour les formes actives
export interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: ChartDataPoint;
  percent: number;
  value: number;
}
