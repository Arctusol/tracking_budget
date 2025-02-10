import { supabase } from "../supabase";
import { BankStatement } from '@/types/database';

export async function createBankStatement(statement: Omit<BankStatement, 'id' | 'created_at' | 'created_by'>): Promise<BankStatement> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create a bank statement');
  }

  const { data, error } = await supabase
    .from('bank_statements')
    .insert([{ ...statement, created_by: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating bank statement:', error);
    throw error;
  }

  return data;
}

export async function getBankStatements(): Promise<BankStatement[]> {
  const { data, error } = await supabase
    .from('bank_statements')
    .select('*')
    .order('statement_date', { ascending: false });

  if (error) {
    console.error('Error fetching bank statements:', error);
    throw error;
  }

  return data || [];
}

export async function getBankStatementById(id: string): Promise<BankStatement | null> {
  const { data, error } = await supabase
    .from('bank_statements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching bank statement:', error);
    throw error;
  }

  return data;
}

export async function updateBankStatement(id: string, updates: Partial<BankStatement>): Promise<BankStatement> {
  const { data, error } = await supabase
    .from('bank_statements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating bank statement:', error);
    throw error;
  }

  return data;
}

export async function deleteBankStatement(id: string): Promise<void> {
  const { error } = await supabase
    .from('bank_statements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting bank statement:', error);
    throw error;
  }
}
