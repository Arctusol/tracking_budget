import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ExpenseList } from "./ExpenseList";
import { ExpenseChart } from "./ExpenseChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrendingUp,
  Users,
  UserPlus,
  Plus,
} from "lucide-react";
import type { Transaction, Group, Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { AddMemberDialog } from '@/components/groups/AddMemberDialog';
import { DashboardFilters, FilterOptions } from "@/components/dashboard/DashboardFilters";
import { StatsCards } from '@/components/dashboard/stats/StatsCards';
import { CategoryGranularity, CategoryGranularityType } from '@/components/dashboard/charts/CategoryGranularity';
import { ChartGranularity, GranularityType } from '@/components/dashboard/charts/ChartGranularity';
import { ExpenseByCategory } from '@/components/dashboard/charts/ExpenseByCategory';
import { IncomeByCategory } from '@/components/dashboard/charts/IncomeByCategory';
import { ExpenseOverTime } from '@/components/dashboard/charts/ExpenseOverTime';
import { TopExpenses } from '@/components/dashboard/charts/TopExpenses';
import { getCategoryName, getParentCategory, CATEGORY_HIERARCHY, CATEGORY_IDS, CATEGORY_NAMES, CATEGORY_COLORS } from "@/lib/fileProcessing/constants";
import { AddGroupTransactionsDialog } from '../groups/AddGroupTransactionsDialog';
import { useCategoryGranularity } from '@/hooks/useCategoryGranularity';
import { usePersistedFilters } from '@/hooks/usePersistedFilters';
import { usePageVisibility } from '@/hooks/usePageVisibility';

type Trend = "up" | "down" | "neutral";

interface Stat {
  name: string;
  value: string;
  trend: Trend;
}

interface GroupStats {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  memberShares: Record<string, number>;
}

export function GroupDashboard() {
  const { groupId } = useParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({
    balance: 0,
    monthlyExpenses: 0,
    transfersAmandine: 0,
    transfersAntonin: 0,
  });
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<GranularityType>("month");
  const { categoryGranularity, handleGranularityChange } = useCategoryGranularity({
    onTransactionsLoaded: (data) => {
      setTransactions(data);
      applyFilters(data, filters);
    },
    groupId
  });
  const { filters, updateFilters } = usePersistedFilters('group', groupId);
  const [isAddTransactionsOpen, setIsAddTransactionsOpen] = useState(false);
  usePageVisibility();

  useEffect(() => {
    if (!groupId || document.hidden) return;
    loadGroupData();
  }, [groupId]);

  async function loadGroupData() {
    try {
      // Charger les informations du groupe
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(
            profiles(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);
      
      // Extraire les membres
      const memberProfiles = groupData.members
        .map((m: any) => m.profiles)
        .filter(Boolean);
      setMembers(memberProfiles);

      // Charger les transactions du groupe
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData);

      // Appel du filtrage sur l'ensemble des transactions du groupe
      applyFilters(transactionsData, filters);

    } catch (error) {
      console.error('Error loading group data:', error);
    }
  }

  // Mise à jour de la fonction applyFilters pour calculer les stats comme dans Dashboard.tsx
  const applyFilters = (transactions: Transaction[], currentFilters: FilterOptions) => {
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

    // Calcul des stats comme dans Dashboard.tsx
    const totalExpenses = filtered
      .filter((t: Transaction) => t.type === "expense")
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const totalIncome = filtered
      .filter((t: Transaction) => t.type === "income")
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
      transfersAntonin
    });
  };

  // Copie de aggregateTransactionsByCategory depuis Dashboard.tsx
  const aggregateTransactionsByCategory = (transactions: Transaction[], type: "expense" | "income") => {
    return transactions
      .filter((t) => t.type === type)
      .reduce((acc, t) => {
        if (!t.category_id) {
          const categoryName = "Non catégorisé";
          acc[categoryName] = (acc[categoryName] || 0) + t.amount;
          return acc;
        }
        if (categoryGranularity === "main") {
          const parentCategory = getParentCategory(t.category_id);
          if (parentCategory) {
            const parentName = getCategoryName(parentCategory);
            acc[parentName] = (acc[parentName] || 0) + t.amount;
          } else {
            const categoryName = getCategoryName(t.category_id);
            acc[categoryName] = (acc[categoryName] || 0) + t.amount;
          }
        } else if (categoryGranularity === "all") {
          const categoryName = getCategoryName(t.category_id);
          acc[categoryName] = (acc[categoryName] || 0) + t.amount;
        } else {
          const selectedCategory = categoryGranularity;
          const parentCategory = getParentCategory(t.category_id);
          if (selectedCategory === t.category_id) {
            const categoryName = getCategoryName(t.category_id);
            acc[categoryName] = (acc[categoryName] || 0) + t.amount;
          } else if (selectedCategory === parentCategory) {
            const categoryName = getCategoryName(t.category_id);
            acc[categoryName] = (acc[categoryName] || 0) + t.amount;
          }
        }
        return acc;
      }, {} as Record<string, number>);
  };

  // Copie de groupTransactionsByDate depuis Dashboard.tsx
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
        acc[dateKey] = { expenses: 0, income: 0 };
      }
      if (transaction.type === "expense") {
        acc[dateKey].expenses += transaction.amount;
      } else {
        acc[dateKey].income += transaction.amount;
      }
      return acc;
    }, {} as Record<string, { expenses: number; income: number }>);
    return Object.entries(grouped)
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    updateFilters(newFilters);
    if (newFilters.category !== filters.category) {
      if (newFilters.category === "all") {
        handleGranularityChange("all", filters);
      } else {
        handleGranularityChange(newFilters.category, newFilters);
      }
    }
    applyFilters(transactions, newFilters);
  };

  const handleChartClick = (categoryName: string) => {
    const categoryId = Object.entries(CATEGORY_NAMES).find(
      ([, name]) => name === categoryName
    )?.[0];
    setSelectedCategory(categoryId || null);
  };

  // Calcul des données pour les graphiques (copiés depuis Dashboard.tsx)
  const expensesByCategory = aggregateTransactionsByCategory(filteredTransactions, "expense");
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
  const timeData = groupTransactionsByDate(filteredTransactions);
  const topExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({
      name: t.description,
      amount: t.amount,
    }));

  // Modifions les vérifications pour être plus précises
  const hasIncomeData = Object.keys(incomesByCategory).length > 0;
  const hasExpenseData = Object.keys(expensesByCategory).length > 0;
  const hasTimeData = timeData.some(data => 
    (data.income > 0 && filters.category === "all") || 
    (data.expenses > 0 && filters.category === "all") ||
    (data.income > 0 && filters.category !== "all") ||
    (data.expenses > 0 && filters.category !== "all")
  );

  if (!group) return null;

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

  // Mise à jour du handler
  const handleCategoryGranularityChange = (value: CategoryGranularityType) => {
    handleGranularityChange(value, filters);
  };

  return (
    <div className="w-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">{group?.name}</h1>
            <div className="flex -space-x-2">
              {members.map((member) => (
                <Avatar key={member.id} className="border-2 border-background">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {member.full_name?.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsAddMemberOpen(true)} variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un membre
            </Button>
            <Button onClick={() => setIsAddTransactionsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter des transactions
            </Button>
          </div>
        </div>

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
            <>
              <ExpenseByCategory
                data={categoryData}
                title={`Dépenses par catégorie ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
                onChartClick={handleChartClick}
              />
              <TopExpenses 
                data={topExpenses} 
                title={`Top 5 des Dépenses ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
                onItemClick={handleChartClick}
              />
            </>
          )}
          {hasIncomeData && (
            <IncomeByCategory
              data={incomeData}
              title={`Revenus par catégorie ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
              onChartClick={handleChartClick}
            />
          )}
        </div>

        {hasTimeData && (
          <div className="w-full">
            <ExpenseOverTime
              data={timeData}
              title={`Évolution des ${hasExpenseData ? 'Dépenses' : ''} ${hasExpenseData && hasIncomeData ? 'et' : ''} ${hasIncomeData ? 'Revenus' : ''} ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
              granularity={granularity}
              showIncome={hasIncomeData}
              showExpenses={hasExpenseData}
            />
          </div>
        )}

        <ExpenseList transactions={transactions} members={members} />

        <AddMemberDialog
          groupId={groupId}
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          onMemberAdded={loadGroupData}
        />

        <AddGroupTransactionsDialog
          groupId={groupId}
          open={isAddTransactionsOpen}
          onOpenChange={setIsAddTransactionsOpen}
          onTransactionsAdded={loadGroupData}
        />
      </div>
    </div>
  );
}
