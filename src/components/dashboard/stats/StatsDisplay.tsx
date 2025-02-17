import { Stat, DashboardStats } from "@/types/stats";
import { StatsCards } from "./StatsCards";

interface StatsDisplayProps {
  stats: DashboardStats;
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  const statsDisplay: Stat[] = [
    {
      name: "Solde Global",
      value: stats.balance.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: stats.balance >= 0 ? "up" : "down",
    },
    {
      name: "Dépenses Totales",
      value: stats.monthlyExpenses.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "down",
    },
    {
      name: "Virements Amandine",
      value: stats.transfersAmandine.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "neutral",
    },
    {
      name: "Virements Antonin",
      value: stats.transfersAntonin.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "neutral",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCards stats={statsDisplay} />
    </div>
  );
}
