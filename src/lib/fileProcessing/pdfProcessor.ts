import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import { getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";
import { ProcessedTransaction, AzureResponse, BankProcessor, AzureAnalyzeResult } from "./types";
import { 
  DocumentAnalysisError,
  ConfigurationError,
  ExtractError,
  DocumentProcessingError,
} from "../errors/documentProcessingErrors";
import { detectCategory } from "./categoryDetection";
import { extractMerchantFromDescription } from "./merchantExtraction";
import { v4 as uuidv4 } from 'uuid';
import { createBankStatement } from '../services/bank-statement.service';
import bankProcessorFactory from './bankProcessorFactory';
import boursobankProcessor from './boursobankProcessor';

// Classe qui implémente le processeur standard (banque originale - Fortuneo)
class StandardPdfProcessor implements BankProcessor {
  // Fonction pour extraire le nom du document et la date d'arrêté
  private extractDocumentInfo(pages: { lines?: { content?: string }[] }[]): { documentName: string; statementDate: string; statementNumber: string } {
    let documentName = '';
    let statementDate = '';
    let statementNumber = '';
    
    for (const page of pages) {
      for (const line of page.lines || []) {
        const content = line.content || '';
        
        // Get the full document name from the first line that contains "Relevé de Compte"
        if (content.includes('Relevé de Compte')) {
          const fullLine = content.trim();
          documentName = fullLine; // Keep the full line as document name
        }
        if (content.includes('Arrêté au')) {
          statementDate = content.replace('Arrêté au', '').trim();
        }
        if (content.includes('Nº')) {
          const match = content.match(/Nº\s*(\d+)/);
          if (match) {
            statementNumber = match[1];
          }
        }
      }
    }
    
    return { documentName, statementDate, statementNumber };
  }

  // Fonction pour extraire les soldes et calculer les totaux
  private extractBalanceInfo(pages: { lines?: { content?: string }[] }[]): { 
    openingBalance: number;
    closingBalance: number;
    totalDebits: number;
    totalCredits: number;
    accountHolder: string;
  } {
    let openingBalance = 0;
    let closingBalance = 0;
    let totalDebits = 0;
    let totalCredits = 0;
    let accountHolder = '';

    for (const page of pages) {
      for (const line of page.lines || []) {
        const content = line.content || '';
        
        // Extraction du solde initial (ANCIEN SOLDE CRÉDITEUR)
        if (content.includes('ANCIEN SOLDE')) {
          const match = content.match(/([0-9]+[.,][0-9]{2})\s*€/);
          if (match) {
            openingBalance = parseFloat(match[1].replace(',', '.'));
            console.log("Found opening balance:", openingBalance);
          }
        }
        
        // Extraction du nouveau solde (NOUVEAU SOLDE CRÉDITEUR)
        if (content.includes('NOUVEAU SOLDE')) {
          const match = content.match(/([0-9]+[.,][0-9]{2})\s*€/);
          if (match) {
            closingBalance = parseFloat(match[1].replace(',', '.'));
            console.log("Found closing balance:", closingBalance);
          }
        }

        // Extraction des totaux
        if (content.includes('TOTAL DES OPÉRATIONS')) {
          const debitsMatch = content.match(/Débit\s*([0-9]+[.,][0-9]{2})/);
          const creditsMatch = content.match(/Crédit\s*([0-9]+[.,][0-9]{2})/);
          
          if (debitsMatch) {
            totalDebits = parseFloat(debitsMatch[1].replace(',', '.'));
          }
          if (creditsMatch) {
            totalCredits = parseFloat(creditsMatch[1].replace(',', '.'));
          }
        }

        // Extraction du titulaire
        if (content.includes('Titulaire(s) du compte :')) {
          accountHolder = content.replace('Titulaire(s) du compte :', '').trim();
          console.log("Found account holder:", accountHolder);
        }
      }
    }

    return { 
      openingBalance, 
      closingBalance,
      totalDebits,
      totalCredits,
      accountHolder
    };
  }

  // Helper function to convert French date to ISO format
  private convertFrenchDateToISO(frenchDate: string): string {
    const monthMap: { [key: string]: string } = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
      'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
      'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };

    const parts = frenchDate.toLowerCase().split(' ');
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${frenchDate}`);
    }

    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]];
    const year = parts[2];

    if (!month) {
      throw new Error(`Invalid month in date: ${frenchDate}`);
    }

    return `${year}-${month}-${day}`;
  }

  // Méthode pour vérifier si c'est le processeur adapté pour ce document
  isSupportedBank(analyzeResult: AzureAnalyzeResult): boolean {
    if (!analyzeResult.pages || analyzeResult.pages.length === 0) {
      return false;
    }

    // Recherche des marqueurs spécifiques à la banque standard
    for (const page of analyzeResult.pages) {
      for (const line of page.lines || []) {
        const content = line.content || '';
        // Marqueurs spécifiques
        if (content.includes('ANCIEN SOLDE CRÉDITEUR') || content.includes('NOUVEAU SOLDE CRÉDITEUR')) {
          return true;
        }
      }
    }
    
    // Par défaut, c'est le processeur standard
    return false;
  }

  async process(analyzeResult: AzureAnalyzeResult): Promise<ProcessedTransaction[]> {
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
      console.error("No pages found in document");
      throw new ExtractError("No pages found in document");
    }

    const transactions: ProcessedTransaction[] = [];
    let currentTransaction: Partial<ProcessedTransaction> = {};
    let numeroReleve = "";
    let titulaire = "";
    let documentYear = "";
    let totalDebits = 0;
    let totalCredits = 0;

    // Extraire les informations du document
    console.log("Extracting document metadata...");
    const { documentName, statementDate, statementNumber } = this.extractDocumentInfo(azureResponse.analyzeResult.pages || []);
    const { openingBalance, closingBalance, accountHolder, totalDebits: extractedDebits, totalCredits: extractedCredits } = this.extractBalanceInfo(azureResponse.analyzeResult.pages || []);

    // Mise à jour des variables
    numeroReleve = statementNumber;
    titulaire = accountHolder;

    // Extraire le numéro de relevé, le titulaire et l'année des pages
    console.log("Extracting document metadata...");
    for (const page of azureResponse.analyzeResult.pages) {
      for (const line of page.lines || []) {
        const content = line.content || '';
        // Recherche du numéro de relevé qui contient généralement l'année
        if (content.includes("Nº")) {
          const yearMatch = content.match(/\b20\d{2}\b/);
          if (yearMatch) {
            documentYear = yearMatch[0];
            console.log("Found document year:", documentYear);
          }
        }
      }
    }

    // Parcourir les tables pour extraire les transactions
    console.log("Processing tables...");
    if (azureResponse.analyzeResult.tables) {
      console.log("Found", azureResponse.analyzeResult.tables.length, "tables");
      for (const table of azureResponse.analyzeResult.tables) {
        let dateIndex = -1;
        let dateValeurIndex = -1;
        let descriptionIndex = -1;
        let debitIndex = -1;
        let creditIndex = -1;

        // Identifier les colonnes
        console.log("Identifying columns...");
        for (const cell of table.cells) {
          if (cell.rowIndex === 0) {
            const content = cell.content?.toLowerCase() || '';
            console.log("Header cell:", content, "at column", cell.columnIndex);
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

        console.log("Column indices:", { dateIndex, dateValeurIndex, descriptionIndex, debitIndex, creditIndex });

        // Si on n'a pas trouvé les colonnes nécessaires, on cherche dans la première ligne de données
        if (dateIndex === -1 || descriptionIndex === -1) {
          for (const cell of table.cells) {
            if (cell.rowIndex === 1) {
              const content = cell.content || '';
              if (content && /^\d{2}\/\d{2}$/.test(content)) {
                dateIndex = cell.columnIndex;
                console.log("Found date column from data:", dateIndex);
              }
              if (content && content.length > 10) {
                descriptionIndex = cell.columnIndex;
                console.log("Found description column from data:", descriptionIndex);
              }
            }
          }
        }

        // Extraire les transactions
        let currentRow = -1;
        console.log("Extracting transactions...");
        for (const cell of table.cells) {
          if (cell.rowIndex === 0) continue; // Skip header

          if (cell.rowIndex !== currentRow) {
            if (currentTransaction.date && currentTransaction.description) {
              const completeTransaction: ProcessedTransaction = {
                id: uuidv4(),
                date: currentTransaction.date,
                description: currentTransaction.description,
                amount: currentTransaction.amount || 0,
                type: (currentTransaction.amount || 0) < 0 ? 'expense' : 'income',
                merchant: currentTransaction.merchant || extractMerchantFromDescription(currentTransaction.description),
                category_id: detectCategory(currentTransaction.description, currentTransaction.amount || 0),
                metadata: {
                  date_valeur: currentTransaction.metadata?.date_valeur || currentTransaction.date,
                  numero_releve: numeroReleve,
                  titulaire: titulaire
                }
              };
              console.log("Adding transaction:", completeTransaction);
              transactions.push(completeTransaction);
            }
            currentTransaction = {};
            currentRow = cell.rowIndex;
          }

          const content = cell.content || '';
          console.log("Processing cell:", { row: cell.rowIndex, col: cell.columnIndex, content });

          if (cell.columnIndex === dateIndex) {
            const dateParts = content.split('/');
            if (dateParts && dateParts.length === 2) {
              const year = documentYear || new Date().getFullYear().toString();
              const date = `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${year}`;
              currentTransaction.date = date;
              if (!currentTransaction.metadata) {
                currentTransaction.metadata = { date_valeur: date, numero_releve: numeroReleve, titulaire: titulaire };
              }
              console.log("Found date:", date);
            }
          } else if (cell.columnIndex === dateValeurIndex) {
            const dateParts = content.split('/');
            if (dateParts && dateParts.length === 2) {
              const year = documentYear || new Date().getFullYear().toString();
              const date = `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${year}`;
              if (!currentTransaction.metadata) {
                currentTransaction.metadata = { date_valeur: date, numero_releve: numeroReleve, titulaire: titulaire };
              } else {
                currentTransaction.metadata.date_valeur = date;
              }
              console.log("Found date valeur:", date);
            }
          } else if (cell.columnIndex === descriptionIndex) {
            currentTransaction.description = content;
            currentTransaction.merchant = extractMerchantFromDescription(content);
            console.log("Found description:", content);
          } else if (cell.columnIndex === debitIndex && content) {
            const amount = parseFloat(content.replace(',', '.')) * -1;
            currentTransaction.amount = amount;
            totalDebits += Math.abs(amount);
            console.log("Found debit:", amount);
          } else if (cell.columnIndex === creditIndex && content) {
            const amount = parseFloat(content.replace(',', '.'));
            currentTransaction.amount = amount;
            totalCredits += amount;
            console.log("Found credit:", amount);
          }
        }

        // Ajouter la dernière transaction
        if (currentTransaction.date && currentTransaction.description) {
          const completeTransaction: ProcessedTransaction = {
            id: uuidv4(),
            date: currentTransaction.date,
            description: currentTransaction.description,
            amount: currentTransaction.amount || 0,
            type: (currentTransaction.amount || 0) < 0 ? 'expense' : 'income',
            merchant: currentTransaction.merchant || extractMerchantFromDescription(currentTransaction.description),
            category_id: detectCategory(currentTransaction.description, currentTransaction.amount || 0),
            metadata: {
              date_valeur: currentTransaction.metadata?.date_valeur || currentTransaction.date,
              numero_releve: numeroReleve,
              titulaire: titulaire
            }
          };
          console.log("Adding final transaction:", completeTransaction);
          transactions.push(completeTransaction);
        }
      }
    }

    console.log("Found total transactions:", transactions.length);

    // Valider et catégoriser les transactions
    if (transactions.length === 0) {
      console.error("No transactions found in document");
      throw new ExtractError("No transactions found in document");
    }

    // Créer le relevé bancaire
    const bankStatement = await createBankStatement({
      document_name: documentName,
      statement_number: numeroReleve,
      statement_date: this.convertFrenchDateToISO(statementDate),
      account_holder: titulaire,
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      total_debits: totalDebits,
      total_credits: totalCredits,
      net_balance: totalCredits - totalDebits
    });

    // Ajouter l'ID du relevé aux transactions
    transactions.forEach(transaction => {
      transaction.metadata = {
        ...transaction.metadata,
        bank_statement_id: bankStatement.id,
        document_name: documentName,
        date_arrete: statementDate,
        solde_ancien: openingBalance.toString(),
        solde_nouveau: closingBalance.toString()
      };
    });

    return transactions;
  }

  // Cette méthode est maintenue pour compatibilité avec l'interface BankProcessor
  async processPDF(file: File): Promise<ProcessedTransaction[]> {
    throw new Error('Cette méthode ne devrait plus être utilisée directement. Utilisez process() à la place.');
  }
}

// Instance du processeur standard
const standardPdfProcessor = new StandardPdfProcessor();

// Nouvelle implémentation pour Boursobank
class BoursobankAdapter {
  async process(analyzeResult: AzureAnalyzeResult): Promise<ProcessedTransaction[]> {
    return boursobankProcessor.processAnalyzedResult(analyzeResult);
  }
}

const boursobankAdapter = new BoursobankAdapter();

// Fonction principale qui utilise la factory pour traiter le PDF
export async function processPDF(file: File, bankType?: string): Promise<ProcessedTransaction[]> {
  if (!file) {
    throw new DocumentProcessingError("No file provided");
  }

  try {
    const fileBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    const endpoint = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      throw new ConfigurationError("Azure Document Intelligence credentials not configured");
    }

    const client = DocumentIntelligence(endpoint, { key });

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
    console.log("Waiting for Azure analysis to complete...");
    const result = await poller.pollUntilDone();
    console.log("Azure analysis completed", result);
    
    if (!result.body || typeof result.body !== 'object' || !('analyzeResult' in result.body)) {
      console.error("Invalid response format:", result.body);
      throw new ExtractError("Invalid response format from Azure");
    }

    const analyzeResult = result.body.analyzeResult as AzureAnalyzeResult;
    
    if (!analyzeResult) {
      console.error("No analyze result in response");
      throw new ExtractError("No analyze result in response");
    }

    // Sélection du processeur en fonction du choix de l'utilisateur
    if (bankType === 'fortuneo') {
      console.log("Utilisation du processeur Fortuneo (standard)");
      return await standardPdfProcessor.process(analyzeResult);
    } else if (bankType === 'boursobank') {
      console.log("Utilisation du processeur Boursobank");
      return await boursobankAdapter.process(analyzeResult);
    } else {
      // Détection automatique
      console.log("Détection automatique de la banque...");
      if (boursobankProcessor.isSupportedBank(analyzeResult)) {
        console.log("Format Boursobank détecté");
        return await boursobankAdapter.process(analyzeResult);
      } else {
        console.log("Format standard (Fortuneo) détecté ou par défaut");
        return await standardPdfProcessor.process(analyzeResult);
      }
    }
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw new DocumentProcessingError("Failed to process PDF document");
  }
}
