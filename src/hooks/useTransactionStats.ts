import { useMemo } from 'react';
import { Transaction } from '@/types/transaction';
import { CATEGORY_IDS } from '@/lib/fileProcessing/constants';
import { DashboardStats } from '@/types/stats';

export function useTransactionStats(transactions: Transaction[]): DashboardStats {
  return useMemo(() => {
    const totalExpenses = transactions
      .filter((t: Transaction) => t.type === "expense")
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const balance = transactions
      .reduce((sum: number, t: Transaction) => {
        return sum + (t.type === "income" ? t.amount : -t.amount);
      }, 0);

    const transfersAmandine = transactions
      .filter((t: Transaction) => t.category_id === CATEGORY_IDS.TRANSFER_AMANDINE)
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const transfersAntonin = transactions
      .filter((t: Transaction) => t.category_id === CATEGORY_IDS.TRANSFER_ANTONIN)
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const incomes = transactions
      .filter((t: Transaction) => t.type === "income")
      .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    return {
      balance,
      monthlyExpenses: totalExpenses,
      transfersAmandine,
      transfersAntonin,
      incomes,
    };
  }, [transactions]);
}
