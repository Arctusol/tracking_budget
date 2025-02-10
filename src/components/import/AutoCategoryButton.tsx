import React from 'react';
import { Button } from "@/components/ui/button";
import { detectCategory } from '../../lib/api/category.api';

interface AutoCategoryButtonProps {
    description: string;
    currentCategory: string;
    onCategoryDetected: (category: string) => void;
    disabled?: boolean;
}

export const AutoCategoryButton: React.FC<AutoCategoryButtonProps> = ({
    description,
    currentCategory,
    onCategoryDetected,
    disabled = false
}) => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleClick = async () => {
        try {
            setIsLoading(true);
            const detectedCategory = await detectCategory(description);
            onCategoryDetected(detectedCategory);
        } catch (error) {
            console.error('Error detecting category:', error);
            // Vous pouvez ajouter ici une notification d'erreur si vous le souhaitez
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
            onClick={handleClick}
            disabled={disabled || isLoading}
            variant="outline"
            size="sm"
            className="ml-2"
        >
            {isLoading ? "Détection..." : "Détecter"}
        </Button>
    );
};
