import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_HIERARCHY, CATEGORY_IDS, CATEGORY_NAMES } from "@/lib/fileProcessing/constants";

export type CategoryGranularityType = "main" | "all" | string;

interface CategoryGranularityProps {
  value: CategoryGranularityType;
  onChange: (value: CategoryGranularityType) => void;
  selectedFilter: string;
}

export function CategoryGranularity({ value, onChange, selectedFilter }: CategoryGranularityProps) {
  const buildCategoryOptions = () => {
    const items: JSX.Element[] = [];

    if (selectedFilter === "all") {
      // Options de base
      items.push(
        <SelectItem key="main" value="main">Catégories principales uniquement</SelectItem>,
        <SelectItem key="all" value="all">Afficher toutes les sous-catégories</SelectItem>
      );

      // Ajouter toutes les catégories principales et leurs sous-catégories
      Object.entries(CATEGORY_HIERARCHY).forEach(([mainCategoryId, subCategories]) => {
        const mainCategoryName = CATEGORY_NAMES[mainCategoryId];
        if (mainCategoryName) {
          items.push(
            <SelectItem key={mainCategoryId} value={mainCategoryId} className="font-semibold">
              {mainCategoryName}
            </SelectItem>
          );

          // Ajouter les sous-catégories avec une indentation
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
      });
    } else {
      // Si une catégorie principale est sélectionnée dans le filtre
      const mainCategoryName = CATEGORY_NAMES[selectedFilter];
      const subCategories = CATEGORY_HIERARCHY[selectedFilter] || [];
      
      // Options de base pour la catégorie sélectionnée
      items.push(
        <SelectItem key="main" value="main">Catégories principales uniquement</SelectItem>,
        <SelectItem key={selectedFilter} value={selectedFilter} className="font-semibold">
          {mainCategoryName} (toutes les sous-catégories)
        </SelectItem>
      );

      // Ajouter les sous-catégories avec une indentation
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

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Détail des catégories:</span>
      <Select 
        value={value} 
        onValueChange={onChange}
        defaultValue="main"
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Catégories principales uniquement" />
        </SelectTrigger>
        <SelectContent>
          {buildCategoryOptions()}
        </SelectContent>
      </Select>
    </div>
  );
}
