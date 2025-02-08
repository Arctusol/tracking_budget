import { supabase } from "../supabase";
import { ImportRecord } from "@/types/import";

export async function createImportRecord(data: Partial<ImportRecord>) {
  const { data: record, error } = await supabase
    .from("import_history")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return record;
}

export async function getImportHistory(userId: string) {
  const { data, error } = await supabase
    .from("import_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ImportRecord[];
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
