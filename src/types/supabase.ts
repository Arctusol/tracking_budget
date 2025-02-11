export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          amount: number
          type: "income" | "expense" | "transfer"
          description: string
          date: string
          category_id?: string
          merchant?: string
          metadata?: {
            titulaire?: string
            numero_releve?: string
            date_valeur?: string
          }
          created_by: string
          created_at: string
          updated_at: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: "income" | "expense"
          created_at: string
          created_by: string
        }
      }
      transaction_shares: {
        Row: {
          id: string
          transaction_id: string
          user_id: string
          amount: number
          created_at: string
        }
      }
    }
  }
}
