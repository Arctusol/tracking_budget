import { supabase } from "../supabase";
import { ImportRecord } from "@/types/import";

// Cache mechanism
let importHistoryCache: Record<string, { data: ImportRecord[], timestamp: number }> = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds cache

export async function createImportRecord(data: Partial<ImportRecord>) {
  const { data: record, error } = await supabase
    .from("import_history")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return record;
}

export async function getImportHistory(userId: string): Promise<ImportRecord[]> {
  const now = Date.now();
  const cache = importHistoryCache[userId];
  
  // Return cached data if valid
  if (cache && (now - cache.timestamp < CACHE_DURATION)) {
    return cache.data;
  }

  const { data, error } = await supabase
    .from("import_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching import history:", error);
    throw error;
  }

  // Update cache
  importHistoryCache[userId] = {
    data: data || [],
    timestamp: now
  };

  return data || [];
}

export async function updateImportRecord(
  id: string,
  updates: Partial<ImportRecord>,
) {
  const { error } = await supabase
    .from("import_history")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}
