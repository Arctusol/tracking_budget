import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_HIERARCHY, CATEGORY_IDS, CATEGORY_NAMES } from "@/lib/fileProcessing/constants";

export type CategoryGranularityType = string;

interface CategoryGranularityProps {
  value: CategoryGranularityType;
  onChange: (value: CategoryGranularityType) => void;
  selectedFilter: string;
}

export function CategoryGranularity({ value, onChange, selectedFilter }: CategoryGranularityProps) {
  const buildCategoryOptions = () => {
    const items: JSX.Element[] = [];

    if (selectedFilter === "all") {
      // Si aucune catégorie n'est sélectionnée dans le filtre principal
      items.push(
        <SelectItem key="all" value="all">Toutes les catégories</SelectItem>,
        <SelectItem key="main" value="main">Catégories principales uniquement</SelectItem>
      );

      // Ajouter toutes les catégories principales et leurs sous-catégories
      Object.entries(CATEGORY_HIERARCHY).forEach(([mainCategoryId, subCategories]) => {
        const mainCategoryName = CATEGORY_NAMES[mainCategoryId];
        items.push(
          <SelectItem key={mainCategoryId} value={mainCategoryId} className="font-semibold">
            {mainCategoryName}
          </SelectItem>
        );

        // Ajouter les sous-catégories avec une indentation
        subCategories.forEach(subCategoryId => {
          const subCategoryName = CATEGORY_NAMES[subCategoryId];
          items.push(
            <SelectItem key={subCategoryId} value={subCategoryId} className="pl-6">
              └ {subCategoryName}
            </SelectItem>
          );
        });
      });
    } else {
      // Si une catégorie principale est sélectionnée dans le filtre
      const subCategories = CATEGORY_HIERARCHY[selectedFilter] || [];
      
      // Option pour voir la catégorie principale uniquement
      items.push(
        <SelectItem key={selectedFilter} value={selectedFilter}>
          {CATEGORY_NAMES[selectedFilter]} uniquement
        </SelectItem>
      );

      // Ajouter toutes les sous-catégories
      subCategories.forEach(subCategoryId => {
        const subCategoryName = CATEGORY_NAMES[subCategoryId];
        items.push(
          <SelectItem key={subCategoryId} value={subCategoryId}>
            {subCategoryName}
          </SelectItem>
        );
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
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {buildCategoryOptions()}
        </SelectContent>
      </Select>
    </div>
  );
}
