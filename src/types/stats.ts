export type Trend = "up" | "down" | "neutral";

export interface Stat {
  name: string;
  value: string;
  trend: Trend;
}

export interface DashboardStats {
  balance: number;
  monthlyExpenses: number;
  transfersAmandine: number;
  transfersAntonin: number;
  incomes: number;
}
