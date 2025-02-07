import { ExpenseList } from "./ExpenseList";
import { ExpenseChart } from "./ExpenseChart";

const mockTransactions = [
  {
    id: "1",
    amount: 42.5,
    type: "expense",
    description: "Courses Carrefour",
    date: new Date(),
    category: "food",
    createdBy: "1",
    sharedWith: ["1", "2"],
    splitType: "equal",
  },
  {
    id: "2",
    amount: 2800,
    type: "income",
    description: "Salaire",
    date: new Date(),
    category: "salary",
    createdBy: "1",
    sharedWith: ["1"],
    splitType: "amount",
  },
];

const mockMembers = [
  {
    id: "1",
    name: "Marie",
    email: "marie@example.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=marie",
    role: "owner",
    joinedAt: new Date(),
  },
  {
    id: "2",
    name: "Thomas",
    email: "thomas@example.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=thomas",
    role: "member",
    joinedAt: new Date(),
  },
];

import {
  ArrowDownIcon,
  ArrowUpIcon,
  DollarSign,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    name: "Solde du Compte",
    value: "2 742,50 €",
    change: "+4,75%",
    trend: "up",
  },
  {
    name: "Revenus du Mois",
    value: "2 800,00 €",
    extra: "Marie",
    trend: "up",
  },
  {
    name: "Dépenses du Mois",
    value: "57,50 €",
    extra: "Partagées",
    trend: "down",
  },
  {
    name: "Part de Marie",
    value: "28,75 €",
    extra: "50% des dépenses",
    trend: "neutral",
  },
];

export function Dashboard() {
  return (
    <div className="w-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Tableau de Bord SpendWise</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-4 rounded-lg shadow">
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
              {stat.change && (
                <p
                  className={`text-sm mt-1 ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}
                >
                  {stat.change}
                </p>
              )}
              {stat.extra && (
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.extra}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ExpenseChart
            transactions={mockTransactions}
            type="expense"
            title="Dépenses par Catégorie"
          />
          <ExpenseChart
            transactions={mockTransactions}
            type="income"
            title="Revenus par Catégorie"
          />
        </div>

        <ExpenseList transactions={mockTransactions} members={mockMembers} />
      </div>
    </div>
  );
}
