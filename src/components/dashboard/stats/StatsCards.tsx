import { Card } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, TrendingUp } from "lucide-react";

interface Stat {
  name: string;
  value: string;
  trend: "up" | "down" | "neutral";
}

interface StatsCardsProps {
  stats: Stat[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.name} className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{stat.name}</p>
            {stat.trend === "up" && (
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
            )}
            {stat.trend === "down" && (
              <ArrowDownIcon className="h-4 w-4 text-red-500" />
            )}
            {stat.trend === "neutral" && (
              <TrendingUp className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <p className="text-2xl font-bold mt-2">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}
