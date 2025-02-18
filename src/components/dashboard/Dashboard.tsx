import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ExpenseList } from "./ExpenseList";
import { getCategoryName, getParentCategory, CATEGORY_HIERARCHY, CATEGORY_IDS } from "@/lib/constants/constants";
import { DashboardFilters, FilterOptions } from "./DashboardFilters";
import { GranularityType } from "./charts/ChartGranularity";
import { CategoryGranularityType } from './charts/CategoryGranularity';
import { Transaction as TransactionType } from "@/types/transaction";
import { useCategoryGranularity } from "@/hooks/useCategoryGranularity";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { useChartData } from "@/hooks/useChartData";
import { useTransactionStats } from "@/hooks/useTransactionStats";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PieChartIcon, BarChart, Calendar } from "lucide-react";
import { BudgetPlanner } from "./budgeting/BudgetPlanner";
import { Overview } from "./tabs/Overview";
import { CategoryGranularity } from './charts/CategoryGranularity';
import { ChartGranularity } from './charts/ChartGranularity';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface DashboardProps {
  groupId?: string;
  onAddMember?: () => void;
  members?: Profile[];
  additionalActions?: React.ReactNode;
}

export function Dashboard({ 
  groupId, 
  onAddMember, 
  members = [], 
  additionalActions 
}: DashboardProps) {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<GranularityType>("month");
  const [displayedTransactions, setDisplayedTransactions] = useState<TransactionType[]>([]);
  
  const { user } = useAuth();
  const { filters, updateFilters } = usePersistedFilters(groupId ? 'group' : 'personal', groupId);
  const { categoryGranularity, handleGranularityChange } = useCategoryGranularity({
    onTransactionsLoaded: (data) => {
      setTransactions(data);
      applyFilters(data, filters);
    },
    groupId
  });
  usePageVisibility();

  // Utiliser les nouveaux hooks
  const stats = useTransactionStats(filteredTransactions);
  const chartData = useChartData(
    filteredTransactions,
    granularity,
    selectedCategory,
    filters,
    categoryGranularity
  );

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      if (document.hidden) return;
      
      let query = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (groupId) {
        // Mode groupe : afficher uniquement les transactions du groupe
        query = query.eq("group_id", groupId);
      } else {
        // Mode personnel : afficher uniquement les transactions personnelles (sans group_id)
        query = query
          .eq("created_by", user.id)
          .is("group_id", null);
      }

      const { data: transactionsData, error: transactionsError } = await query;

      if (transactionsError) {
        console.error("Error loading transactions:", transactionsError);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        return;
      }

      setTransactions(transactionsData || []);
      setProfiles(profilesData || []);
      applyFilters(transactionsData || [], filters);
    };

    fetchData();
  }, [user, groupId]);

  const applyFilters = (transactions: TransactionType[], currentFilters: FilterOptions) => {
    let filtered = [...transactions];

    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(
        (t) => t.description.toLowerCase().includes(searchLower)
      );
    }

    if (currentFilters.category && currentFilters.category !== "all") {
      filtered = filtered.filter((t) => {
        const parentCategory = getParentCategory(t.category_id);
        return t.category_id === currentFilters.category ||
               (parentCategory === currentFilters.category) ||
               (CATEGORY_HIERARCHY[currentFilters.category]?.includes(t.category_id || ''));
      });
    }

    if (currentFilters.startDate && currentFilters.endDate) {
      filtered = filtered.filter((t) => {
        const date = new Date(t.date);
        return date >= currentFilters.startDate! && date <= currentFilters.endDate!;
      });
    }

    setFilteredTransactions(filtered);
  };

  useEffect(() => {
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
    const categoryId = Object.entries(getCategoryName).find(
      ([, name]) => name === categoryName
    )?.[0];
    setSelectedCategory(categoryId || null);
  };

  // Nouvelle fonction pour obtenir les catégories utilisées
  const getUsedCategories = useMemo(() => {
    const usedCategoryIds = new Set<string>();
    
    transactions.forEach(transaction => {
      if (transaction.category_id) {
        usedCategoryIds.add(transaction.category_id);
        // Ajouter aussi la catégorie parente si elle existe
        const parentCategory = getParentCategory(transaction.category_id);
        if (parentCategory) {
          usedCategoryIds.add(parentCategory);
        }
      }
    });
    
    return Array.from(usedCategoryIds);
  }, [transactions]);

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-4">
        <DashboardFilters 
          filters={filters} 
          onFilterChange={handleFilterChange}
          usedCategories={getUsedCategories}
        />

        <div className="flex justify-end gap-4">
          <CategoryGranularity 
            value={categoryGranularity} 
            onChange={(value) => handleGranularityChange(value, filters)}
            selectedFilter={filters.category}
          />
          <ChartGranularity 
            value={granularity} 
            onChange={setGranularity} 
          />
        </div>
      </div>

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
            expensesByCategory={chartData.categoryData}
            incomesByCategory={chartData.incomeData}
            categoryGranularity={categoryGranularity}
            granularity={granularity}
            handleGranularityChange={setGranularity}
            handleChartClick={handleChartClick}
            handleCategoryGranularityChange={(value: CategoryGranularityType) => handleGranularityChange(value, filters)}
            filters={filters}
            stats={stats}
            timeData={chartData.timeData}
            topExpenses={chartData.topExpenses}
            hasIncomeData={chartData.hasIncomeData}
            hasExpenseData={chartData.hasExpenseData}
            hasTimeData={chartData.hasTimeData}
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
