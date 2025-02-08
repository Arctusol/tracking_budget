export interface ImportRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  status: "pending" | "completed" | "failed";
  transaction_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
