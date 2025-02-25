import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { DashboardFilters, FilterOptions } from "@/components/dashboard/DashboardFilters";
import { TransactionEditTable } from "@/components/transactions/TransactionEditTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_HIERARCHY, CATEGORY_NAMES, getParentCategory } from "@/lib/constants/constants";
import { ExportButton } from "@/components/common/ExportButton";

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
  group_id?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "all",
    period: "all",
    groupFilter: "all",
  });
  const { user } = useAuth();

  const fetchTransactions = async () => {
    if (!user) return;

    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select(`
        id,
        amount,
        type,
        description,
        date,
        category_id,
        created_by,
        group_id
      `)
      .order("date", { ascending: false });

    if (transactionsError) {
      console.error("Error loading transactions:", transactionsError);
      return;
    }

    const transactions = transactionsData || [];
    setTransactions(transactions);
    applyFilters(transactions, filters);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const applyFilters = (transactions: Transaction[], currentFilters: FilterOptions) => {
    let filtered = [...transactions];

    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(
        (t) => t.description.toLowerCase().includes(searchLower)
      );
    }

    if (currentFilters.groupFilter && currentFilters.groupFilter !== 'all') {
      filtered = filtered.filter((t) => {
        if (currentFilters.groupFilter === 'grouped') {
          return t.group_id !== null;
        } else {
          return t.group_id === null;
        }
      });
    }

    if (currentFilters.category && currentFilters.category !== "all") {
      filtered = filtered.filter((t) => {
        if (!t.category_id) return false;
        
        // Si la catégorie sélectionnée est une catégorie parente
        if (CATEGORY_HIERARCHY[currentFilters.category]) {
          // Inclure les transactions de la catégorie parente et de ses sous-catégories
          return t.category_id === currentFilters.category || 
                 CATEGORY_HIERARCHY[currentFilters.category].includes(t.category_id);
        }
        
        // Si c'est une sous-catégorie, vérifier directement
        return t.category_id === currentFilters.category;
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

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applyFilters(transactions, newFilters);
  };

  // Fonction pour obtenir les catégories utilisées
  const getUsedCategories = useMemo(() => {
    const usedCategoryIds = new Set<string>();
    transactions.forEach((transaction) => {
      if (transaction.category_id) {
        usedCategoryIds.add(transaction.category_id);
      }
    });
    return Array.from(usedCategoryIds);
  }, [transactions]);

  // Préparer les données pour l'export
  const exportData = useMemo(() => {
    return filteredTransactions.map(transaction => ({
      Date: new Date(transaction.date).toLocaleDateString(),
      Description: transaction.description,
      Amount: transaction.amount,
      Type: transaction.type,
      Category: transaction.category_id ? CATEGORY_NAMES[transaction.category_id] : "",
      "Parent Category": transaction.category_id ? CATEGORY_NAMES[getParentCategory(transaction.category_id) || ""] : ""
    }));
  }, [filteredTransactions]);

  return (
    <div className="container mx-auto py-10 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Transactions</CardTitle>
          <ExportButton 
            data={exportData}
            filename={`transactions_${new Date().toISOString().split("T")[0]}`}
          />
        </CardHeader>
        <CardContent>
          <DashboardFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            usedCategories={getUsedCategories}
          />
          <TransactionEditTable 
            transactions={filteredTransactions} 
            onTransactionUpdated={fetchTransactions} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
