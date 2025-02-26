import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { ProcessedTransaction } from "./types";
import { TransactionType } from "../../types/transaction";
import { validateTransactions } from "../validation";
import { detectCategory } from "./categoryDetection";
import { extractMerchantFromDescription } from "./merchantExtraction";
import { transactionMatcher } from "../services/transactionMatcher";

// Helper function to convert DD/MM/YYYY to YYYY-MM-DD
function convertToISODate(date: string | number): string {
  if (typeof date === 'number') {
    // Si c'est un numéro de série Excel, convertir en date JavaScript
    const excelDate = new Date(Math.round((date - 25569) * 86400 * 1000));
    return excelDate.toISOString().slice(0, 10);
  }
  
  // Si c'est une chaîne, traiter selon le format
  const dateStr = String(date);
  const parts = dateStr.split(/[-/]/); // Accepte les tirets ou les slashs
  if (parts.length !== 3) return "";
  
  // En format français, le jour est en premier
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  
  // Assurez-vous que l'année est sur 4 chiffres
  const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
  
  // Retourne au format YYYY-MM-DD pour Supabase
  return `${year}-${month}-${day}`;
}

// Fonction pour extraire la date d'une chaîne qui peut contenir d'autres informations
function extractDateFromString(dateStr: string): string {
  // Recherche un motif de date au format DD/MM/YYYY ou DD/MM/YY
  const datePattern = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
  const match = dateStr.match(datePattern);
  
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3].length === 2 ? '20' + match[3] : match[3];
    return `${year}-${month}-${day}`;
  }
  
  return "";
}

// Fonction pour extraire la date d'une description de transaction (ex: "CARTE 30/01/24 CARREFOUR CITY")
function extractDateFromDescription(description: string): string {
  const datePattern = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
  const match = description.match(datePattern);
  
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3].length === 2 ? '20' + match[3] : match[3];
    return `${year}-${month}-${day}`;
  }
  
  return "";
}

function isBankStatement(sheetName: string, headers: string[]): boolean {
  const bankHeaders = ["Date opération", "Date valeur", "libellé", "Débit", "Crédit"];
  const hasMatchingHeaders = bankHeaders.some(header => 
    headers.some(h => h.includes(header))
  );
  
  // Vérifier si c'est un relevé Boursobank
  const isBoursobank = headers.some(h => 
    h.includes("BOURSOBANK") || 
    h.includes("Extrait de votre compte")
  );
  
  return sheetName.toLowerCase().includes("historique") || 
         sheetName.toLowerCase().includes("operations") ||
         sheetName.toLowerCase().includes("table") ||
         hasMatchingHeaders ||
         isBoursobank;
}

// Fonction spécifique pour traiter les relevés Boursobank
async function processBoursobankRow(row: any, dateColumn: string | null, descriptionColumn: string | null, debitColumn: string | null, creditColumn: string | null): Promise<ProcessedTransaction> {
  let amount = 0;
  let type: TransactionType = 'expense';
  let date = "";
  let description = "";

  console.log("Traitement de la ligne Boursobank:", JSON.stringify(row));

  // 1. Extraire la date - Boursobank utilise généralement la première colonne pour la date
  const firstColumnKey = Object.keys(row)[0]; // Première colonne (contient souvent la date)
  if (typeof row[firstColumnKey] === 'number' && row[firstColumnKey] > 40000 && row[firstColumnKey] < 50000) {
    date = convertToISODate(row[firstColumnKey]);
    console.log("Date extraite de la première colonne:", date);
  }
  
  // Si pas de date trouvée, chercher dans les autres colonnes
  if (!date) {
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'number' && value > 40000 && value < 50000) {
        date = convertToISODate(value);
        console.log("Date extraite de la colonne", key, ":", date);
        break;
      }
    }
  }

  // 2. Extraire la description - Boursobank utilise généralement __EMPTY_1 pour la description
  if (row.__EMPTY_1 && typeof row.__EMPTY_1 === 'string') {
    description = row.__EMPTY_1;
    console.log("Description extraite de __EMPTY_1:", description);
  } 
  // Si pas de description trouvée, chercher dans les autres colonnes
  else {
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && 
         (value.includes("CARTE") || 
          value.includes("VIR") || 
          value.includes("PRLV") || 
          value.includes("AVOIR"))) {
        description = value;
        console.log("Description extraite de la colonne", key, ":", description);
        break;
      }
    }
  }

  // 3. Si on a une description mais pas de date, essayer d'extraire la date de la description
  if (description && !date) {
    date = extractDateFromDescription(description);
    if (date) {
      console.log("Date extraite de la description:", date);
    }
  }

  // 4. Extraire le montant - Rechercher dans toutes les colonnes __EMPTY_X
  // Détecter les colonnes qui contiennent probablement des montants
  const amountColumns = detectAmountColumnsInRow(row);
  console.log("Colonnes de montants détectées dans cette ligne:", amountColumns);
  
  // Vérifier spécifiquement la colonne __EMPTY_21 qui contient souvent les crédits dans Boursobank
  if (row['__EMPTY_21'] && typeof row['__EMPTY_21'] === 'string' && row['__EMPTY_21'].trim() !== '') {
    const creditValue = row['__EMPTY_21'].trim();
    console.log("Valeur potentielle de crédit trouvée dans __EMPTY_21:", creditValue);
    
    // Format français: 1.234,56 (point comme séparateur de milliers, virgule comme séparateur décimal)
    if (/^[-+]?[\d\s\.]+,\d+$/.test(creditValue)) {
      const normalizedValue = creditValue.replace(/\./g, '').replace(',', '.');
      if (!isNaN(parseFloat(normalizedValue))) {
        amount = parseFloat(normalizedValue);
        type = 'income';
        console.log("Crédit détecté dans __EMPTY_21:", amount);
      }
    }
  }
  
  // Parcourir les colonnes de montants détectées si on n'a pas encore trouvé de montant
  if (amount === 0) {
    for (const key of amountColumns) {
      const value = row[key];
      if (!value || value === 0) continue;
      
      // Vérifier si la valeur est un nombre ou une chaîne qui peut être convertie en nombre
      if (typeof value === 'number') {
        amount = value;
        // Déterminer si c'est un débit ou un crédit en fonction de la position
        // Dans Boursobank, les colonnes 17-20 sont généralement des débits et 21-23 des crédits
        type = (key === '__EMPTY_21' || key === '__EMPTY_22' || key === '__EMPTY_23') ? 'income' : 'expense';
        console.log(`Montant trouvé dans la colonne ${key}:`, amount, "type:", type);
        break;
      } else if (typeof value === 'string' && value.trim() !== '') {
        // Essayer de convertir la chaîne en nombre
        let cleanValue = value.trim();
        
        // Format français: 1.234,56 (point comme séparateur de milliers, virgule comme séparateur décimal)
        if (/^[-+]?[\d\s\.]+,\d+$/.test(cleanValue)) {
          cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        } else {
          // Format standard ou autres formats
          cleanValue = cleanValue.replace(/,/g, '').replace(/\s/g, '');
        }
        
        if (!isNaN(parseFloat(cleanValue))) {
          amount = parseFloat(cleanValue);
          // Déterminer si c'est un débit ou un crédit en fonction de la position
          type = (key === '__EMPTY_21' || key === '__EMPTY_22' || key === '__EMPTY_23') ? 'income' : 'expense';
          console.log(`Montant (chaîne) trouvé dans la colonne ${key}:`, amount, "type:", type);
          break;
        }
      }
    }
  }
  
  // Si toujours pas de montant, chercher dans toutes les colonnes
  if (amount === 0) {
    for (const [key, value] of Object.entries(row)) {
      // Ignorer les colonnes qui contiennent probablement des dates ou descriptions
      if (key === firstColumnKey || key === '__EMPTY_1' || key === '__EMPTY_2' || key === '__EMPTY_3') {
        continue;
      }
      
      // Vérifier si la valeur est un nombre ou une chaîne qui peut être convertie en nombre
      if (typeof value === 'number' && value !== 0 && value < 10000) {
        amount = value;
        // Déterminer si c'est un débit ou un crédit en fonction de la position
        type = (key === '__EMPTY_21' || key === '__EMPTY_22' || key === '__EMPTY_23') ? 'income' : 'expense';
        console.log(`Montant trouvé dans la colonne ${key}:`, amount, "type:", type);
        break;
      } else if (typeof value === 'string' && value.trim() !== '') {
        // Essayer de convertir la chaîne en nombre
        let cleanValue = value.trim();
        
        // Format français: 1.234,56 (point comme séparateur de milliers, virgule comme séparateur décimal)
        if (/^[-+]?[\d\s\.]+,\d+$/.test(cleanValue)) {
          cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        } else {
          // Format standard ou autres formats
          cleanValue = cleanValue.replace(/,/g, '').replace(/\s/g, '');
        }
        
        if (!isNaN(parseFloat(cleanValue))) {
          amount = parseFloat(cleanValue);
          // Déterminer si c'est un débit ou un crédit en fonction de la position
          type = (key === '__EMPTY_21' || key === '__EMPTY_22' || key === '__EMPTY_23') ? 'income' : 'expense';
          console.log(`Montant (chaîne) trouvé dans la colonne ${key}:`, amount, "type:", type);
          break;
        }
      }
    }
  }

  console.log("[ExcelProcessor] Detecting category for transaction:", {
    description: description,
    amount: amount,
    date: date
  });
  
  const category_id = await detectCategory(description, amount);
  console.log("[ExcelProcessor] Category detection result:", category_id);

  const merchant = extractMerchantFromDescription(description);

  // Vérification supplémentaire pour les virements entrants basée sur la description
  if (amount !== 0 && (
      description.includes("VIR SEPA") || 
      description.includes("VIREMENT") || 
      description.includes("Salaire") ||
      description.includes("SALAIRE") ||
      description.includes("Apperture")
    )) {
    // Vérifier si c'est probablement un virement entrant
    if (description.includes("Apperture") || 
        description.includes("Salaire") || 
        description.includes("SALAIRE") || 
        description.includes("CAF") ||
        description.includes("Remboursement")) {
      type = 'income';
      console.log("Type ajusté à 'income' basé sur la description:", description);
    }
  }

  console.log("Transaction traitée:", { date, description, amount, type });

  // Vérification finale pour s'assurer que le type correspond au signe du montant
  const originalAmount = amount;
  if (originalAmount < 0) {
    // Si le montant est négatif, c'est une dépense
    type = 'expense';
    amount = originalAmount; // Garder le montant négatif pour les dépenses
  } else if (originalAmount > 0) {
    // Si le montant est positif et qu'on n'a pas explicitement détecté un revenu
    if (!type || type !== 'income') {
      type = 'expense';
      amount = -originalAmount; // Convertir en négatif pour les dépenses
    } else {
      // C'est un revenu, garder le montant positif
      amount = originalAmount;
    }
  }

  console.log("Montant final et type:", { originalAmount, amount, type });

  return {
    id: uuidv4(),
    date,
    description,
    amount, // Utiliser directement le montant avec le bon signe
    type,
    merchant,
    category_id,
  };
}

// Fonction pour détecter les colonnes qui contiennent probablement des montants dans une ligne
function detectAmountColumnsInRow(row: any): string[] {
  const amountColumns: string[] = [];
  
  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    
    // Ignorer les colonnes qui contiennent probablement des dates
    if (typeof value === 'number' && value > 40000 && value < 50000) {
      continue;
    }
    
    // Vérifier si c'est un nombre ou une chaîne qui ressemble à un nombre
    if (typeof value === 'number' && value !== 0 && value < 10000) {
      amountColumns.push(key);
      console.log(`Colonne ${key} contient un nombre: ${value}`);
    } else if (typeof value === 'string') {
      // Format français: 1.234,56 (point comme séparateur de milliers, virgule comme séparateur décimal)
      // ou format standard: 1,234.56
      const cleanValue = value.trim();
      
      // Vérifier si c'est un format avec virgule comme séparateur décimal (format français)
      if (/^[-+]?[\d\s\.]+,\d+$/.test(cleanValue)) {
        const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
        if (!isNaN(parseFloat(normalizedValue)) && parseFloat(normalizedValue) < 10000) {
          amountColumns.push(key);
          console.log(`Colonne ${key} contient un montant au format français: ${cleanValue} -> ${normalizedValue}`);
        }
      } 
      // Vérifier si c'est un format standard avec point comme séparateur décimal
      else if (/^[-+]?[\d\s\,]+\.\d+$/.test(cleanValue) || /^[-+]?\d+$/.test(cleanValue)) {
        const normalizedValue = cleanValue.replace(/,/g, '');
        if (!isNaN(parseFloat(normalizedValue)) && parseFloat(normalizedValue) < 10000) {
          amountColumns.push(key);
          console.log(`Colonne ${key} contient un montant au format standard: ${cleanValue} -> ${normalizedValue}`);
        }
      }
    }
  }
  
  return amountColumns;
}

async function processBankStatementRow(row: any): Promise<ProcessedTransaction> {
  // Handle both Débit and Crédit columns
  let amount = 0;
  let type: TransactionType = 'expense';

  if (row["Débit"] && row["Débit"].toString().trim() !== '') {
    amount = typeof row["Débit"] === 'number' 
      ? row["Débit"] 
      : parseFloat(row["Débit"].toString().replace(',', '.'));
    type = 'expense';
  } else if (row["Crédit"] && row["Crédit"].toString().trim() !== '') {
    amount = typeof row["Crédit"] === 'number'
      ? row["Crédit"]
      : parseFloat(row["Crédit"].toString().replace(',', '.'));
    type = 'income';
  }

  const dateValue = row["Date opération"] || row["Date"] || "";
  const date = convertToISODate(dateValue);
  const description = row["libellé"] || row["Libellé"] || "";
  const merchant = extractMerchantFromDescription(description);
  
  console.log("[ExcelProcessor] Detecting category for transaction:", {
    description: description,
    amount: amount,
    date: date
  });
  
  const category_id = await detectCategory(description, amount);
  console.log("[ExcelProcessor] Category detection result:", category_id);

  return {
    id: uuidv4(),
    date,
    description,
    amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount), // Négatif pour les dépenses, positif pour les revenus
    type,
    merchant,
    category_id,
  };
}

async function processStandardRow(row: any): Promise<ProcessedTransaction> {
  const amount = parseFloat((row.amount || row.Amount || row.montant || row.Montant || "0").replace(',', '.'));
  const description = row.description || row.Description || row.libelle || row.Libelle || "";
  const merchant = extractMerchantFromDescription(description);
  const rawDate = row.date || row.Date || row.date_operation || row.DateOperation || "";
  const date = convertToISODate(rawDate);

  // Attendre la détection de catégorie
  const category_id = await detectCategory(description, amount);

  return {
    id: uuidv4(),
    date,
    description,
    amount,
    type: amount >= 0 ? 'income' as TransactionType : 'expense' as TransactionType,
    merchant,
    category_id,
    metadata: {
      detection_source: 'rules',
      confidence: 0.8
    }
  };
}

// Fonction pour détecter si un fichier est un relevé Boursobank
function isBoursobankStatement(jsonData: any[]): boolean {
  if (jsonData.length === 0) return false;
  
  console.log("Vérification si c'est un relevé Boursobank...");
  
  // Vérifier les premières lignes pour des indices spécifiques à Boursobank
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    console.log(`Analyse de la ligne ${i} pour détection Boursobank:`, row);
    
    // Vérifier si la clé principale contient "BOURSOBANK"
    const mainKey = Object.keys(row)[0];
    if (mainKey && mainKey.includes("BOURSOBANK")) {
      console.log("Détecté comme Boursobank via la clé principale:", mainKey);
      analyzeBoursobankStructure(jsonData);
      return true;
    }
    
    // Vérifier toutes les valeurs
    for (const [key, value] of Object.entries(row)) {
      if (!value) continue;
      
      const valueStr = value.toString() || "";
      console.log(`  Vérification de la valeur dans ${key}:`, valueStr);
      
      if (valueStr.includes("BOURSOBANK") || 
          valueStr.includes("Extrait de votre compte") || 
          valueStr.includes("Garantie des Dépôts")) {
        console.log("Détecté comme Boursobank via la valeur:", valueStr);
        // Analyser la structure du fichier pour comprendre où sont les montants
        analyzeBoursobankStructure(jsonData);
        return true;
      }
    }
  }
  
  console.log("Ce n'est pas un relevé Boursobank");
  return false;
}

// Fonction pour analyser la structure d'un relevé Boursobank
function analyzeBoursobankStructure(jsonData: any[]): void {
  console.log("Analyse de la structure du relevé Boursobank");
  
  // Analyser les 10 premières lignes pour comprendre la structure
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    console.log(`Ligne ${i}:`, row);
    
    // Vérifier toutes les colonnes __EMPTY_X
    for (let j = 0; j <= 25; j++) {  // Augmenter à 25 pour couvrir plus de colonnes
      const key = `__EMPTY_${j}`;
      if (row[key] !== undefined) {
        console.log(`  Colonne ${key}:`, row[key], typeof row[key]);
      }
    }
  }
  
  // Chercher des exemples de lignes avec des transactions
  const transactionSamples = jsonData.filter(row => {
    for (const [key, value] of Object.entries(row)) {
      if (!value) continue;
      const valueStr = value.toString() || "";
      if (valueStr.includes("CARTE") || valueStr.includes("VIR") || valueStr.includes("PRLV")) {
        return true;
      }
    }
    return false;
  }).slice(0, 5);
  
  console.log("Exemples de transactions:", transactionSamples);
  
  // Analyser les colonnes qui pourraient contenir des montants
  for (const sample of transactionSamples) {
    console.log("Analyse des colonnes de montant pour:", sample);
    
    // Chercher dans toutes les colonnes __EMPTY_X
    for (let j = 4; j <= 25; j++) {  // Augmenter à 25 pour couvrir plus de colonnes
      const key = `__EMPTY_${j}`;
      if (sample[key] !== undefined) {
        console.log(`  Colonne ${key}:`, sample[key], typeof sample[key]);
        
        // Vérifier si c'est un nombre ou une chaîne qui ressemble à un nombre
        if (typeof sample[key] === 'number') {
          console.log(`  ✓ Colonne ${key} contient un nombre:`, sample[key]);
        } else if (typeof sample[key] === 'string') {
          const cleanValue = sample[key].trim().replace(',', '.').replace(/\s/g, '');
          if (/^[-+]?\d+(\.\d+)?$/.test(cleanValue)) {
            console.log(`  ✓ Colonne ${key} contient une chaîne numérique:`, cleanValue);
          }
        }
      }
    }
  }
  
  // Détecter les colonnes de montants
  const amountColumns = detectAmountColumns(jsonData);
  console.log("Colonnes de montants détectées:", amountColumns);
}

// Fonction pour détecter les colonnes qui contiennent probablement des montants
function detectAmountColumns(jsonData: any[]): string[] {
  const columnCounts: Record<string, number> = {};
  const amountColumns: string[] = [];
  
  // Parcourir un échantillon de lignes
  const sampleSize = Math.min(30, jsonData.length);
  for (let i = 0; i < sampleSize; i++) {
    const row = jsonData[i];
    
    for (const [key, value] of Object.entries(row)) {
      if (!value) continue;
      
      // Vérifier si c'est un nombre ou une chaîne qui ressemble à un nombre
      if (typeof value === 'number' && value !== 0 && value < 10000) {
        columnCounts[key] = (columnCounts[key] || 0) + 1;
      } else if (typeof value === 'string') {
        const cleanValue = value.trim().replace(',', '.').replace(/\s/g, '');
        if (/^[-+]?\d+(\.\d+)?$/.test(cleanValue) && parseFloat(cleanValue) < 10000) {
          columnCounts[key] = (columnCounts[key] || 0) + 1;
        }
      }
    }
  }
  
  // Identifier les colonnes qui contiennent souvent des montants
  for (const [key, count] of Object.entries(columnCounts)) {
    if (count >= 3) { // Si au moins 3 lignes contiennent un montant dans cette colonne
      amountColumns.push(key);
    }
  }
  
  return amountColumns;
}

// Fonction pour trouver les colonnes importantes dans un relevé Boursobank
function findBoursobankColumns(jsonData: any[]): { 
  dateColumn: string | null, 
  descriptionColumn: string | null,
  debitColumn: string | null,
  creditColumn: string | null
} {
  let dateColumn: string | null = null;
  let descriptionColumn: string | null = null;
  let debitColumn: string | null = null;
  let creditColumn: string | null = null;
  
  // Parcourir les premières lignes pour trouver les en-têtes
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    
    for (const [key, value] of Object.entries(row)) {
      const valueStr = value?.toString() || "";
      
      // Recherche de la colonne de date
      if (valueStr.includes("Date opération") || valueStr === "Date") {
        dateColumn = key;
      }
      
      // Recherche de la colonne de libellé
      if (valueStr.includes("Libellé") || valueStr === "Libellé") {
        descriptionColumn = key;
      }
      
      // Recherche des colonnes de débit et crédit
      if (valueStr.includes("Débit")) {
        debitColumn = key;
      }
      
      if (valueStr.includes("Crédit")) {
        creditColumn = key;
      }
    }
    
    // Si on a trouvé toutes les colonnes, on arrête
    if (dateColumn && descriptionColumn && (debitColumn || creditColumn)) {
      break;
    }
  }
  
  return { dateColumn, descriptionColumn, debitColumn, creditColumn };
}

// Fonction pour extraire les métadonnées du document
function extractDocumentMetadata(jsonData: any[]): {
  document_name: string;
  date_arrete: string;
  periode: string;
} {
  const metadata = {
    document_name: "BOURSOBANK relevé de compte",
    date_arrete: "",
    periode: ""
  };

  // Parcourir les premières lignes pour trouver les informations
  for (let i = 0; i < Math.min(5, jsonData.length); i++) {
    const row = jsonData[i];
    
    // Chercher la date d'arrêté
    if (row.__EMPTY && typeof row.__EMPTY === 'string' && row.__EMPTY.includes('Date')) {
      const dateMatch = row.__EMPTY.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        metadata.date_arrete = dateMatch[1];
      }
    }
    
    // Chercher la période
    for (const [key, value] of Object.entries(row)) {
      if (value && typeof value === 'string' && value.includes('Période')) {
        const periodeMatch = value.match(/du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);
        if (periodeMatch) {
          metadata.periode = `${periodeMatch[1]} - ${periodeMatch[2]}`;
        }
      }
    }
  }

  return metadata;
}

export async function processExcel(file: File): Promise<ProcessedTransaction[]> {
  return new Promise((resolve, reject) => {
    // Lire le fichier Excel
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) {
          reject(new Error("Le fichier Excel n'a pas pu être lu"));
          return;
        }
        
        // Convertir les données binaires en workbook
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log("Feuilles détectées:", workbook.SheetNames);
        
        // Variables pour stocker les transactions de toutes les feuilles
        const allTransactions: ProcessedTransaction[] = [];
        let documentMetadata = null;
        
        // Parcourir chaque feuille du workbook
        for (const sheetName of workbook.SheetNames) {
          // Convertir la feuille en JSON
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (jsonData.length === 0) {
            console.log(`La feuille "${sheetName}" est vide`);
            continue;
          }
          
          console.log(`Traitement de la feuille "${sheetName}" avec ${jsonData.length} lignes`);
          
          // Vérifier si c'est un relevé Boursobank
          const isBoursobank = isBoursobankStatement(jsonData);
          
          if (isBoursobank) {
            console.log("Détecté comme relevé Boursobank");
            
            // Extraire les métadonnées du document
            documentMetadata = extractDocumentMetadata(jsonData);
            console.log("Métadonnées du document:", documentMetadata);
            
            // Trouver les colonnes importantes
            const { dateColumn, descriptionColumn, debitColumn, creditColumn } = findBoursobankColumns(jsonData);
            console.log("Colonnes détectées:", { dateColumn, descriptionColumn, debitColumn, creditColumn });
            
            // Filtrer les lignes qui semblent être des transactions
            const transactionRows = jsonData.filter(row => {
              // Vérifier si la ligne contient une date ou une description de transaction
              for (const [key, value] of Object.entries(row)) {
                if (!value) continue;
                
                const valueStr = value.toString() || "";
                if (
                  (typeof value === 'number' && value > 40000 && value < 50000) || // Date Excel
                  valueStr.includes("CARTE") || 
                  valueStr.includes("VIR") || 
                  valueStr.includes("PRLV") ||
                  valueStr.includes("AVOIR")
                ) {
                  return true;
                }
              }
              return false;
            });
            
            console.log(`Lignes de transactions filtrées: ${transactionRows.length}/${jsonData.length}`);
            
            if (transactionRows.length === 0) {
              console.log("Aucune transaction détectée, tentative avec toutes les lignes");
              // Si aucune transaction n'est détectée, essayer avec toutes les lignes
              // qui ont au moins une valeur numérique
              const fallbackRows = jsonData.filter(row => {
                for (const [key, value] of Object.entries(row)) {
                  if (typeof value === 'number' && value !== 0 && key.includes('__EMPTY_')) {
                    return true;
                  }
                }
                return false;
              });
              
              console.log(`Lignes de secours trouvées: ${fallbackRows.length}`);
              
              // Traiter chaque ligne de transaction
              const sheetTransactions = await Promise.all(
                fallbackRows.map(async (row: any) => {
                  console.log("Processing Boursobank fallback row:", row);
                  const transaction = await processBoursobankRow(row, dateColumn, descriptionColumn, debitColumn, creditColumn);
                  return {
                    ...transaction,
                    metadata: documentMetadata
                  };
                })
              );
              
              allTransactions.push(...sheetTransactions);
            } else {
              // Traiter chaque ligne de transaction
              const sheetTransactions = await Promise.all(
                transactionRows.map(async (row: any) => {
                  console.log("Processing Boursobank row:", row);
                  const transaction = await processBoursobankRow(row, dateColumn, descriptionColumn, debitColumn, creditColumn);
                  return {
                    ...transaction,
                    metadata: documentMetadata
                  };
                })
              );
              
              allTransactions.push(...sheetTransactions);
            }
          } else {
            // Déterminer les en-têtes pour vérifier s'il s'agit d'un relevé bancaire standard
            const headers = Object.keys(jsonData[0]);
            console.log("En-têtes détectés:", headers);
            
            const isBankStatementSheet = isBankStatement(sheetName, headers);
            console.log(`Est-ce un relevé bancaire standard? ${isBankStatementSheet}`);
            
            // Traiter chaque ligne selon le type de données
            const sheetTransactions = await Promise.all(
              jsonData.map(async (row: any) => {
                console.log("Processing row:", row);
                const transaction = isBankStatementSheet 
                  ? await processBankStatementRow(row) 
                  : await processStandardRow(row);
                console.log("Mapped transaction:", transaction);
                return transaction;
              })
            );
            
            // Ajouter les transactions de cette feuille à la liste globale
            allTransactions.push(...sheetTransactions);
          }
        }
        
        console.log(`Total des transactions avant filtrage: ${allTransactions.length}`);
        
        // Filtrer les transactions invalides
        const filteredTransactions = allTransactions.filter((t) => {
          const isValid = Boolean(t.date && typeof t.amount === 'number' && !isNaN(t.amount) && t.amount !== 0);
          if (!isValid) {
            console.log("Invalid transaction:", t, "Missing date or invalid amount");
          }
          return isValid;
        });
        
        console.log(`Transactions valides après filtrage: ${filteredTransactions.length}`);
        
        // Valider toutes les transactions
        const validationResult = validateTransactions(filteredTransactions);
        
        if (validationResult.errors.length > 0) {
          console.log(`Erreurs de validation: ${validationResult.errors.length}`, validationResult.errors);
        }
        
        if (validationResult.valid.length === 0) {
          reject(new Error("Aucune transaction valide trouvée dans le fichier. Vérifiez que votre fichier contient les colonnes requises (date et montant) avec des données valides."));
          return;
        }
        
        console.log(`Transactions finales valides: ${validationResult.valid.length}`);
        resolve(validationResult.valid as ProcessedTransaction[]);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        reject(new Error("Erreur lors du traitement du fichier Excel"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier Excel"));
    };
    
    reader.readAsArrayBuffer(file);
  });
}