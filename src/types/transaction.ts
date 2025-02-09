export type TransactionType = 'expense' | 'income' | 'transfer';

export type TransactionCategory = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  created_by: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  category_id?: string;
  merchant?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  merchant?: string;
};
