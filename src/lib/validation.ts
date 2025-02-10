import { z } from "zod";
import { TransactionType } from "../types/transaction";

export const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: "Invalid date format" },
  ),
  description: z.string().min(1, "Description is required").max(255),
  amount: z
    .number()
    .refine((amount) => amount !== 0, { message: "Amount cannot be zero" }),
  type: z.enum(['expense', 'income', 'transfer'] as const),
  category_id: z.string().optional(),
  merchant: z.string().optional(),
  metadata: z.object({
    date_valeur: z.string().optional(),
    numero_releve: z.string().optional(),
    titulaire: z.string().optional(),
  }).optional(),
});

export type ValidatedTransaction = z.infer<typeof transactionSchema>;

export interface ValidationError {
  index: number;
  errors: Record<string, string[]>;
  rawTransaction: any;
}

export function validateTransaction(transaction: any): ValidatedTransaction {
  return transactionSchema.parse(transaction);
}

export function validateTransactions(transactions: any[]): {
  valid: ValidatedTransaction[];
  errors: ValidationError[];
} {
  const valid: ValidatedTransaction[] = [];
  const errors: ValidationError[] = [];

  transactions.forEach((transaction, index) => {
    try {
      const validatedTransaction = validateTransaction(transaction);
      valid.push(validatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".");
          if (!formattedErrors[field]) {
            formattedErrors[field] = [];
          }
          formattedErrors[field].push(err.message);
        });
        errors.push({
          index,
          errors: formattedErrors,
          rawTransaction: transaction,
        });
      }
    }
  });

  return { valid, errors };
}

export function sanitizeTransactionData(rawTransaction: any): Partial<ValidatedTransaction> {
  return {
    id: rawTransaction.id,
    date: rawTransaction.date?.trim(),
    description: rawTransaction.description?.trim(),
    amount:
      typeof rawTransaction.amount === "string"
        ? parseFloat(rawTransaction.amount.replace(",", "."))
        : rawTransaction.amount,
    type: rawTransaction.type || (rawTransaction.amount < 0 ? 'expense' : 'income') as TransactionType,
    category_id: rawTransaction.category_id,
    merchant: rawTransaction.merchant?.trim(),
    metadata: rawTransaction.metadata,
  };
}
