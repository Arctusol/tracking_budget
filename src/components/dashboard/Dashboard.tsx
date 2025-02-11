import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { StatsCards } from "./stats/StatsCards";
import { ExpenseByCategory } from "./charts/ExpenseByCategory";
import { IncomeByCategory } from "./charts/IncomeByCategory";
import { ExpenseOverTime } from "./charts/ExpenseOverTime";
import { TopExpenses } from "./charts/TopExpenses";
import { ExpenseList } from "./ExpenseList";
import { getCategoryName, getParentCategory, CATEGORY_HIERARCHY, CATEGORY_IDS, CATEGORY_NAMES, CATEGORY_COLORS } from "@/lib/fileProcessing/constants";
import { DashboardFilters, FilterOptions } from "./DashboardFilters";
import { ChartGranularity, GranularityType } from "./charts/ChartGranularity";
import { CategoryGranularity, CategoryGranularityType } from "./charts/CategoryGranularity";
import { Transaction as TransactionType } from "@/types/transaction";
import { useCategoryGranularity } from "@/hooks/useCategoryGranularity";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { usePageVisibility } from "@/hooks/usePageVisibility";

interface Transaction extends TransactionType {
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<GranularityType>("month");
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    balance: 0,
    monthlyExpenses: 0,
    transfersAmandine: 0,
    transfersAntonin: 0,
  });
  const { filters, updateFilters } = usePersistedFilters('personal');
  const { user } = useAuth();
  const { categoryGranularity, handleGranularityChange } = useCategoryGranularity({
    onTransactionsLoaded: (data) => {
      setTransactions(data);
      applyFilters(data, filters);
    }
  });
  usePageVisibility();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      if (document.hidden) return;
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
      filtered = filtered.filter((t) => {
        const parentCategory = getParentCategory(t.category_id);
        return t.category_id === currentFilters.category || 
               (parentCategory === currentFilters.category) ||
               (CATEGORY_HIERARCHY[currentFilters.category]?.includes(t.category_id || ''));
      });
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
    const totalExpenses = filtered
      .filter((t: Transaction) => t.type === "expense")
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const balance = filtered
      .reduce((sum: number, t: Transaction) => {
        return sum + (t.type === "income" ? t.amount : -t.amount);
      }, 0);

    const transfersAmandine = filtered
      .filter((t: Transaction) => t.category_id === CATEGORY_IDS.TRANSFER_AMANDINE)
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const transfersAntonin = filtered
      .filter((t: Transaction) => t.category_id === CATEGORY_IDS.TRANSFER_ANTONIN)
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    setStats({
      balance,
      monthlyExpenses: totalExpenses,
      transfersAmandine,
      transfersAntonin,
    });
  };

  useEffect(() => {
    // Filtrer les transactions selon la sélection
    if (selectedCategory) {
      const filtered = filteredTransactions.filter(t => {
        const parentCategory = getParentCategory(t.category_id);
        return t.category_id === selectedCategory || 
               parentCategory === selectedCategory ||
               (CATEGORY_HIERARCHY[selectedCategory]?.includes(t.category_id || ''));
      });
      setDisplayedTransactions(filtered);
    } else {
      setDisplayedTransactions(filteredTransactions);
    }
  }, [selectedCategory, filteredTransactions]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    updateFilters(newFilters);
    applyFilters(transactions, newFilters);
  };

  const handleChartClick = (categoryName: string) => {
    // Trouver l'ID de la catégorie à partir du nom
    const categoryId = Object.entries(CATEGORY_NAMES).find(
      ([id, name]) => name === categoryName
    )?.[0];
    
    setSelectedCategory(categoryId || null);
  };

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const grouped = transactions.reduce((acc, transaction) => {
      let dateKey: string;
      const date = new Date(transaction.date);
      
      switch (granularity) {
        case "day":
          dateKey = date.toISOString().split('T')[0];
          break;
        case "week":
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          dateKey = startOfWeek.toISOString().split('T')[0];
          break;
        case "month":
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case "year":
          dateKey = `${date.getFullYear()}`;
          break;
      }

      if (!acc[dateKey]) {
        acc[dateKey] = {
          expenses: 0,
          income: 0
        };
      }

      if (transaction.type === "expense") {
        acc[dateKey].expenses += transaction.amount;
      } else {
        acc[dateKey].income += transaction.amount;
      }

      return acc;
    }, {} as Record<string, { expenses: number; income: number }>);

    return Object.entries(grouped).map(([date, values]) => ({
      date,
      expenses: values.expenses,
      income: values.income
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const aggregateTransactionsByCategory = (transactions: Transaction[], type: "expense" | "income") => {
    const filtered = transactions.filter((t) => t.type === type);
    if (filtered.length === 0) return {};

    return filtered.reduce((acc, t) => {
      if (!t.category_id) {
        const categoryName = "Non catégorisé";
        acc[categoryName] = (acc[categoryName] || 0) + t.amount;
        return acc;
      }

      let categoryId = t.category_id;
      
      // Si on est en mode "main", on remonte à la catégorie parente
      if (categoryGranularity === "main") {
        categoryId = getParentCategory(t.category_id) || t.category_id;
      }
      // Si une catégorie spécifique est sélectionnée, on l'utilise telle quelle
      else if (categoryGranularity !== "all") {
        categoryId = t.category_id;
      }

      const categoryName = getCategoryName(categoryId);
      acc[categoryName] = (acc[categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
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

  // Données pour le graphique des dépenses par catégorie
  const expensesByCategory = aggregateTransactionsByCategory(filteredTransactions, "expense");

  // Données pour le graphique des revenus par catégorie
  const incomesByCategory = aggregateTransactionsByCategory(filteredTransactions, "income");

  const categoryData = Object.entries(expensesByCategory).map(
    ([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Autre'],
    })
  );

  const incomeData = Object.entries(incomesByCategory).map(
    ([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Autre'],
    })
  );

  // Données pour le graphique d'évolution dans le temps
  const timeData = groupTransactionsByDate(filteredTransactions);

  // Données pour les principales dépenses
  const topExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({
      name: t.description,
      amount: t.amount,
    }));

  // Mise à jour du handler
  const handleCategoryGranularityChange = (value: CategoryGranularityType) => {
    handleGranularityChange(value, filters);
  };

  // Ajout de ces vérifications avant le return
  const hasIncomeData = Object.keys(incomesByCategory).length > 0;
  const hasExpenseData = Object.keys(expensesByCategory).length > 0;

  return (
    <div className="w-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Tableau de Bord SpendWise</h1>

        <DashboardFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <StatsCards stats={statsDisplay} />

        <div className="flex justify-end gap-4 mb-4">
          <CategoryGranularity 
            value={categoryGranularity} 
            onChange={handleCategoryGranularityChange}
            selectedFilter={filters.category}
          />
          <ChartGranularity value={granularity} onChange={setGranularity} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-4 mb-4">
          {hasExpenseData && (
            <ExpenseByCategory
              data={categoryData}
              title="Dépenses par catégorie"
              onChartClick={handleChartClick}
            />
          )}
          {hasIncomeData && (
            <IncomeByCategory
              data={incomeData}
              title="Revenus par catégorie"
              onChartClick={handleChartClick}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-4">
          <ExpenseOverTime
            data={timeData}
            title="Évolution des Dépenses et Revenus"
            granularity={granularity}
            showIncome={hasIncomeData}
          />
          {hasExpenseData && (
            <TopExpenses 
              data={topExpenses} 
              title="Top 5 des Dépenses"
              onItemClick={handleChartClick}
            />
          )}
        </div>

        <div className="mt-4">
          <ExpenseList 
            transactions={displayedTransactions} 
            members={profiles} 
          />
        </div>
      </div>
    </div>
  );
}
