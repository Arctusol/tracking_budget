import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FilterOptions } from '@/components/dashboard/DashboardFilters';
import { CategoryGranularityType } from '@/components/dashboard/charts/CategoryGranularity';
import { CATEGORY_HIERARCHY } from '@/lib/fileProcessing/constants';

interface UseCategoryGranularityProps {
  onTransactionsLoaded: (transactions: any[]) => void;
  groupId?: string;
}

export function useCategoryGranularity({ onTransactionsLoaded, groupId }: UseCategoryGranularityProps) {
  const [categoryGranularity, setCategoryGranularity] = useState<CategoryGranularityType>("main");

  const fetchTransactions = useCallback(async (filters: FilterOptions, granularity: CategoryGranularityType) => {
    let query = supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });

    // Ajouter le filtre de groupe si nécessaire
    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    // Appliquer les filtres
    if (filters.category && filters.category !== "all") {
      if (granularity === filters.category) {
        // Si on sélectionne la catégorie principale, inclure toutes les sous-catégories
        const subCategories = CATEGORY_HIERARCHY[filters.category] || [];
        query = query.in("category_id", [filters.category, ...subCategories]);
      } else {
        // Pour une sous-catégorie spécifique
        query = query.eq("category_id", granularity);
      }
    }

    // Appliquer les filtres de date
    if (filters.startDate) {
      query = query.gte("date", filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte("date", filters.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading transactions:", error);
      return;
    }

    onTransactionsLoaded(data || []);
  }, [groupId, onTransactionsLoaded]);

  const handleGranularityChange = useCallback(async (value: CategoryGranularityType, currentFilters: FilterOptions) => {
    setCategoryGranularity(value);
    
    // Si la valeur n'est ni "main" ni "all", c'est une catégorie spécifique
    if (value !== "main" && value !== "all") {
      const newFilters = {
        ...currentFilters,
        category: value
      };
      await fetchTransactions(newFilters, value);
    } else {
      await fetchTransactions(currentFilters, value);
    }
  }, [fetchTransactions]);

  return {
    categoryGranularity,
    handleGranularityChange,
    fetchTransactions
  };
} 