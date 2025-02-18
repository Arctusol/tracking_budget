import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { DashboardFilters, FilterOptions } from "@/components/dashboard/DashboardFilters";
import { TransactionEditTable } from "@/components/transactions/TransactionEditTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_HIERARCHY, getParentCategory } from "@/lib/fileProcessing/constants";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "all",
    period: "all",
  });
  const { user } = useAuth();

  const fetchTransactions = async () => {
    if (!user) return;

    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Édition des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <DashboardFilters 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              usedCategories={getUsedCategories}
            />
            <TransactionEditTable 
              transactions={filteredTransactions} 
              onTransactionUpdated={fetchTransactions} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
