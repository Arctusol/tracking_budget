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