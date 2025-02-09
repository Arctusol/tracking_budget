import * as Papa from "papaparse";
import { createWorker } from "tesseract.js";
import { categorizeBatch } from "./categorization";
import { validateTransactions, sanitizeTransactionData } from "./validation";
import { createClient } from "@azure-rest/ai-document-intelligence";
import {
  DocumentAnalysisError,
  ConfigurationError,
  ValidationError,
  ExtractError,
} from "./errors/documentProcessingErrors";

export interface ProcessedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  merchant?: string;
  location?: {
    lat: number;
    lng: number;
  };
  metadata?: {
    date_valeur: string;
    numero_releve: string;
    titulaire: string;
  };
}

export interface BankStatement {
  titulaire: {
    nom: string;
  };
  infos_releve: {
    numero_releve: string;
    date_emission: string;
    date_arrete: string;
    solde_ancien: string;
  };
  operations: Array<{
    date_operation: string;
    description: string;
    debit: string;
    credit: string;
  }>;
}

export async function processFile(file: File): Promise<ProcessedTransaction[]> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    if (fileType === "text/csv" || fileName.endsWith(".csv")) {
      return await processCSV(file);
    } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await processPDF(file);
    } else if (
      fileType.startsWith("image/") ||
      /\.(jpg|jpeg|png)$/.test(fileName)
    ) {
      return await processImage(file);
    } else {
      throw new Error("Format de fichier non supporté");
    }
  } catch (error) {
    console.error("Erreur lors du traitement du fichier:", error);
    throw new Error("Erreur lors du traitement du fichier");
  }
}

async function processCSV(file: File): Promise<ProcessedTransaction[]> {
  return new Promise((resolve, reject) => {
    let validationErrors: any[] = [];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions = results.data
          .map((row: any) => {
            // Adapt these field names based on your CSV structure
            const rawTransaction = {
              id: "",
              date: row.date || row.Date || "",
              description:
                row.description ||
                row.Description ||
                row.libelle ||
                row.Libellé ||
                "",
              amount:
                row.amount || row.Amount || row.montant || row.Montant || "0",
              category: row.category || row.Category || "",
            };
            return sanitizeTransactionData(rawTransaction);
          })
          .filter((t) => t.date && t.amount);

        const { valid, errors } = validateTransactions(transactions);
        if (errors.length > 0) {
          validationErrors = errors;
        }
        if (valid.length === 0) {
          reject(new Error("No valid transactions found in the file"));
          return;
        }
        resolve(valid);
      },
      error: (error) => {
        reject(new Error("Erreur lors de la lecture du fichier CSV"));
      },
    });
  });
}

async function processPDF(file: File): Promise<ProcessedTransaction[]> {
  if (!file) {
    throw new ValidationError("No file provided", []);
  }

  if (file.size > 10 * 1024 * 1024) {
    // 10MB limit
    throw new ValidationError("File size exceeds 10MB limit", []);
  }
  try {
    // First convert the file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(fileBuffer).toString("base64");

    // Initialize the Document Intelligence client
    const endpoint =
      process.env.NEXT_PUBLIC_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "";
    const key = process.env.NEXT_PUBLIC_AZURE_DOCUMENT_INTELLIGENCE_KEY || "";

    if (!endpoint || !key) {
      throw new ConfigurationError(
        "Azure Document Intelligence credentials not configured",
      );
    }

    const client = createClient(endpoint, key);

    // Analyze the document
    const poller = await client.beginAnalyzeDocument("prebuilt-layout", {
      base64Source: base64Data,
    });

    const { body: result } = await poller.pollUntilDone();

    if (!result) {
      throw new DocumentAnalysisError("Failed to analyze document");
    }

    if (!result.pages || result.pages.length === 0) {
      throw new DocumentAnalysisError("No pages found in document");
    }

    // Parse the result into our BankStatement format
    const bankStatement: BankStatement = {
      titulaire: {
        nom: "",
      },
      infos_releve: {
        numero_releve: "",
        date_emission: "",
        date_arrete: "",
        solde_ancien: "",
      },
      operations: [],
    };

    // Extract information from the document
    if (result.pages) {
      for (const page of result.pages) {
        for (const line of page.lines || []) {
          const content = line.content;

          // Extract titulaire information
          if (content.includes("Titulaire(s) du compte :")) {
            bankStatement.titulaire.nom = content
              .replace("Titulaire(s) du compte :", "")
              .trim();
          }

          // Extract relevé information
          if (content.includes("Nº")) {
            bankStatement.infos_releve.numero_releve = content
              .split("-")[0]
              .replace("Nº", "")
              .trim();
          }

          if (content.includes("Arrêté au")) {
            bankStatement.infos_releve.date_arrete = content
              .replace("Arrêté au", "")
              .trim();
          }

          if (content.includes("ANCIEN SOLDE CRÉDITEUR")) {
            const soldeMatch = content.match(/\d+,\d+\s*€/);
            if (soldeMatch) {
              bankStatement.infos_releve.solde_ancien = soldeMatch[0];
            }
          }
        }

        // Extract operations from tables
        if (result.tables) {
          for (const table of result.tables) {
            for (const cell of table.cells) {
              // Skip header rows
              if (cell.rowIndex === 0) continue;

              const rowData = table.cells.filter(
                (c) => c.rowIndex === cell.rowIndex,
              );
              if (rowData.length >= 4) {
                const operation = {
                  date_operation: rowData[0]?.content || "",
                  description: rowData[2]?.content || "",
                  debit: rowData[3]?.content || "",
                  credit: rowData[4]?.content || "",
                };

                // Only add if we have at least a date and description
                if (operation.date_operation && operation.description) {
                  bankStatement.operations.push(operation);
                }
              }
            }
          }
        }
      }
    }

    // Convert BankStatement to ProcessedTransaction[]
    const transactions = bankStatement.operations.map((op) => ({
      id: crypto.randomUUID(),
      date: op.date_operation,
      description: op.description,
      amount: parseFloat(
        (op.credit || op.debit || "0")
          .replace(",", ".")
          .replace("€", "")
          .trim(),
      ),
      metadata: {
        date_valeur: op.date_operation,
        numero_releve: bankStatement.infos_releve.numero_releve,
        titulaire: bankStatement.titulaire.nom,
      },
    }));

    // Try to match existing patterns first
    const categorizedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const pattern = await findMatchingPattern(transaction.description);
        if (pattern) {
          return {
            ...transaction,
            category_id: pattern.category_id,
          };
        }
        // If no pattern matches, use AI categorization
        return transaction;
      }),
    );

    // Use AI only for transactions without a matching pattern
    const uncategorizedTransactions = categorizedTransactions.filter(
      (t) => !t.category_id,
    );
    if (uncategorizedTransactions.length > 0) {
      const aiCategorized = await categorizeBatch(uncategorizedTransactions);
      return categorizedTransactions.map((t) =>
        t.category_id ? t : aiCategorized.find((ai) => ai.id === t.id) || t,
      );
    }

    return categorizedTransactions;
  } catch (error) {
    console.error(
      "Error processing PDF with Azure Document Intelligence:",
      error,
    );

    if (error instanceof DocumentProcessingError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new DocumentAnalysisError("Document analysis request timed out");
    }

    if (error.status === 401 || error.status === 403) {
      throw new ConfigurationError(
        "Invalid Azure credentials or insufficient permissions",
      );
    }

    if (error.status === 413) {
      throw new ValidationError("File size too large for processing", []);
    }

    if (error.status >= 500) {
      throw new DocumentAnalysisError(
        "Azure service is currently unavailable",
        error,
      );
    }

    throw new DocumentAnalysisError("Failed to process PDF document", {
      originalError: error,
    });
  }
}

function extractMerchantFromDescription(description: string): string {
  // Logique simple pour extraire le nom du commerçant
  // À améliorer selon les formats spécifiques des descriptions
  const words = description.split(" ");
  return words[0] || "";
}

async function processImage(file: File): Promise<ProcessedTransaction[]> {
  const worker = await createWorker("fra");

  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    await worker.terminate();

    // Similar to PDF processing, but with OCR text
    const lines = text.split("\n");
    const transactions: ProcessedTransaction[] = [];

    for (const line of lines) {
      const match = line.match(
        /([0-9]{2}[/-][0-9]{2}[/-][0-9]{4}).*?([0-9]+[.,][0-9]{2})/,
      );
      if (match) {
        transactions.push({
          id: "",
          date: match[1],
          description: line.replace(match[0], "").trim(),
          amount: parseFloat(match[2].replace(",", ".")),
          category: "",
        });
      }
    }

    return categorizeBatch(transactions);
  } catch (error) {
    console.error("Erreur lors de la lecture de l'image:", error);
    throw new Error("Erreur lors de la lecture de l'image");
  }
}
