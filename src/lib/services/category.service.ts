import { supabase } from "../supabase";
import { Category } from "@/types/database";

// Cache mechanism
let categoriesCache: Category[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getCategories() {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (categoriesCache && (now - lastFetchTime < CACHE_DURATION)) {
    return categoriesCache;
  }

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }

  // Update cache
  categoriesCache = categories;
  lastFetchTime = now;

  return categories;
}

export function buildCategoryHierarchy(categories: Category[]) {
  const categoryMap = new Map<string, Category & { children: Category[] }>();
  const rootCategories: (Category & { children: Category[] })[] = [];

  // First pass: Create category objects with empty children arrays
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: Build the hierarchy
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  // Trier les catégories principales et leurs enfants
  rootCategories.sort((a, b) => {
    // Mettre "Autre" à la fin
    if (a.name === "Autre") return 1;
    if (b.name === "Autre") return -1;
    return a.name.localeCompare(b.name);
  });

  // Trier les sous-catégories
  rootCategories.forEach(category => {
    category.children.sort((a, b) => a.name.localeCompare(b.name));
  });

  return rootCategories;
}
