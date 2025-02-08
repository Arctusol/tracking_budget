import { supabase } from "../supabase";
import { ProcessedTransaction } from "../fileProcessing";
import { Transaction, TransactionShare } from "@/types/expense";

export async function storeTransactions(
  transactions: ProcessedTransaction[],
  userId: string,
) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const { data: storedTransactions, error: transactionError } = await supabase
      .from("transactions")
      .insert(
        transactions.map((t) => ({
          amount: Math.abs(t.amount),
          type: t.amount < 0 ? "expense" : "income",
          description: t.description,
          date: t.date,
          category: t.category || "other",
          created_by: userId,
        })),
      )
      .select();

    if (transactionError) throw transactionError;

    // Create equal splits for the user's transactions
    if (storedTransactions) {
      const shares = storedTransactions.map((t) => ({
        transaction_id: t.id,
        user_id: userId,
        split_type: "equal",
        amount: t.amount,
        percentage: 100,
      }));

      const { error: sharesError } = await supabase
        .from("transaction_shares")
        .insert(shares);

      if (sharesError) throw sharesError;
    }

    return storedTransactions;
  } catch (error) {
    console.error("Error storing transactions:", error);
    throw error;
  }
}

export async function getTransactions(userId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      shares:transaction_shares(*),
      creator:profiles(*)
    `,
    )
    .eq("created_by", userId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data as TransactionWithShares[];
}

export async function updateTransactionCategory(
  transactionId: string,
  category: string,
  userId: string,
) {
  const { error } = await supabase
    .from("transactions")
    .update({ category })
    .eq("id", transactionId)
    .eq("created_by", userId);

  if (error) throw error;
}
