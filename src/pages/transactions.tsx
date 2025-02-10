import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { DashboardFilters, FilterOptions } from "@/components/dashboard/DashboardFilters";
import { TransactionEditTable } from "@/components/transactions/TransactionEditTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

    // Filtre par recherche
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(
        (t) => t.description.toLowerCase().includes(searchLower)
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
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applyFilters(transactions, newFilters);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Édition des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />
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
