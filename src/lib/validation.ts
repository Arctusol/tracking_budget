import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    },
    { message: "Invalid date or date in future" },
  ),
  description: z.string().min(1, "Description is required").max(255),
  amount: z
    .number()
    .refine((amount) => amount !== 0, { message: "Amount cannot be zero" }),
  category: z.string().optional(),
  merchant: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
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

export function sanitizeTransactionData(rawTransaction: any) {
  return {
    date: rawTransaction.date?.trim(),
    description: rawTransaction.description?.trim(),
    amount:
      typeof rawTransaction.amount === "string"
        ? parseFloat(rawTransaction.amount.replace(",", "."))
        : rawTransaction.amount,
    category: rawTransaction.category?.trim(),
    merchant: rawTransaction.merchant?.trim(),
    location: rawTransaction.location,
  };
}
