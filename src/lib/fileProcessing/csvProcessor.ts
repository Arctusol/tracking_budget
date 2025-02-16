import * as Papa from "papaparse";
import { v4 as uuidv4 } from 'uuid';
import { ProcessedTransaction } from "./types";
import { TransactionType } from "../../types/transaction";
import { validateTransactions } from "../validation";
import { detectCategory } from "./categoryDetection";
import { extractMerchantFromDescription } from "./merchantExtraction";

// Helper function to convert DD/MM/YYYY to YYYY-MM-DD
function convertToISODate(date: string): string {
  const parts = date.split(/[-/]/); // Accepte les tirets ou les slashs
  if (parts.length !== 3) return "";
  
  // Assurez-vous que l'année est sur 4 chiffres
  const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
  
  // Retourne au format YYYY-MM-DD pour Supabase
  return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

function isBankStatement(fileName: string, headers: string[]): boolean {
  const bankHeaders = ["Date opération", "Date valeur", "libellé", "Débit", "Crédit"];
  const hasMatchingHeaders = bankHeaders.some(header => headers.includes(header));
  return fileName.toLowerCase().includes("historique") || 
         fileName.toLowerCase().includes("operations") ||
         hasMatchingHeaders;
}

async function processBankStatementRow(row: any): Promise<ProcessedTransaction> {
  // Handle both Débit and Crédit columns
  let amount = 0;
  let type: TransactionType = 'expense';

  if (row["Débit"] && row["Débit"].trim() !== '') {
    amount = parseFloat(row["Débit"].replace(',', '.'));
    type = 'expense';
  } else if (row["Crédit"] && row["Crédit"].trim() !== '') {
    amount = parseFloat(row["Crédit"].replace(',', '.'));
    type = 'income';
  }

  const date = convertToISODate(row["Date opération"] || "");
  const description = row["libellé"] || "";
  const merchant = extractMerchantFromDescription(description);
  const detectedCategory = await detectCategory(description, amount);

  return {
    id: uuidv4(),
    date,
    description,
    amount: Math.abs(amount), // Toujours stocker le montant en positif
    type, // Le type détermine si c'est un débit ou un crédit
    merchant,
    category_id: detectedCategory ? detectedCategory.toString() : undefined,
  };
}

function processStandardRow(row: any): ProcessedTransaction {
  const amount = parseFloat((row.amount || row.Amount || row.montant || row.Montant || "0").replace(',', '.'));
  const description = row.description || row.Description || row.libelle || row.Libelle || "";
  const merchant = extractMerchantFromDescription(description);
  const rawDate = row.date || row.Date || row.date_operation || row.DateOperation || "";
  const date = convertToISODate(rawDate);
  
  return {
    id: uuidv4(),
    date,
    description,
    amount,
    type: amount >= 0 ? 'income' as TransactionType : 'expense' as TransactionType,
    merchant,
    category_id: row.category || row.Category || undefined,
  };
}

export async function processCSV(file: File): Promise<ProcessedTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "ISO-8859-1", // Handle French characters
      complete: async (results) => {
        console.log("CSV parsing results:", results);
        console.log("CSV headers:", results.meta.fields);
        
        if (!results.data || results.data.length === 0) {
          reject(new Error("Le fichier CSV est vide ou mal formaté"));
          return;
        }

        const isBankStatementFile = isBankStatement(file.name, results.meta.fields || []);
        const processRow = isBankStatementFile ? processBankStatementRow : processStandardRow;

        try {
          const transactions = await Promise.all(
            results.data.map(async (row: any) => {
              console.log("Processing row:", row);
              const transaction = await processRow(row);
              console.log("Mapped transaction:", transaction);
              return transaction;
            })
          );

          const filteredTransactions = transactions.filter((t) => {
            const isValid = Boolean(t.date && typeof t.amount === 'number' && !isNaN(t.amount));
            if (!isValid) {
              console.log("Invalid transaction:", t, "Missing date or invalid amount");
            }
            return isValid;
          });

          console.log("Filtered transactions:", filteredTransactions);

          const validationResult = validateTransactions(filteredTransactions);
          console.log("Validation result:", validationResult);
          
          if (validationResult.errors.length > 0) {
            console.log("Validation errors:", validationResult.errors);
          }
          
          if (validationResult.valid.length === 0) {
            reject(new Error("Aucune transaction valide trouvée dans le fichier. Vérifiez que votre fichier contient les colonnes requises (date et montant) avec des données valides."));
            return;
          }
          
          resolve(validationResult.valid as ProcessedTransaction[]);
        } catch (error) {
          console.error("Error processing transactions:", error);
          reject(new Error("Erreur lors du traitement des transactions"));
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        reject(new Error("Erreur lors de l'analyse du fichier CSV"));
      }
    });
  });
}
