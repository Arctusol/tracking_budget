import { useState, useEffect } from 'react';
import { FilterOptions } from '@/components/dashboard/DashboardFilters';

const defaultFilters: FilterOptions = {
  search: "",
  category: "all",
  period: "all",
};

export function usePersistedFilters(dashboardType: 'personal' | 'group', groupId?: string) {
  const storageKey = groupId 
    ? `dashboard-filters-group-${groupId}` 
    : 'dashboard-filters-personal';

  // Fonction pour charger les filtres depuis localStorage
  const loadPersistedFilters = (): FilterOptions => {
    const savedFilters = localStorage.getItem(storageKey);
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      // Convertir les dates string en objets Date
      if (parsedFilters.startDate) {
        parsedFilters.startDate = new Date(parsedFilters.startDate);
      }
      if (parsedFilters.endDate) {
        parsedFilters.endDate = new Date(parsedFilters.endDate);
      }
      return parsedFilters;
    }
    return defaultFilters;
  };

  const [filters, setFilters] = useState<FilterOptions>(loadPersistedFilters());

  // Sauvegarder les filtres dans localStorage quand ils changent
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(filters));
  }, [filters, storageKey]);

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return {
    filters,
    updateFilters,
  };
} 