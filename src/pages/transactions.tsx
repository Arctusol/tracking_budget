import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { DashboardFilters, FilterOptions } from "@/components/dashboard/DashboardFilters";
import { TransactionEditTable } from "@/components/transactions/TransactionEditTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_HIERARCHY, CATEGORY_NAMES, getParentCategory } from "@/lib/constants/constants";
import { ExportButton } from "@/components/common/ExportButton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchTransactions = useCallback(async (pageNumber = 0, append = false) => {
    if (!user) return;
    setIsLoading(true);

    try {
      let query = supabase
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

      // Appliquer les filtres côté serveur quand c'est possible
      if (filters.category && filters.category !== "all") {
        if (CATEGORY_HIERARCHY[filters.category]) {
          // Pour les catégories parentes, inclure toutes les sous-catégories
          const categoryIds = [filters.category, ...CATEGORY_HIERARCHY[filters.category]];
          query = query.in('category_id', categoryIds);
        } else {
          // Pour les sous-catégories
          query = query.eq('category_id', filters.category);
        }
      }

      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate).toISOString().split('T')[0];
        const endDate = new Date(filters.endDate).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }

      if (filters.groupFilter && filters.groupFilter !== 'all') {
        if (filters.groupFilter === 'grouped') {
          query = query.not('group_id', 'is', null);
        } else {
          query = query.is('group_id', null);
        }
      }

      // Appliquer la pagination
      const { data: transactionsData, error: transactionsError } = await query
        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

      if (transactionsError) {
        console.error("Error loading transactions:", transactionsError);
        return;
      }

      const newTransactions = transactionsData || [];
      
      // Vérifier s'il y a plus de transactions à charger
      setHasMore(newTransactions.length === PAGE_SIZE);
      
      if (append) {
        setTransactions(prev => {
          const updatedTransactions = [...prev, ...newTransactions];
          
          // Appliquer les filtres côté client pour les filtres qui ne peuvent pas être appliqués côté serveur
          let filtered = [...updatedTransactions];
          
          // Filtre de recherche (toujours côté client)
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
              (t) => t.description.toLowerCase().includes(searchLower)
            );
          }
          
          setFilteredTransactions(filtered);
          return updatedTransactions;
        });
      } else {
        setTransactions(newTransactions);
        
        // Appliquer les filtres côté client pour les filtres qui ne peuvent pas être appliqués côté serveur
        let filtered = [...newTransactions];
        
        // Filtre de recherche (toujours côté client)
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (t) => t.description.toLowerCase().includes(searchLower)
          );
        }
        
        setFilteredTransactions(filtered);
      }
    } catch (error) {
      console.error("Error in fetchTransactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  const loadMoreTransactions = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, true);
  }, [page, fetchTransactions]);

  useEffect(() => {
    // Charger uniquement la première page au montage du composant
    fetchTransactions(0, false);
  }, [fetchTransactions]);

  // Réinitialiser la pagination et recharger les données lorsque les filtres changent
  useEffect(() => {
    setPage(0);
    fetchTransactions(0, false);
  }, [filters, fetchTransactions]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // La récupération des données sera déclenchée par l'effet ci-dessus
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
            onTransactionUpdated={() => fetchTransactions(0, false)} 
          />
          
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={loadMoreTransactions} 
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  "Charger plus de transactions"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
