import * as Papa from "papaparse";
import { v4 as uuidv4 } from 'uuid';
import { ProcessedTransaction } from "./types";
import { TransactionType } from "../../types/transaction";
import { validateTransactions, sanitizeTransactionData } from "../validation";

export async function processCSV(file: File): Promise<ProcessedTransaction[]> {
  return new Promise((resolve, reject) => {
    let validationErrors: any[] = [];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions = results.data
          .map((row: any) => {
            const amount = parseFloat((row.amount || row.Amount || row.montant || row.Montant || "0").replace(',', '.'));
            return {
              id: uuidv4(),
              date: row.date || row.Date || row.date_operation || row.DateOperation || "",
              description: row.description || row.Description || row.libelle || row.Libelle || "",
              amount,
              type: amount >= 0 ? 'income' as TransactionType : 'expense' as TransactionType,
              merchant: "",
              category_id: row.category || row.Category || undefined,
            };
          })
          .filter((t) => Boolean(t.date && t.amount));

        const validationResult = validateTransactions(transactions);
        if (validationResult.errors.length > 0) {
          validationErrors = validationResult.errors;
        }
        if (validationResult.valid.length === 0) {
          reject(new Error("No valid transactions found in the file"));
          return;
        }
        resolve(validationResult.valid as ProcessedTransaction[]);
      },
      error: (error) => {
        reject(new Error("Erreur lors de la lecture du fichier CSV"));
      },
    });
  });
}
