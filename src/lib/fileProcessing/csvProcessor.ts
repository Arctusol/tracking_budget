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
        console.log("CSV parsing results:", results);
        console.log("CSV headers:", results.meta.fields);
        
        if (!results.data || results.data.length === 0) {
          reject(new Error("Le fichier CSV est vide ou mal formaté"));
          return;
        }

        const transactions = results.data
          .map((row: any) => {
            console.log("Processing row:", row);
            const amount = parseFloat((row.amount || row.Amount || row.montant || row.Montant || "0").replace(',', '.'));
            const transaction = {
              id: uuidv4(),
              date: row.date || row.Date || row.date_operation || row.DateOperation || "",
              description: row.description || row.Description || row.libelle || row.Libelle || "",
              amount,
              type: amount >= 0 ? 'income' as TransactionType : 'expense' as TransactionType,
              merchant: "",
              category_id: row.category || row.Category || undefined,
            };
            console.log("Mapped transaction:", transaction);
            return transaction;
          })
          .filter((t) => {
            const isValid = Boolean(t.date && t.amount);
            if (!isValid) {
              console.log("Invalid transaction:", t, "Missing date or amount");
            }
            return isValid;
          });

        console.log("Filtered transactions:", transactions);

        const validationResult = validateTransactions(transactions);
        console.log("Validation result:", validationResult);
        
        if (validationResult.errors.length > 0) {
          validationErrors = validationResult.errors;
          console.log("Validation errors:", validationErrors);
        }
        if (validationResult.valid.length === 0) {
          reject(new Error("Aucune transaction valide trouvée dans le fichier. Vérifiez que votre fichier contient les colonnes requises (date et montant) avec des données valides."));
          return;
        }
        resolve(validationResult.valid as ProcessedTransaction[]);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        reject(new Error(`Erreur lors de la lecture du fichier CSV: ${error.message}`));
      },
    });
  });
}
