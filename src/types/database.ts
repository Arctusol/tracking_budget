export type TransactionType = 'expense' | 'income' | 'transfer';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SplitType = 'equal' | 'percentage' | 'amount';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  type: TransactionType;
  created_at: string;
  updated_at: string;
  created_by: string;
  parent_id?: string;
  is_default: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  category_id?: string;
  group_id?: string;
  merchant?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}
