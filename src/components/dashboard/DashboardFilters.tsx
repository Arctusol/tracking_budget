import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter } from "lucide-react";
import { CATEGORY_IDS, getCategoryName, CATEGORY_HIERARCHY } from "@/lib/constants/constants";

export interface FilterOptions {
  search: string;
  category: string;
  period: string;
  startDate?: Date;
  endDate?: Date;
  groupFilter?: 'all' | 'grouped' | 'ungrouped';
}

interface DashboardFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  filters: FilterOptions;
  usedCategories: string[]; // Nouvelle prop
}

export function DashboardFilters({ onFilterChange, filters, usedCategories }: DashboardFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({ ...filters, category: value });
  };

  const handlePeriodChange = (value: string) => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    switch (value) {
      case "this-month":
        startDate = firstDayOfMonth;
        endDate = now;
        break;
      case "last-month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "last-3-months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        endDate = now;
        break;
      case "this-year":
        startDate = firstDayOfYear;
        endDate = now;
        break;
      case "all":
        startDate = undefined;
        endDate = undefined;
        break;
    }

    onFilterChange({
      ...filters,
      period: value,
      startDate,
      endDate,
    });
  };

  // Liste des catégories principales (sans les sous-catégories)
  const mainCategories = [
    // Catégories de dépenses
    { id: CATEGORY_IDS.FOOD, name: "Alimentation" },
    { id: CATEGORY_IDS.TRANSPORT, name: "Transport" },
    { id: CATEGORY_IDS.HOUSING, name: "Logement" },
    { id: CATEGORY_IDS.LEISURE, name: "Loisirs" },
    { id: CATEGORY_IDS.HEALTH, name: "Santé" },
    { id: CATEGORY_IDS.SHOPPING, name: "Shopping" },
    { id: CATEGORY_IDS.SERVICES, name: "Services" },
    { id: CATEGORY_IDS.EDUCATION, name: "Éducation" },
    { id: CATEGORY_IDS.GIFTS, name: "Cadeaux" },
    { id: CATEGORY_IDS.VETERINARY, name: "Vétérinaire" },
    { id: CATEGORY_IDS.INSURANCE, name: "Assurance" },
    { id: CATEGORY_IDS.INTERNET, name: "Internet" },
    { id: CATEGORY_IDS.SUBSCRIPTIONS, name: "Abonnements" },
    { id: CATEGORY_IDS.OTHER, name: "Autre" },
    // Catégories de revenus
    { id: CATEGORY_IDS.INCOME, name: "Revenus" },
    { id: CATEGORY_IDS.SALARY, name: "Salaire" },
    { id: CATEGORY_IDS.FREELANCE, name: "Freelance" },
    { id: CATEGORY_IDS.REIMBURSEMENTS, name: "Remboursements" },
    // Catégories de virements
    { id: CATEGORY_IDS.TRANSFERS, name: "Virements" }
  ];

  // Filtrer les catégories principales pour n'inclure que celles qui sont utilisées
  const filteredMainCategories = mainCategories.filter(category => {
    if (usedCategories.includes(category.id)) return true;
    
    // Vérifier si une sous-catégorie est utilisée
    const subCategories = CATEGORY_HIERARCHY[category.id] || [];
    return subCategories.some(subCatId => usedCategories.includes(subCatId));
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input 
              placeholder="Rechercher..." 
              className="pl-4"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Select 
            value={filters.category}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {filteredMainCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={filters.period}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="this-month">Ce mois</SelectItem>
              <SelectItem value="last-month">Mois dernier</SelectItem>
              <SelectItem value="last-3-months">3 derniers mois</SelectItem>
              <SelectItem value="this-year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={filters.groupFilter || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, groupFilter: value as 'all' | 'grouped' | 'ungrouped' })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les transactions</SelectItem>
              <SelectItem value="grouped">En groupe</SelectItem>
              <SelectItem value="ungrouped">Hors groupe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
