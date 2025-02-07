import { Database } from "./supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionShare =
  Database["public"]["Tables"]["transaction_shares"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];

export type TransactionWithShares = Transaction & {
  shares: TransactionShare[];
  creator: Profile;
};

export type TransactionCategory =
  | "food"
  | "transport"
  | "leisure"
  | "housing"
  | "health"
  | "shopping"
  | "salary"
  | "investment"
  | "other";
