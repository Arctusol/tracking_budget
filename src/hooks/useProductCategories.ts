import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  category_id: string;
  created_at: string;
  created_by: string;
  is_default: boolean;
  metadata: {
    keywords: string[];
  };
}

interface UseProductCategoriesProps {
  onCategoriesLoaded: (categories: ProductCategory[]) => void;
}

export function useProductCategories({ onCategoriesLoaded }: UseProductCategoriesProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      onCategoriesLoaded(data as ProductCategory[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  }, [onCategoriesLoaded]);

  return {
    loading,
    error,
    fetchCategories
  };
}
