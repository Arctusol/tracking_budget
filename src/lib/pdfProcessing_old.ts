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
    let documentYear = "";

    // Extraire le numéro de relevé, le titulaire et l'année des pages
    for (const page of azureResponse.analyzeResult.pages) {
      for (const line of page.lines || []) {
        const content = line.content || '';
        // Recherche du numéro de relevé qui contient généralement l'année
        if (content.includes("Nº")) {
          const yearMatch = content.match(/\b20\d{2}\b/);
          if (yearMatch) {
            documentYear = yearMatch[0];
            numeroReleve = content.split("-")[0].replace("Nº", "").trim();
          }
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
              // Si l'année n'a pas été trouvée dans l'en-tête, utiliser l'année en cours
              const year = documentYear || new Date().getFullYear().toString();
              const date = `${year}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
              currentTransaction.date = date;
              if (!currentTransaction.metadata) {
                currentTransaction.metadata = { date_valeur: date, numero_releve: numeroReleve, titulaire: titulaire };
              }
            }
          } else if (cell.columnIndex === dateValeurIndex) {
            const dateParts = content.split('/');
            if (dateParts && dateParts.length === 2) {
              const year = documentYear || new Date().getFullYear().toString();
              const date = `${year}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
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

// Mapping des catégories avec leurs IDs
export const CATEGORY_IDS = {
  // Catégories principales
  FOOD: '3a976285-a1c4-4e3e-a2c9-4673fdb7994e',
  TRANSPORT: 'e669e0f3-1158-4d7c-a32b-20e4414ccf2e',
  HOUSING: '06cbb4f4-62c2-40f0-9192-1040f961e23e',
  LEISURE: '3f59d0af-57c6-4973-bd4a-68b4294b818a',
  HEALTH: '5eb9d6eb-14a7-4ab4-9c09-2bba0b5e0c3a',
  SHOPPING: '2636f7ba-b737-434e-b282-7ec1ae6ae3e9',
  SERVICES: 'd0e00ea2-6362-4579-89c3-d27516fb0476',
  EDUCATION: 'f4b0c5d1-2345-4b67-89c0-1a2b3c4d5e6f',
  GIFTS: 'a1b2c3d4-5e6f-4a8b-9c0d-e1f2a3b4c5d6',
  VETERINARY: 'c1d2e3f4-5678-4a8b-9c0d-e1f2a3b4c5d6',
  INCOME: 'a61699b7-5f84-410f-af85-b6e17d342b4b',
  TRANSFERS: 'b2c3d4e5-f012-3456-7890-123456789012',
  OTHER: 'e5f6a7b8-9c0d-1234-5678-90abcdef1234',

  // Sous-catégories Santé
  MEDICAL: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
  PHARMACY: 'af520d67-24e6-4aa1-9902-2c37b44c03e4',
  INSURANCE: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b',
  PILL: '9138e5b7-676b-47de-9258-6b179be679d5',
  SUPPLEMENTS: '07d399fd-fddd-472d-bc5c-c5934e0f8b2c',

  // Sous-catégories Shopping
  CLOTHING: '283a4e6d-0e15-483b-a903-e01fa29e0aa8',
  ELECTRONICS: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
  HOME: 'f1e2d3c4-b5a6-9786-8d9e-0f1a2b3c4d5e',
  BEAUTY: 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d',
  JEWELRY: '9e0f1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',

  // Autres sous-catégories existantes...
  GROCERIES: '5dcaa933-378f-42e6-8fdb-707a1bcef007',
  RESTAURANT: '7f8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e',
  BAR: '3e4f5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
  PUBLIC_TRANSPORT: '65f65f34-e38a-4af4-a055-f95ed4306171',
  TAXI: '68d08f0c-8d49-4fd6-aece-ef13d4d1fdcd',
  FUEL: '4abbda8f-9630-44a6-b00a-84a51c44c519',
  RENT: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
  UTILITIES: '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d',
  INTERNET: 'a7b8d31e-2873-452f-98a9-66b2bd3de8f7',
  HOTEL: '5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d',
  ENTERTAINMENT: 'b5c6d7e8-9f0a-1b2c-3d4e-5f6a7b8c9d0e',
  SPORT: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
  BOOKS: '3aa03561-32a3-4cfa-bb65-a741d13687d2',
  SUBSCRIPTIONS: '72ddac59-ef59-400c-89f8-9a8424426752',
  SALARY: '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f',
  FREELANCE: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  REIMBURSEMENTS: 'e64774db-a84c-4400-b0c4-99b41fec5518',
  TRANSFER_ANTONIN: '3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a',
  TRANSFER_AMANDINE: '9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d'
} as const;

function detectCategory(description: string, amount: number): string | undefined {
  // Convertir en minuscules et séparer en mots
  const words = description.toLowerCase().split(/[\s,.-]+/);
  
  // Définir les règles de catégorisation
  const rules = [
    // Virements (à vérifier en premier car plus spécifique)
    // On vérifie d'abord Antonin car plus spécifique (sinon "antonin" pourrait être détecté comme "amandine")
    { keywords: ['antonin', 'ant', 'ab'], category: CATEGORY_IDS.TRANSFER_ANTONIN },
    { keywords: ['amandine', 'ar'], category: CATEGORY_IDS.TRANSFER_AMANDINE },
    
    // Alimentation
    { keywords: ['carrefour', 'leclerc', 'auchan', 'lidl', 'intermarche', 'franprix', 'monoprix', 'casino', 'picard'], category: CATEGORY_IDS.GROCERIES },
    { keywords: ['restaurant', 'resto', 'mcdo', 'mcdonald', 'burger', 'pizza', 'sushi', 'kebab'], category: CATEGORY_IDS.RESTAURANT },
    { keywords: ['bar', 'pub', 'café', 'cafe', 'brasserie', 'biere', 'bière'], category: CATEGORY_IDS.BAR },
    
    // Transport
    { keywords: ['sncf', 'ratp', 'navigo', 'metro', 'bus', 'train', 'tram', 'transilien'], category: CATEGORY_IDS.PUBLIC_TRANSPORT },
    { keywords: ['uber', 'taxi', 'vtc', 'bolt', 'heetch'], category: CATEGORY_IDS.TAXI },
    { keywords: ['essence', 'carburant', 'total', 'shell', 'bp', 'esso'], category: CATEGORY_IDS.FUEL },
    
    // Logement
    { keywords: ['loyer', 'rent'], category: CATEGORY_IDS.RENT },
    { keywords: ['edf', 'engie', 'electricite', 'gaz', 'veolia', 'suez'], category: CATEGORY_IDS.UTILITIES },
    { keywords: ['free', 'orange', 'sfr', 'bouygues', 'sosh'], category: CATEGORY_IDS.INTERNET },
    { keywords: ['hotel', 'airbnb', 'booking', 'abritel', 'gite'], category: CATEGORY_IDS.HOTEL },
    
    // Loisirs
    { keywords: ['cinema', 'theatre', 'concert', 'spectacle', 'musee', 'ugc', 'pathe', 'gaumont'], category: CATEGORY_IDS.ENTERTAINMENT },
    { keywords: ['sport', 'fitness', 'gym', 'piscine', 'basic', 'neoness'], category: CATEGORY_IDS.SPORT },
    { keywords: ['livre', 'fnac', 'cultura', 'gibert'], category: CATEGORY_IDS.BOOKS },
    { keywords: ['spotify', 'netflix', 'prime', 'disney', 'canal', 'deezer', 'apple'], category: CATEGORY_IDS.SUBSCRIPTIONS },
    
    // Santé
    { keywords: ['pharmacie', 'medecin', 'docteur', 'hopital', 'dentiste', 'ophtalmo'], category: CATEGORY_IDS.HEALTH },
    { keywords: ['mutuelle', 'assurance sante', 'cpam'], category: CATEGORY_IDS.INSURANCE },
    { keywords: ['pilule', 'contraception'], category: CATEGORY_IDS.PILL },
    { keywords: ['complement', 'vitamine', 'proteine', 'omega'], category: CATEGORY_IDS.SUPPLEMENTS },
    
    // Shopping
    { keywords: ['zara', 'uniqlo', 'hm', 'celio', 'jules', 'pull', 'kiabi'], category: CATEGORY_IDS.CLOTHING },
    { keywords: ['fnac', 'darty', 'apple', 'samsung', 'boulanger', 'ldlc'], category: CATEGORY_IDS.ELECTRONICS },
    { keywords: ['ikea', 'but', 'conforama', 'maisons', 'leroy', 'castorama'], category: CATEGORY_IDS.HOME },
    { keywords: ['sephora', 'marionnaud', 'yves', 'nocibe', 'parfum'], category: CATEGORY_IDS.BEAUTY },
    { keywords: ['bijou', 'bijoux', 'swarovski', 'pandora', 'accessoire'], category: CATEGORY_IDS.JEWELRY },
    
    // Vétérinaire
    { keywords: ['veterinaire', 'veto', 'clinique vet', 'animaux'], category: CATEGORY_IDS.VETERINARY },
    
    // Services
    { keywords: ['assurance', 'banque', 'impots', 'poste', 'notaire', 'avocat'], category: CATEGORY_IDS.SERVICES }
  ];

  // Détecter la catégorie basée sur les mots-clés
  for (const rule of rules) {
    // Vérifier si un des mots de la description correspond exactement à un mot-clé
    if (rule.keywords.some(keyword => words.includes(keyword))) {
      return rule.category;
    }
  }

  // Catégorisation basée sur le montant
  if (amount > 0) {
    if (words.includes('salaire')) return CATEGORY_IDS.SALARY;
    if (words.includes('freelance')) return CATEGORY_IDS.FREELANCE;
    if (words.includes('remboursement')) return CATEGORY_IDS.REIMBURSEMENTS;
    
    // Si c'est un virement (détecté par le préfixe VIR)
    if (words[0] === 'vir') {
      // On a déjà vérifié les mots-clés spécifiques plus haut,
      // donc si on arrive ici c'est qu'on n'a pas trouvé de correspondance
      return CATEGORY_IDS.INCOME;
    }
    
    return CATEGORY_IDS.INCOME; // Catégorie par défaut pour les revenus
  }

  // Si aucune catégorie n'a été trouvée, utiliser la catégorie "Autre"
  return CATEGORY_IDS.OTHER;
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

  // Extraire l'année du document si possible
  let documentYear = "";
  const yearMatch = text.match(/\b20\d{2}\b/);
  if (yearMatch) {
    documentYear = yearMatch[0];
  }

  // Expression régulière pour trouver les transactions
  const transactionRegex = /(\d{2}\/\d{2})\s+(.+?)\s+([-]?\d+(?:[,.]\d{2})?)\s*€?/g;
  let match;

  while ((match = transactionRegex.exec(text)) !== null) {
    const amount = parseFloat(match[3].replace(',', '.'));
    const dateParts = match[1].split('/');
    // Si l'année n'a pas été trouvée, utiliser l'année en cours
    const year = documentYear || new Date().getFullYear().toString();
    
    transactions.push({
      id: uuidv4(),
      date: `${year}-${dateParts[1]}-${dateParts[0]}`,
      description: match[2].trim(),
      amount: amount,
      type: amount < 0 ? 'expense' as TransactionType : 'income' as TransactionType,
      merchant: extractMerchantFromDescription(match[2].trim()),
      category_id: detectCategory(match[2].trim(), amount)
    });
  }

  const validTransactions = await validateTransactionsBatch(transactions);
  return validTransactions.valid;
}
