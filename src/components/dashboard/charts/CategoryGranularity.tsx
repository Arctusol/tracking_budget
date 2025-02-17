import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_HIERARCHY, CATEGORY_IDS, CATEGORY_NAMES } from "@/lib/fileProcessing/constants";
import { useEffect } from "react";

export type CategoryGranularityType = "main" | "all" | string;

interface CategoryGranularityProps {
  value: CategoryGranularityType;
  onChange: (value: CategoryGranularityType) => void;
  selectedFilter: string;
}

export function CategoryGranularity({ value, onChange, selectedFilter }: CategoryGranularityProps) {
  // Obtenir le nom de la catégorie pour l'affichage
  const getDisplayValue = (currentValue: string) => {
    if (currentValue === "main") return "Catégories principales uniquement";
    if (currentValue === "all") return "Afficher toutes les sous-catégories";
    return `${CATEGORY_NAMES[currentValue]} (avec toutes les sous-catégories)`;
  };

  const buildCategoryOptions = () => {
    const items: JSX.Element[] = [];

    if (selectedFilter === "all") {
      items.push(
        <SelectItem key="main" value="main">Catégories principales uniquement</SelectItem>,
        <SelectItem key="all" value="all">Afficher toutes les sous-catégories</SelectItem>
      );
    } else {
      const mainCategoryName = CATEGORY_NAMES[selectedFilter];
      const subCategories = CATEGORY_HIERARCHY[selectedFilter] || [];
      
      items.push(
        <SelectItem key={selectedFilter} value={selectedFilter} className="font-semibold">
          {mainCategoryName} (avec toutes les sous-catégories)
        </SelectItem>
      );

      subCategories.forEach(subCategoryId => {
        const subCategoryName = CATEGORY_NAMES[subCategoryId];
        if (subCategoryName) {
          items.push(
            <SelectItem key={subCategoryId} value={subCategoryId} className="pl-6">
              └ {subCategoryName}
            </SelectItem>
          );
        }
      });
    }

    return items;
  };

  // Initialiser la valeur par défaut
  useEffect(() => {
    if (selectedFilter !== "all" && (!value || value === "main")) {
      onChange(selectedFilter);
    }
  }, [selectedFilter]);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Détail des catégories:</span>
      <Select 
        value={value} 
        onValueChange={onChange}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder={getDisplayValue(value || "main")} />
        </SelectTrigger>
        <SelectContent>
          {buildCategoryOptions()}
        </SelectContent>
      </Select>
    </div>
  );
}
