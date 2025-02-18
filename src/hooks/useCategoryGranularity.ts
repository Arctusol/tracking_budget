import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FilterOptions } from '@/components/dashboard/DashboardFilters';
import { CategoryGranularityType } from '@/components/dashboard/charts/CategoryGranularity';
import { CATEGORY_HIERARCHY } from '@/lib/constants/constants';

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
      if (granularity === "main") {
        // Si on est en mode "catégories principales", inclure la catégorie principale et ses sous-catégories
        const subCategories = CATEGORY_HIERARCHY[filters.category] || [];
        query = query.in("category_id", [filters.category, ...subCategories]);
      } else if (granularity === "all") {
        // Si on veut toutes les sous-catégories, même comportement que "main"
        const subCategories = CATEGORY_HIERARCHY[filters.category] || [];
        query = query.in("category_id", [filters.category, ...subCategories]);
      } else if (granularity === filters.category) {
        // Si on sélectionne la catégorie principale elle-même
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
    await fetchTransactions(currentFilters, value);
  }, [fetchTransactions]);

  return {
    categoryGranularity,
    handleGranularityChange
  };
}