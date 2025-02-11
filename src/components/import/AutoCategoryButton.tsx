import React from 'react';
import { Button } from "@/components/ui/button";
import { detectCategory } from "@/lib/api/category.api";
import { CATEGORY_IDS } from "@/lib/fileProcessing/constants";

interface AutoCategoryButtonProps {
  description: string;
  currentCategory: string;
  onCategoryDetected: (category: string) => void;
}

export function AutoCategoryButton({ description, currentCategory, onCategoryDetected }: AutoCategoryButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);

  const handleDetectCategory = async () => {
    try {
      setIsLoading(true);
      const response = await detectCategory(description);
      const categoryKey = response.category;
      // Convertir le nom de catégorie (ex: "RESTAURANT") en UUID
      const categoryId = CATEGORY_IDS[categoryKey as keyof typeof CATEGORY_IDS];
      if (categoryId) {
        onCategoryDetected(categoryId);
      }
    } catch (error) {
      console.error('Error detecting category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ne montrer le bouton que si la catégorie est "Autre"
  if (currentCategory.toLowerCase() !== 'autre') {
    return null;
  }

  return (
    <Button 
      onClick={handleDetectCategory}
      disabled={disabled || isLoading}
      variant="outline"
      size="sm"
      className="ml-2"
    >
      {isLoading ? "Détection..." : "Détecter"}
    </Button>
  );
}
