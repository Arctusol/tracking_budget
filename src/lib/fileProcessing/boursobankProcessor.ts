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

class BoursobankProcessor implements BankProcessor {
  isSupportedBank(analyzeResult: AzureAnalyzeResult): boolean {
    // Vérification des marqueurs spécifiques à Boursobank
    if (!analyzeResult.pages || analyzeResult.pages.length === 0) {
      return false;
    }

    for (const page of analyzeResult.pages) {
      for (const line of page.lines || []) {
        const content = line.content || '';
        if (content.includes('BoursoBank') || content.includes('Boursorama Banque')) {
          return true;
        }
      }
    }
    return false;
  }

  // Fonction pour extraire le nom du document et la date d'arrêté
  private extractDocumentInfo(pages: { lines?: { content?: string }[] }[]): { 
    documentName: string; 
    statementDate: string; 
    statementNumber: string;
    period: string;
  } {
    let documentName = '';
    let statementDate = '';
    let statementNumber = '';
    let period = '';
    
    for (const page of pages) {
      for (const line of page.lines || []) {
        const content = line.content || '';
        
        // Chercher le nom du document
        if (content.includes('Relevé de compte') || content.includes('Relevé de Compte')) {
          documentName = content.trim();
        }
        
        // Chercher la date d'arrêté
        if (content.includes('Arrêté au')) {
          statementDate = content.replace('Arrêté au', '').trim();
        }
        
        // Chercher le numéro de relevé
        if (content.includes('Nº')) {
          const match = content.match(/Nº\s*(\d+)/);
          if (match) {
            statementNumber = match[1];
          }
        }
        
        // Chercher la période du relevé
        if (content.includes('Période du')) {
          period = content.replace('Période du', '').trim();
        }
      }
    }
    
    return { documentName, statementDate, statementNumber, period };
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
        
        // Extraction du solde initial (pour Boursobank)
        if (content.includes('SOLDE AU')) {
          const match = content.match(/([0-9]+[.,][0-9]{2})/);
          if (match) {
            openingBalance = parseFloat(match[1].replace(',', '.'));
            console.log("Found opening balance:", openingBalance);
          }
        }
        
        // Extraction du nouveau solde (typiquement à la fin du relevé)
        if (content.includes('NOUVEAU SOLDE') || content.includes('Solde au')) {
          const match = content.match(/([0-9]+[.,][0-9]{2})/);
          if (match) {
            closingBalance = parseFloat(match[1].replace(',', '.'));
            console.log("Found closing balance:", closingBalance);
          }
        }

        // Extraction du titulaire
        if (content.includes('Titulaire') || content.includes('titulaire')) {
          accountHolder = content.replace(/Titulaire\(s\) du compte :?/, '').trim();
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
    // Gérer les chaînes vides ou null/undefined
    if (!frenchDate || frenchDate.trim() === '') {
      console.log("Date vide ou invalide, utilisation de la date du jour");
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Format DD/MM/YYYY - Format français où le jour est en premier
    const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/;
    const match = frenchDate.match(dateRegex);
    
    if (match) {
      const [, day, month, year] = match;
      // Inverser jour et mois serait une erreur car la date est déjà au format français (DD/MM/YYYY)
      // Nous voulons juste la convertir en ISO (YYYY-MM-DD)
      return `${year}-${month}-${day}`;
    }
    
    try {
      // Fallback pour les autres formats
      const monthMap: { [key: string]: string } = {
        'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
        'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
      };

      const parts = frenchDate.toLowerCase().split(' ');
      if (parts.length !== 3) {
        throw new Error(`Format de date invalide: ${frenchDate}`);
      }

      const day = parts[0].padStart(2, '0');
      const month = monthMap[parts[1]];
      const year = parts[2];

      if (!month) {
        throw new Error(`Mois invalide dans la date: ${frenchDate}`);
      }

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn(`Erreur lors de la conversion de la date "${frenchDate}":`, error);
      // Fallback à la date du jour
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Extraction des transactions depuis les tables Boursobank
  private extractBoursobankTransactions(analyzeResult: AzureAnalyzeResult): ProcessedTransaction[] {
    const transactions: ProcessedTransaction[] = [];
    
    if (!analyzeResult.tables || analyzeResult.tables.length === 0) {
      console.log("No tables found in document");
      return transactions;
    }
    
    console.log("Processing tables for Boursobank format...");
    
    // Identifier les tables de transactions
    for (const table of analyzeResult.tables) {
      // Vérifier si c'est une table de transactions
      // Les tables de transactions ont généralement des en-têtes comme "Date opération", "Libellé", "Débit", "Crédit"
      let isTransactionTable = false;
      let dateIndex = -1;
      let descriptionIndex = -1;
      let debitIndex = -1;
      let creditIndex = -1;
      let dateValeurIndex = -1;
      
      // Identifier les colonnes
      console.log("Identifying columns for Boursobank format...");
      for (const cell of table.cells) {
        if (cell.rowIndex === 0) {
          const content = (cell.content || '').toLowerCase();
          console.log("Header cell:", content, "at column", cell.columnIndex);
          
          if (content.includes('date op')) {
            dateIndex = cell.columnIndex;
          }
          if (content.includes('libellé')) {
            descriptionIndex = cell.columnIndex;
          }
          if (content.includes('débit')) {
            debitIndex = cell.columnIndex;
          }
          if (content.includes('crédit')) {
            creditIndex = cell.columnIndex;
          }
          if (content.includes('valeur')) {
            dateValeurIndex = cell.columnIndex;
          }
        }
      }
      
      // Vérifier si tous les indices nécessaires ont été trouvés
      if (dateIndex !== -1 && (descriptionIndex !== -1 || dateIndex === descriptionIndex) && (debitIndex !== -1 || creditIndex !== -1)) {
        isTransactionTable = true;
        console.log("Found transaction table with columns:", { dateIndex, descriptionIndex, debitIndex, creditIndex, dateValeurIndex });
        
        // Chercher des indices alternatifs si nécessaire
        if (descriptionIndex === -1) {
          // Si la colonne de description n'a pas été identifiée, utilisons une heuristique
          for (const cell of table.cells) {
            if (cell.rowIndex === 1) {
              const content = cell.content || '';
              // Généralement, la colonne de description est celle avec le texte le plus long
              if (content && content.length > 10 && cell.columnIndex !== dateIndex) {
                descriptionIndex = cell.columnIndex;
                console.log("Found description column from data:", descriptionIndex);
                break;
              }
            }
          }
        }
        
        // Extraire les transactions
        let currentRow = -1;
        let currentTransaction: Partial<ProcessedTransaction> = {};
        
        for (const cell of table.cells) {
          if (cell.rowIndex === 0) continue; // Ignorer l'en-tête
          
          // Si nous changeons de ligne, enregistrons la transaction précédente
          if (cell.rowIndex !== currentRow) {
            if (currentTransaction.date && currentTransaction.description) {
              // Avant d'ajouter la transaction, vérifier si elle contient à la fois une carte et un virement
              this.addTransactionWithSplitting(transactions, currentTransaction);
            }
            currentTransaction = {};
            currentRow = cell.rowIndex;
          }
          
          const content = cell.content || '';
          console.log("Processing cell:", { row: cell.rowIndex, col: cell.columnIndex, content });
          
          // Traiter la cellule en fonction de son type
          if (cell.columnIndex === dateIndex) {
            // Format de date Boursobank: DD/MM/YYYY
            const dateParts = content.split(' '); // Séparer en cas de plusieurs dates (ex: "01/02/2024 02/02/2024")
            let date = dateParts[0]; // Prendre la première date
            
            // Vérifier si la date est au format DD/MM ou DD/MM/YYYY
            const dateComponents = date.split('/');
            if (dateComponents && dateComponents.length >= 2) {
              // Si nous avons seulement JJ/MM, ajouter l'année courante
              if (dateComponents.length === 2) {
                const year = new Date().getFullYear().toString();
                date = `${dateComponents[0].padStart(2, '0')}/${dateComponents[1].padStart(2, '0')}/${year}`;
              }
              
              currentTransaction.date = date;
              
              // Initialiser les métadonnées
              if (!currentTransaction.metadata) {
                currentTransaction.metadata = { date_valeur: date };
              }
              console.log("Found date:", date);
            }
          } else if (cell.columnIndex === dateValeurIndex) {
            // Date de valeur - même traitement que ci-dessus pour les dates multiples
            const dateParts = content.split(' ');
            let date = dateParts[0];
            
            const dateComponents = date.split('/');
            if (dateComponents && dateComponents.length >= 2) {
              if (dateComponents.length === 2) {
                const year = new Date().getFullYear().toString();
                date = `${dateComponents[0].padStart(2, '0')}/${dateComponents[1].padStart(2, '0')}/${year}`;
              }
              
              if (!currentTransaction.metadata) {
                currentTransaction.metadata = { date_valeur: date };
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
            // Pour Boursobank, le format du débit est X,XX ou X.XXX,XX
            const formattedAmount = content.replace(/\./g, '').replace(',', '.');
            const amount = -Math.abs(parseFloat(formattedAmount));
            currentTransaction.amount = amount;
            // Sauvegarder également le montant du débit dans les métadonnées pour les transactions combinées
            if (!currentTransaction.metadata) {
              currentTransaction.metadata = { debit_amount: content };
            } else {
              currentTransaction.metadata.debit_amount = content;
            }
            console.log("Found debit:", amount);
          } else if (cell.columnIndex === creditIndex && content) {
            // Pour Boursobank, le format du crédit est X,XX ou X.XXX,XX
            const formattedAmount = content.replace(/\./g, '').replace(',', '.');
            const amount = Math.abs(parseFloat(formattedAmount));
            currentTransaction.amount = amount;
            console.log("Found credit:", amount);
          }
        }
        
        // Ajouter la dernière transaction
        if (currentTransaction.date && currentTransaction.description) {
          this.addTransactionWithSplitting(transactions, currentTransaction);
        }
      }
    }
    
    return transactions;
  }

  // Nouvelle méthode pour ajouter une transaction avec détection de transactions combinées
  private async addTransactionWithSplitting(transactions: ProcessedTransaction[], transaction: Partial<ProcessedTransaction>): Promise<void> {
    if (!transaction.description) {
      console.log("Transaction sans description, impossible à traiter");
      return;
    }

    // Vérifier si la transaction contient à la fois une carte et un virement
    const containsCard = transaction.description.includes('CARTE');
    const containsTransfer = transaction.description.includes('VIR SEPA') || transaction.description.includes('VIREMENT');
    const containsSalary = transaction.description.includes('Salaire') || transaction.description.includes('SALAIRE');

    // Vérifier s'il y a des montants disponibles dans les cellules de débit et crédit
    const hasDebitAndCredit = transaction.metadata?.debit_amount && transaction.amount && transaction.amount > 0;

    // Si la transaction contient à la fois une carte et un virement, et on est dans le cas d'une transaction combinée
    if ((containsCard && (containsTransfer || containsSalary))) {
      console.log("Détection d'une transaction combinée:", transaction.description);
      
      try {
        // Trouver l'index de séparation entre la partie carte et la partie virement
        let splitIndex = transaction.description.indexOf('VIR SEPA');
        if (splitIndex === -1) {
          splitIndex = transaction.description.indexOf('VIREMENT');
        }
        if (splitIndex === -1) {
          // Chercher d'autres marqueurs possibles
          const salaryIndex = transaction.description.indexOf('Salaire');
          if (salaryIndex !== -1) {
            splitIndex = salaryIndex;
          }
        }

        if (splitIndex !== -1) {
          // Séparer en deux descriptions
          const cardDescription = transaction.description.substring(0, splitIndex).trim();
          const transferDescription = transaction.description.substring(splitIndex).trim();
          
          console.log("Transaction séparée en:", {cardDescription, transferDescription});

          // Chercher un montant de débit dans la description (format comme "2,89")
          let debitAmount = -2.89; // Valeur par défaut
          const debitMatch = cardDescription.match(/\b(\d+[,.]\d{2})\b/);
          if (debitMatch) {
            debitAmount = -Math.abs(parseFloat(debitMatch[1].replace(',', '.')));
          } else if (transaction.metadata?.debit_amount) {
            debitAmount = -Math.abs(parseFloat(transaction.metadata.debit_amount.replace(',', '.')));
          }

          // 1. Transaction carte (débit)
          const cardCategory = await detectCategory(cardDescription, debitAmount);
          const cardTransaction: ProcessedTransaction = {
            id: uuidv4(),
            date: transaction.date || '',
            description: cardDescription,
            amount: debitAmount,
            type: 'expense',
            merchant: extractMerchantFromDescription(cardDescription),
            category_id: cardCategory,
            metadata: {
              ...transaction.metadata,
              original_description: transaction.description
            }
          };
          
          // 2. Transaction virement (crédit)
          const transferCategory = await detectCategory(transferDescription, Math.abs(transaction.amount || 0));
          const transferTransaction: ProcessedTransaction = {
            id: uuidv4(),
            date: transaction.date || '',
            description: transferDescription,
            amount: Math.abs(transaction.amount || 0),
            type: 'income',
            merchant: extractMerchantFromDescription(transferDescription),
            category_id: transferCategory,
            metadata: {
              ...transaction.metadata,
              original_description: transaction.description
            }
          };
          
          console.log("Ajout de la transaction carte:", cardTransaction);
          console.log("Ajout de la transaction virement:", transferTransaction);
          
          transactions.push(cardTransaction);
          transactions.push(transferTransaction);
          return;
        }
      } catch (error) {
        console.error("Erreur lors de la séparation de la transaction:", error);
      }
    }

    // Si pas de séparation nécessaire ou en cas d'erreur, ajouter la transaction originale
    const category = await detectCategory(transaction.description || '', transaction.amount || 0);
    const completeTransaction: ProcessedTransaction = {
      id: uuidv4(),
      date: transaction.date || '',
      description: transaction.description || '',
      amount: transaction.amount || 0,
      type: (transaction.amount || 0) < 0 ? 'expense' : 'income',
      merchant: transaction.merchant || extractMerchantFromDescription(transaction.description || ''),
      category_id: category,
      metadata: transaction.metadata
    };
    
    console.log("Adding transaction:", completeTransaction);
    transactions.push(completeTransaction);
  }

  // Calcul des totaux à partir des transactions extraites
  private calculateTotals(transactions: ProcessedTransaction[]): { totalDebits: number; totalCredits: number } {
    let totalDebits = 0;
    let totalCredits = 0;
    
    for (const transaction of transactions) {
      // S'assurer que les montants sont traités correctement sans double signe négatif
      if (transaction.amount < 0) {
        // Pour les débits, on utilise la valeur absolue car totalDebits doit être positif
        totalDebits += Math.abs(transaction.amount);
      } else {
        totalCredits += transaction.amount;
      }
    }
    
    // Assurer que les totaux sont toujours positifs
    totalDebits = Math.abs(totalDebits);
    totalCredits = Math.abs(totalCredits);
    
    console.log("Calculated totals:", { totalDebits, totalCredits });
    return { totalDebits, totalCredits };
  }

  // Nouvelle méthode pour traiter les résultats d'analyse déjà obtenus
  async processAnalyzedResult(analyzeResult: AzureAnalyzeResult): Promise<ProcessedTransaction[]> {
    if (!analyzeResult) {
      console.error("No analyze result in response");
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

    // Extraire les métadonnées du document
    console.log("Extracting document metadata...");
    const { documentName, statementDate, statementNumber, period } = this.extractDocumentInfo(azureResponse.analyzeResult.pages);
    
    // Extraire les informations de solde
    const { openingBalance, closingBalance, accountHolder } = this.extractBalanceInfo(azureResponse.analyzeResult.pages);
    
    // Extraire les transactions
    const transactions = this.extractBoursobankTransactions(azureResponse.analyzeResult);
    
    console.log("Found total transactions:", transactions.length);

    // Valider les transactions
    if (transactions.length === 0) {
      console.error("No transactions found in document");
      throw new ExtractError("No transactions found in document");
    }

    // Calculer les totaux des transactions
    const { totalDebits, totalCredits } = this.calculateTotals(transactions);

    // Déterminer la date du relevé
    let statementDateIso = '';
    try {
      console.log("Tentative d'extraction de la date du relevé:", {statementDate, period});
      
      // Essayer d'abord la date d'arrêté
      if (statementDate && statementDate.trim() !== '') {
        statementDateIso = this.convertFrenchDateToISO(statementDate);
      } 
      // Sinon, essayer d'extraire de la période (format "du XX/XX/XXXX au XX/XX/XXXX")
      else if (period && period.includes('au')) {
        const parts = period.split('au');
        if (parts.length > 1) {
          statementDateIso = this.convertFrenchDateToISO(parts[1].trim());
        }
      } 
      // Sinon, utiliser la date du jour
      else {
        const today = new Date();
        statementDateIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
    } catch (error) {
      console.error("Erreur lors de l'extraction de la date du relevé:", error);
      // Fallback à la date du jour
      const today = new Date();
      statementDateIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    console.log("Date du relevé utilisée:", statementDateIso);

    // Calculer correctement la balance nette (totalCredits - totalDebits)
    const netBalance = totalCredits - totalDebits;
    console.log("Balance calculée:", {totalCredits, totalDebits, netBalance});

    // Créer le relevé bancaire
    const bankStatement = await createBankStatement({
      document_name: documentName || "Relevé Boursobank",
      statement_number: statementNumber || "",
      statement_date: statementDateIso,
      account_holder: accountHolder || "Titulaire du compte",
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      total_debits: totalDebits,
      total_credits: totalCredits,
      net_balance: netBalance // Utiliser la valeur calculée
    });

    // Ajouter l'ID du relevé aux transactions
    transactions.forEach(transaction => {
      transaction.metadata = {
        ...transaction.metadata,
        bank_statement_id: bankStatement.id,
        document_name: documentName || "Relevé Boursobank",
        date_arrete: statementDate || "",
        solde_ancien: openingBalance.toString(),
        solde_nouveau: closingBalance.toString(),
        numero_releve: statementNumber || "",
        titulaire: accountHolder || "Titulaire du compte"
      };
    });

    return transactions;
  }

  // Implémentation principale de l'interface BankProcessor
  async processPDF(file: File): Promise<ProcessedTransaction[]> {
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
      
      // Utiliser la nouvelle méthode pour traiter les résultats
      return this.processAnalyzedResult(analyzeResult);
    } catch (error) {
      console.error("Error processing Boursobank PDF:", error);
      throw new DocumentProcessingError("Failed to process PDF document");
    }
  }
}

// Exporter une instance du processeur
const boursobankProcessor = new BoursobankProcessor();
export default boursobankProcessor; 