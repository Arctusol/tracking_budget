import { Stat, DashboardStats } from "@/types/stats";
import { StatsCards } from "./StatsCards";

interface StatsDisplayProps {
  stats: DashboardStats;
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  const statsDisplay: Stat[] = [
    {
      name: "Solde actuel",
      value: stats.balance.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: stats.balance >= 0 ? "up" : "down",
    },
    {
      name: "Dépenses globales",
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
      trend: "up",
    },
    {
      name: "Virements Antonin",
      value: stats.transfersAntonin.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "up",
    },
    {
      name: "Revenus",
      value: stats.incomes.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "up",
    },
  ];

  return <StatsCards stats={statsDisplay} />;
}
