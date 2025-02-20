import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ReceiptData } from '@/lib/services/receipt.service';

interface UseReceiptsProps {
  onReceiptsLoaded: (receipts: ReceiptData[]) => void;
}

export function useReceipts({ onReceiptsLoaded }: UseReceiptsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReceipts = useCallback(async (filters?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    search?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('receipts')
        .select(`
          *,
          merchant:merchants(*),
          items:receipt_items(
            *,
            product_category:product_categories(*)
          )
        `);

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('date', filters.endDate.toISOString());
      }

      if (filters?.category) {
        query = query.eq('items.product_category.id', filters.category);
      }

      if (filters?.search) {
        query = query.or(`
          merchantName.ilike.%${filters.search}%,
          items.name.ilike.%${filters.search}%
        `);
      }

      const { data, error } = await query;

      if (error) throw error;

      onReceiptsLoaded(data as ReceiptData[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  }, [onReceiptsLoaded]);

  return {
    loading,
    error,
    fetchReceipts
  };
}
