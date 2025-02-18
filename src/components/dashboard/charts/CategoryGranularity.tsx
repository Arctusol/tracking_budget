import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_HIERARCHY, CATEGORY_NAMES } from "@/lib/fileProcessing/constants";
import { useEffect, useState } from "react";
import { getUsedCategories } from "@/lib/services/transaction.service";
import { useAuth } from "@/lib/auth";

export type CategoryGranularityType = "main" | "all" | string;

interface CategoryGranularityProps {
  value: CategoryGranularityType;
  onChange: (value: CategoryGranularityType) => void;
  selectedFilter: string;
}

export function CategoryGranularity({ value, onChange, selectedFilter }: CategoryGranularityProps) {
  const { user } = useAuth();
  const [usedCategories, setUsedCategories] = useState<string[]>([]);

  // Réinitialiser la granularité quand on change de filtre
  useEffect(() => {
    if (selectedFilter === "all") {
      if (value !== "main" && value !== "all") {
        onChange("main");
      }
    } else {
      // Si une catégorie principale est sélectionnée, on affiche directement cette catégorie avec ses sous-catégories
      if (value === "main") {
        onChange(selectedFilter);
      }
    }
  }, [selectedFilter, value, onChange]);

  useEffect(() => {
    const fetchUsedCategories = async () => {
      if (user) {
        try {
          const categories = await getUsedCategories(user.id);
          setUsedCategories(categories);
        } catch (error) {
          console.error("Erreur lors de la récupération des catégories utilisées:", error);
        }
      }
    };

    fetchUsedCategories();
  }, [user]);

  // Obtenir le nom de la catégorie pour l'affichage
  const getDisplayValue = (currentValue: string) => {
    if (currentValue === "main") return "Catégories principales uniquement";
    if (currentValue === "all") return "Afficher toutes les sous-catégories";
    return CATEGORY_NAMES[currentValue] ? `${CATEGORY_NAMES[currentValue]} uniquement` : "Sélectionner une granularité";
  };

  const buildCategoryOptions = () => {
    const items: JSX.Element[] = [];

    if (selectedFilter === "all") {
      items.push(
        <SelectItem key="main" value="main">Catégories principales uniquement</SelectItem>,
        <SelectItem key="all" value="all">Afficher toutes les sous-catégories</SelectItem>
      );
    } else if (usedCategories.includes(selectedFilter)) {
      // Ajouter l'option pour la catégorie principale sélectionnée
      items.push(
        <SelectItem key={selectedFilter} value={selectedFilter} className="font-semibold">
          {CATEGORY_NAMES[selectedFilter]} (avec sous-catégories)
        </SelectItem>
      );

      // Filtrer les sous-catégories pour n'afficher que celles qui sont utilisées
      const subCategories = CATEGORY_HIERARCHY[selectedFilter] || [];
      subCategories
        .filter(subCategoryId => usedCategories.includes(subCategoryId))
        .forEach(subCategoryId => {
          const subCategoryName = CATEGORY_NAMES[subCategoryId];
          if (subCategoryName) {
            items.push(
              <SelectItem key={subCategoryId} value={subCategoryId} className="pl-6">
                └ {subCategoryName} uniquement
              </SelectItem>
            );
          }
        });
    }

    return items;
  };

  return (
    <div className="flex items-center space-x-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Sélectionner une granularité">
            {getDisplayValue(value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {buildCategoryOptions()}
        </SelectContent>
      </Select>
    </div>
  );
}
