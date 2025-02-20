import { ProductCategory } from '@/hooks/useProductCategories';

export interface ReceiptItem {
  id: string;
  name: string;
  total: number;
  product_category_id?: string;
  product_category?: ProductCategory;
  merchant_id?: string;
  merchant?: {
    id: string;
    name: string;
    normalized_name: string;
  };
  quantity: number;
  price: number;
  discount?: number;
  originalTotal?: number;
}

export interface Receipt {
  id: string;
  user_id: string;
  merchantName?: string;
  merchant_id?: string;
  total: number;
  date: string;
  items: ReceiptItem[];
  category_id?: string;
  image_url?: string;
  status: 'pending' | 'processed' | 'error';
  error?: string;
  metadata?: any;
  group_id?: string;
  created_at: string;
  created_by: string;
  updated_at: string;

  merchant?: {
    id: string;
    name: string;
    normalized_name: string;
  };
  discounts?: {
    description: string;
    amount: number;
    type: 'item' | 'total';
    itemIndex?: number;
  }[];
  validation?: {
    detectedTotal: number;
    confidence: number;
    matches: boolean;
  };
}
