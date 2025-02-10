import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { StatsCards } from "./stats/StatsCards";
import { ExpenseByCategory } from "./charts/ExpenseByCategory";
import { ExpenseOverTime } from "./charts/ExpenseOverTime";
import { TopExpenses } from "./charts/TopExpenses";
import { ExpenseList } from "./ExpenseList";
import { getCategoryName } from "@/lib/fileProcessing/constants";
import { DashboardFilters, FilterOptions } from "./DashboardFilters";

interface Transaction {
  id: string;
  amount: number;
  type: "expense" | "income";
  description: string;
  date: string;
  category_id?: string;
  created_by: string;
  shared_with?: string[];
  split_type?: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

type Trend = "up" | "down" | "neutral";

interface Stat {
  name: string;
  value: string;
  trend: Trend;
}

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    userShare: 0,
  });
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "all",
    period: "all",
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Charger les transactions
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });

      if (transactionsError) {
        console.error("Error loading transactions:", transactionsError);
        return;
      }

      // Charger les profils
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        return;
      }

      const transactions = transactionsData || [];
      const profiles = profilesData || [];

      setTransactions(transactions);
      setProfiles(profiles);
      applyFilters(transactions, filters);
    };

    fetchData();
  }, [user]);

  const applyFilters = (transactions: Transaction[], currentFilters: FilterOptions) => {
    let filtered = [...transactions];

    // Filtre par recherche
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par catégorie
    if (currentFilters.category && currentFilters.category !== "all") {
      filtered = filtered.filter((t) => t.category_id === currentFilters.category);
    }

    // Filtre par période
    if (currentFilters.startDate && currentFilters.endDate) {
      filtered = filtered.filter((t) => {
        const date = new Date(t.date);
        return date >= currentFilters.startDate! && date <= currentFilters.endDate!;
      });
    }

    setFilteredTransactions(filtered);

    // Mettre à jour les statistiques
    const totalIncome = filtered
      .filter((t: Transaction) => t.type === "income")
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const totalExpenses = filtered
      .filter((t: Transaction) => t.type === "expense")
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const balance = totalIncome - totalExpenses;

    const userExpenses = filtered
      .filter(
        (t: Transaction) => t.type === "expense" && t.created_by === user?.id,
      )
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    setStats({
      balance,
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      userShare: userExpenses,
    });
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applyFilters(transactions, newFilters);
  };

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
      name: "Revenus Totaux",
      value: stats.monthlyIncome.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "up",
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
      name: "Mes Dépenses",
      value: stats.userShare.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "neutral",
    },
  ];

  // Données pour le graphique des dépenses par catégorie
  const expensesByCategory = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const categoryName = getCategoryName(t.category_id);
        acc[categoryName] = (acc[categoryName] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  const categoryColors = {
    'Alimentation': "#ef4444",
    'Transport': "#f97316",
    'Logement': "#22c55e",
    'Loisirs': "#3b82f6",
    'Santé': "#8b5cf6",
    'Shopping': "#ec4899",
    'Services': "#14b8a6",
    'Éducation': "#f59e0b",
    'Cadeaux': "#6366f1",
    'Vétérinaire': "#8b5cf6",
    'Assurance': "#06b6d4",
    'Internet': "#0ea5e9",
    'Abonnements': "#10b981",
    'Non catégorisé': "#64748b",
    'Autre': "#94a3b8"
  };

  const categoryData = Object.entries(expensesByCategory).map(
    ([name, value]) => ({
      name,
      value,
      color: categoryColors[name as keyof typeof categoryColors] || "#64748b",
    }),
  );

  // Données pour le graphique d'évolution dans le temps
  const timeData = filteredTransactions.reduce(
    (acc, t) => {
      const date = t.date.split("T")[0];
      const existing = acc.find((d) => d.date === date);
      if (existing) {
        if (t.type === "expense") existing.expenses += t.amount;
        if (t.type === "income") existing.income += t.amount;
      } else {
        acc.push({
          date,
          expenses: t.type === "expense" ? t.amount : 0,
          income: t.type === "income" ? t.amount : 0,
        });
      }
      return acc;
    },
    [] as Array<{ date: string; expenses: number; income: number }>,
  );

  // Données pour les principales dépenses
  const topExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({
      name: t.description,
      amount: t.amount,
    }));

  return (
    <div className="w-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Tableau de Bord SpendWise</h1>

        <DashboardFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <StatsCards stats={statsDisplay} />

        <div className="grid gap-6 md:grid-cols-2">
          <ExpenseByCategory
            data={categoryData}
            title="Dépenses par Catégorie"
          />
          <ExpenseOverTime
            data={timeData}
            title="Évolution des Dépenses et Revenus"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TopExpenses data={topExpenses} title="Top 5 des Dépenses" />
          <ExpenseList transactions={filteredTransactions} members={profiles} />
        </div>
      </div>
    </div>
  );
}
