import { supabase } from "../supabase";
import { ProcessedTransaction } from "../fileProcessing";
import { Transaction, TransactionCategory, TransactionFilters } from "@/types/transaction";

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

    // Préparer les transactions pour l'insertion
    const transactionsToInsert = transactions.map((t) => ({
      amount: Math.abs(t.amount),
      type: t.type,
      description: t.description,
      date: t.date,
      category_id: t.category_id,
      merchant: t.merchant,
      location: null, // Pour l'instant, on ne gère pas la localisation
      created_by: userId,
    }));

    // Insérer les transactions
    const { data: storedTransactions, error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionsToInsert)
      .select();

    if (transactionError) throw transactionError;

    // Créer les parts de transaction pour l'utilisateur
    if (storedTransactions) {
      const shares = storedTransactions.map((t) => ({
        transaction_id: t.id,
        user_id: userId,
        split_type: "equal" as const,
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
  return data as Transaction[];
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

export async function getTransactionsByFilters(
  userId: string,
  filters: TransactionFilters
) {
  let query = supabase
    .from("transactions")
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq("created_by", userId);

  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }
  if (filters.categories?.length) {
    query = query.in("category_id", filters.categories);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.minAmount) {
    query = query.gte("amount", filters.minAmount);
  }
  if (filters.maxAmount) {
    query = query.lte("amount", filters.maxAmount);
  }
  if (filters.searchQuery) {
    query = query.ilike("description", `%${filters.searchQuery}%`);
  }
  if (filters.merchant) {
    query = query.ilike("merchant", `%${filters.merchant}%`);
  }

  const { data, error } = await query.order("date", { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createTransaction(
  transaction: Omit<Transaction, "id" | "created_at" | "updated_at">,
) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTransaction(
  transactionId: string,
  updates: Partial<Transaction>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", transactionId)
    .eq("created_by", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(
  transactionId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("created_by", userId);

  if (error) throw error;
}

// Gestion des catégories
export async function getCategories(userId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`created_by.eq.${userId},is_default.eq.true`);

  if (error) throw error;
  return data;
}

export async function createCategory(
  category: Omit<TransactionCategory, "id">,
) {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  categoryId: string,
  updates: Partial<TransactionCategory>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", categoryId)
    .eq("created_by", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(
  categoryId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("created_by", userId);

  if (error) throw error;
}
