import { supabase } from "../supabase";

export async function savePattern(pattern: string, categoryId: string) {
  const { data, error } = await supabase
    .from("transaction_patterns")
    .insert({
      pattern,
      category_id: categoryId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPatterns() {
  const { data, error } = await supabase.from("transaction_patterns").select(`
      *,
      categories (id, name)
    `);

  if (error) throw error;
  return data;
}

export async function findMatchingPattern(description: string) {
  const { data: patterns, error } = await supabase.from("transaction_patterns")
    .select(`
      *,
      categories (id, name)
    `);

  if (error) throw error;

  // Recherche le pattern le plus pertinent
  const match = patterns?.find((pattern) =>
    description.toLowerCase().includes(pattern.pattern.toLowerCase()),
  );

  return match;
}
