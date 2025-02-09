import * as Papa from "papaparse";
import { createWorker } from "tesseract.js";
import { categorizeBatch } from "./categorization";
import { validateTransactions as validateTransactionsBatch, sanitizeTransactionData } from "./validation";
import {
  DocumentAnalysisError,
  ConfigurationError,
  ValidationError,
  ExtractError,
  DocumentProcessingError,
} from "./errors/documentProcessingErrors";
import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import { getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType } from "../types/transaction";

export interface ProcessedTransaction extends Omit<Transaction, 'created_by' | 'created_at' | 'updated_at'> {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  category_id?: string;
  merchant?: string;
  metadata?: {
    date_valeur?: string;
    numero_releve?: string;
    titulaire?: string;
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

interface AzureAnalyzeResult {
  pages?: {
    lines?: {
      content?: string;
    }[];
  }[];
  tables?: {
    cells: {
      rowIndex: number;
      columnIndex: number;
      content?: string;
    }[];
  }[];
}

interface AzureResponse {
  analyzeResult: AzureAnalyzeResult;
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
              id: uuidv4(),
              date: row.date || row.Date || row.date_operation || row.DateOperation || "",
              description:
                row.description ||
                row.Description ||
                row.libelle ||
                row.Libelle ||
                "",
              amount:
                row.amount || row.Amount || row.montant || row.Montant || "0",
              type: Number(row.amount || row.Amount || row.montant || row.Montant || "0") >= 0 ? 'income' as TransactionType : 'expense' as TransactionType,
              category: row.category || row.Category || "",
            };
            return sanitizeTransactionData(rawTransaction);
          })
          .filter((t) => t.date && t.amount);

        const validationResult = validateTransactionsBatch(transactions);
        if (validationResult.errors.length > 0) {
          validationErrors = validationResult.errors;
        }
        if (validationResult.valid.length === 0) {
          reject(new Error("No valid transactions found in the file"));
          return;
        }
        resolve(validationResult.valid);
      },
      error: (error) => {
        reject(new Error("Erreur lors de la lecture du fichier CSV"));
      },
    });
  });
}

async function processPDF(file: File): Promise<ProcessedTransaction[]> {
  if (!file) {
    throw new DocumentProcessingError("No file provided");
  }

  try {
    // Convertir le fichier en base64
    const fileBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // Initialiser le client avec les variables d'environnement Vite
    const endpoint = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      throw new ConfigurationError("Azure Document Intelligence credentials not configured");
    }

    const client = DocumentIntelligence(endpoint, { key });

    // Analyser le document
    const initialResponse = await client
      .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
      .post({
        contentType: "application/json",
        body: {
          base64Source: base64Data
        }
      });

    if (isUnexpected(initialResponse)) {
      throw initialResponse.body.error;
    }

    const poller = getLongRunningPoller(client, initialResponse);
    const result = await poller.pollUntilDone();
    const analyzeResult = result.body?.analyzeResult;
    
    if (!analyzeResult) {
      throw new ExtractError("No analyze result in response");
    }
    
    const azureResponse: AzureResponse = {
      analyzeResult: {
        pages: analyzeResult.pages || [],
        tables: analyzeResult.tables || [],
      }
    };

    if (!azureResponse.analyzeResult || !azureResponse.analyzeResult.pages) {
      throw new ExtractError("No pages found in document");
    }

    const transactions: ProcessedTransaction[] = [];
    let currentTransaction: Partial<ProcessedTransaction> = {};
    let numeroReleve = "";
    let titulaire = "";

    // Extraire le numéro de relevé et le titulaire des pages
    for (const page of azureResponse.analyzeResult.pages) {
      for (const line of page.lines || []) {
        const content = line.content || '';
        if (content.includes("Nº") && content.includes("2025")) {
          numeroReleve = content.split("-")[0].replace("Nº", "").trim();
        }
        if (content.includes("Titulaire(s) du compte :")) {
          titulaire = content.replace("Titulaire(s) du compte :", "").trim();
        }
      }
    }

    // Parcourir les tables pour extraire les transactions
    if (azureResponse.analyzeResult.tables) {
      for (const table of azureResponse.analyzeResult.tables) {
        let dateIndex = -1;
        let dateValeurIndex = -1;
        let descriptionIndex = -1;
        let debitIndex = -1;
        let creditIndex = -1;

        // Identifier les colonnes
        for (const cell of table.cells) {
          if (cell.rowIndex === 0) {
            const content = cell.content?.toLowerCase() || '';
            if (content.includes('date')) {
              if (dateIndex === -1) {
                dateIndex = cell.columnIndex;
              } else if (content.includes('valeur')) {
                dateValeurIndex = cell.columnIndex;
              }
            }
            if (content.includes('opération') || content.includes('operation')) descriptionIndex = cell.columnIndex;
            if (content.includes('débit')) debitIndex = cell.columnIndex;
            if (content.includes('crédit')) creditIndex = cell.columnIndex;
          }
        }

        // Si on n'a pas trouvé les colonnes nécessaires, on cherche dans la première ligne de données
        if (dateIndex === -1 || descriptionIndex === -1) {
          for (const cell of table.cells) {
            if (cell.rowIndex === 1) {
              const content = cell.content || '';
              if (content && /^\d{2}\/\d{2}$/.test(content)) dateIndex = cell.columnIndex;
              if (content && content.length > 10) descriptionIndex = cell.columnIndex;
            }
          }
        }

        // Extraire les transactions
        let currentRow = -1;
        for (const cell of table.cells) {
          if (cell.rowIndex === 0) continue; // Skip header

          if (cell.rowIndex !== currentRow) {
            if (currentTransaction.date && currentTransaction.description) {
              const completeTransaction: ProcessedTransaction = {
                id: uuidv4(),
                date: currentTransaction.date,
                description: currentTransaction.description,
                amount: currentTransaction.amount || 0,
                type: (currentTransaction.amount || 0) < 0 ? 'expense' as TransactionType : 'income' as TransactionType,
                merchant: currentTransaction.merchant || extractMerchantFromDescription(currentTransaction.description),
                category_id: detectCategory(currentTransaction.description, currentTransaction.amount || 0),
                metadata: {
                  date_valeur: currentTransaction.metadata?.date_valeur || currentTransaction.date,
                  numero_releve: numeroReleve,
                  titulaire: titulaire
                }
              };
              transactions.push(completeTransaction);
            }
            currentTransaction = {};
            currentRow = cell.rowIndex;
          }

          const content = cell.content || '';
          if (cell.columnIndex === dateIndex) {
            const dateParts = content.split('/');
            if (dateParts && dateParts.length === 2) {
              const date = `2025-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
              currentTransaction.date = date;
              if (!currentTransaction.metadata) {
                currentTransaction.metadata = { date_valeur: date, numero_releve: numeroReleve, titulaire: titulaire };
              }
            }
          } else if (cell.columnIndex === dateValeurIndex) {
            const dateParts = content.split('/');
            if (dateParts && dateParts.length === 2) {
              const date = `2025-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
              if (!currentTransaction.metadata) {
                currentTransaction.metadata = { date_valeur: date, numero_releve: numeroReleve, titulaire: titulaire };
              } else {
                currentTransaction.metadata.date_valeur = date;
              }
            }
          } else if (cell.columnIndex === descriptionIndex) {
            currentTransaction.description = content;
            currentTransaction.merchant = extractMerchantFromDescription(content);
          } else if (cell.columnIndex === debitIndex && content) {
            const amount = parseFloat(content.replace(',', '.').replace(/[^\d.-]/g, ''));
            if (!isNaN(amount)) {
              currentTransaction.amount = -amount;
            }
          } else if (cell.columnIndex === creditIndex && content) {
            const amount = parseFloat(content.replace(',', '.').replace(/[^\d.-]/g, ''));
            if (!isNaN(amount)) {
              currentTransaction.amount = amount;
            }
          }
        }

        // Ajouter la dernière transaction
        if (currentTransaction.date && currentTransaction.description) {
          const completeTransaction: ProcessedTransaction = {
            id: uuidv4(),
            date: currentTransaction.date,
            description: currentTransaction.description,
            amount: currentTransaction.amount || 0,
            type: (currentTransaction.amount || 0) < 0 ? 'expense' as TransactionType : 'income' as TransactionType,
            merchant: currentTransaction.merchant || extractMerchantFromDescription(currentTransaction.description),
            category_id: detectCategory(currentTransaction.description, currentTransaction.amount || 0),
            metadata: {
              date_valeur: currentTransaction.metadata?.date_valeur || currentTransaction.date,
              numero_releve: numeroReleve,
              titulaire: titulaire
            }
          };
          transactions.push(completeTransaction);
        }
      }
    }

    // Valider et catégoriser les transactions
    if (transactions.length === 0) {
      throw new ExtractError("No transactions found in document");
    }

    const validationResult = await validateTransactionsBatch(transactions);
    if (validationResult.errors.length > 0) {
      console.warn('Validation errors:', validationResult.errors);
    }
    return await categorizeBatch(validationResult.valid);
  } catch (error) {
    console.error("Error processing PDF with Azure Document Intelligence:", error);
    throw new DocumentAnalysisError("Failed to process PDF document");
  }
}

function extractMerchantFromDescription(description: string): string {
  // Nettoyer la description
  const cleanDesc = description.trim().toLowerCase();
  
  // Liste des mots à ignorer
  const ignoreWords = ['paiement', 'par', 'carte', 'virement', 'vers', 'de', 'prelevement', 'retrait'];
  
  // Diviser la description en mots
  const words = cleanDesc.split(/\s+/);
  
  // Filtrer les mots à ignorer et prendre le premier mot restant
  const merchantWords = words.filter(word => !ignoreWords.includes(word));
  
  if (merchantWords.length > 0) {
    // Capitaliser le premier mot
    return merchantWords[0].charAt(0).toUpperCase() + merchantWords[0].slice(1);
  }
  
  return '';
}

function detectCategory(description: string, amount: number): string | undefined {
  const cleanDesc = description.toLowerCase();
  
  // Définir les règles de catégorisation
  const rules = [
    { keywords: ['carrefour', 'leclerc', 'auchan', 'lidl', 'intermarche', 'franprix', 'monoprix'], category: 'Alimentation' },
    { keywords: ['sncf', 'ratp', 'navigo', 'uber', 'taxi'], category: 'Transport' },
    { keywords: ['loyer', 'edf', 'engie', 'eau', 'electricite', 'gaz'], category: 'Logement' },
    { keywords: ['cinema', 'theatre', 'spotify', 'netflix', 'amazon prime'], category: 'Loisirs' },
    { keywords: ['pharmacie', 'medecin', 'docteur', 'hopital', 'mutuelle'], category: 'Santé' },
    { keywords: ['zara', 'h&m', 'uniqlo', 'decathlon'], category: 'Shopping' },
    { keywords: ['free', 'orange', 'sfr', 'bouygues', 'assurance'], category: 'Services' },
  ];

  // Détecter la catégorie basée sur les mots-clés
  for (const rule of rules) {
    if (rule.keywords.some(keyword => cleanDesc.includes(keyword))) {
      return rule.category;
    }
  }

  // Catégorisation basée sur le montant
  if (amount > 0) {
    return 'Revenus';
  }

  return undefined;
}

async function processImage(file: File): Promise<ProcessedTransaction[]> {
  const worker = await createWorker();
  try {
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return processText(text);
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

async function processText(text: string): Promise<ProcessedTransaction[]> {
  const transactions: ProcessedTransaction[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\d{2}\/\d{2})\s+(.+?)\s+([-]?\d+,\d{2})\s*$/);
    if (match) {
      const amount = parseFloat(match[3].replace(',', '.'));
      transactions.push({
        id: uuidv4(),
        date: `2025-${match[1].split('/')[1]}-${match[1].split('/')[0]}`,
        description: match[2].trim(),
        amount: amount,
        type: amount < 0 ? 'expense' as TransactionType : 'income' as TransactionType,
        merchant: extractMerchantFromDescription(match[2].trim()),
        category_id: detectCategory(match[2].trim(), amount)
      });
    }
  }

  const validTransactions = await validateTransactionsBatch(transactions);
  return validTransactions.valid;
}
