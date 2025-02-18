import React from 'react';
import { Button } from "@/components/ui/button";
import { detectCategory } from "@/lib/api/category.api";
import { CATEGORY_IDS } from "@/lib/constants/constants";
import { detectItemCategory } from "@/lib/constants/itemCategories";
import { PRODUCT_CATEGORY_IDS } from "@/lib/constants/itemCategories";

interface AutoCategoryButtonProps {
  description: string;
  currentCategory: string;
  onCategoryDetected: (category: string) => void;
  type?: 'transaction' | 'product';
}

export function AutoCategoryButton({ 
  description, 
  currentCategory, 
  onCategoryDetected,
  type = 'transaction' 
}: AutoCategoryButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDetectCategory = async () => {
    try {
      setIsLoading(true);
      
      if (type === 'product') {
        // Détection de catégorie de produit
        const categoryId = detectItemCategory(description);
        if (categoryId !== PRODUCT_CATEGORY_IDS.OTHER) {
          onCategoryDetected(categoryId);
        }
      } else {
        // Détection de catégorie de transaction bancaire
        const response = await detectCategory(description);
        const categoryKey = response.category;
        const categoryId = CATEGORY_IDS[categoryKey as keyof typeof CATEGORY_IDS];
        if (categoryId) {
          onCategoryDetected(categoryId);
        }
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
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="ml-2"
    >
      {isLoading ? "Détection..." : "Détecter"}
    </Button>
  );
}
