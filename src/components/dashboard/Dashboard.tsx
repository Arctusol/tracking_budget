import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ExpenseList } from "./ExpenseList";
import { getCategoryName, getParentCategory, CATEGORY_HIERARCHY, CATEGORY_IDS, CATEGORY_NAMES } from "@/lib/fileProcessing/constants";
import { DashboardFilters, FilterOptions } from "./DashboardFilters";
import { GranularityType } from "./charts/ChartGranularity";
import { CategoryGranularityType } from './charts/CategoryGranularity';
import { Transaction as TransactionType } from "@/types/transaction";
import { DashboardStats } from "@/types/stats";
import { useCategoryGranularity } from "@/hooks/useCategoryGranularity";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PieChartIcon, BarChart, Calendar } from "lucide-react";
import { BudgetPlanner } from "./budgeting/BudgetPlanner";
import { Overview } from "./tabs/Overview";

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

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<GranularityType>("month");
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
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
          .eq("created_by", user.id)
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

  // Données pour le graphique des dépenses par catégorie
  const expensesByCategory = aggregateTransactionsByCategory(filteredTransactions, "expense");

  // Données pour le graphique des revenus par catégorie
  const incomesByCategory = aggregateTransactionsByCategory(filteredTransactions, "income");


  return (
    <div className="container mx-auto p-4">
      <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <PieChartIcon className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <BarChart className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="budget">
            <Calendar className="w-4 h-4 mr-2" />
            Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Overview
            filteredTransactions={filteredTransactions}
            expensesByCategory={expensesByCategory}
            incomesByCategory={incomesByCategory}
            categoryGranularity={categoryGranularity}
            granularity={granularity}
            handleGranularityChange={setGranularity}
            handleChartClick={handleChartClick}
            handleCategoryGranularityChange={(value: CategoryGranularityType) => handleGranularityChange(value, filters)}
            filters={filters}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <ExpenseList
            transactions={displayedTransactions}
            members={profiles}
          />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetPlanner
            transactions={filteredTransactions.filter(t => {
              if (t.type !== 'expense') return false;
              const parentCategory = getParentCategory(t.category_id);
              const categoryId = parentCategory || t.category_id;
              return categoryId !== CATEGORY_IDS.INCOME && 
                     categoryId !== CATEGORY_IDS.TRANSFERS;
            })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
