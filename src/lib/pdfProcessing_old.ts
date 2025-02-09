import * as pdfjsLib from 'pdfjs-dist';
import { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';
import { BankStatement, BankOperation, PATTERNS, OPERATION_TYPES } from '@/types/bankStatement';
import { initPDFJS } from './pdfjs-config';

// Initialiser PDF.js
initPDFJS();

// Activer le mode verbeux pour le débogage
const DEBUG = process.env.NODE_ENV === 'development';

interface TableRow {
    date: string;
    dateValeur: string;
    operation: string;
    debit: string;
    credit: string;
}

interface ColumnPositions {
    debit: number;
    credit: number;
}

let headerPositions: ColumnPositions | null = null;

function isValidDate(dateStr: string): boolean {
    return /^\d{2}\/\d{2}(?:\/\d{4})?$/.test(dateStr.trim());
}

function isAmount(str: string): boolean {
    const cleaned = str.trim().replace(/[€\s]/g, '');
    // Accepter les formats: 123,45 ou 123.45 ou 123
    return /^-?\d+(?:[.,]\d{2})?$/.test(cleaned);
}

function findHeaderPositions(items: TextItem[]): ColumnPositions | null {
    const headerLine = items.filter(item => 
        item.str.includes('Débit') || item.str.includes('Crédit')
    );

    if (headerLine.length < 2) return null;

    const positions = {
        debit: 0,
        credit: 0
    };

    for (const item of headerLine) {
        if (item.str.includes('Débit')) {
            positions.debit = item.transform[4];
        }
        if (item.str.includes('Crédit')) {
            positions.credit = item.transform[4];
        }
    }

    if (positions.debit && positions.credit) {
        if (DEBUG) console.log('Positions des colonnes trouvées:', positions);
        return positions;
    }

    return null;
}

function extractTableData(items: TextItem[]): TableRow[] {
    const rows: TableRow[] = [];
    let currentRow: Partial<TableRow> = {};
    
    // Trier les éléments par position Y puis X
    const sortedItems = [...items].sort((a, b) => {
        const yDiff = Math.abs(a.transform[5] - b.transform[5]);
        if (yDiff < 2) { // Items sur la même ligne
            return a.transform[4] - b.transform[4];
        }
        return b.transform[5] - a.transform[5];
    });

    let currentY = sortedItems[0]?.transform[5];
    let rowItems: TextItem[] = [];

    for (const item of sortedItems) {
        if (Math.abs(item.transform[5] - currentY) > 2) {
            // Nouvelle ligne détectée, traiter la ligne précédente
            if (rowItems.length > 0) {
                const row = processRowItems(rowItems);
                if (row) rows.push(row);
            }
            rowItems = [item];
            currentY = item.transform[5];
        } else {
            rowItems.push(item);
        }
    }

    // Traiter la dernière ligne
    if (rowItems.length > 0) {
        const row = processRowItems(rowItems);
        if (row) rows.push(row);
    }

    return rows;
}

function processRowItems(items: TextItem[]): TableRow | null {
    // Ignorer les lignes vides
    if (items.length === 0) return null;

    // Trier les items par position X
    const sortedItems = [...items].sort((a, b) => a.transform[4] - b.transform[4]);
    
    // Si c'est une ligne d'en-tête, extraire les positions des colonnes
    const lineText = sortedItems.map(item => item.str).join(' ');
    if (lineText.includes('Date de Valeur') || lineText.includes('Opération')) {
        headerPositions = findHeaderPositions(sortedItems);
        if (DEBUG) console.log('Ligne d\'en-tête détectée:', lineText);
        return null;
    }

    // Définir les zones approximatives des colonnes
    const minX = Math.min(...sortedItems.map(item => item.transform[4]));
    const maxX = Math.max(...sortedItems.map(item => item.transform[4]));

    // Initialiser les colonnes
    let result: TableRow = {
        date: '',
        dateValeur: '',
        operation: '',
        debit: '',
        credit: ''
    };

    let hasDateOrOperation = false;
    let hasAmount = false;
    let operationItems: TextItem[] = [];

    // Classer chaque item dans sa colonne appropriée
    for (const item of sortedItems) {
        const str = item.str.trim();
        if (!str) continue;

        const x = item.transform[4];

        // Détecter les montants d'abord
        if (isAmount(str)) {
            hasAmount = true;
            if (headerPositions) {
                // Si on a les positions de l'en-tête
                const midPoint = (headerPositions.debit + headerPositions.credit) / 2;
                if (x < midPoint) {
                    result.debit = sanitizeAmount(str);
                } else {
                    result.credit = sanitizeAmount(str);
                }
            } else {
                // Fallback sur les positions relatives
                if (x >= maxX * 0.85) {
                    result.credit = sanitizeAmount(str);
                } else if (x >= maxX * 0.7) {
                    result.debit = sanitizeAmount(str);
                }
            }
            continue;
        }

        // Traiter le reste du texte
        if (x < (headerPositions?.debit || maxX * 0.16)) {
            // Zone des dates
            if (isValidDate(str)) {
                hasDateOrOperation = true;
                if (!result.date) {
                    result.date = str;
                } else if (!result.dateValeur) {
                    result.dateValeur = str;
                }
            }
        } else if (x < (headerPositions?.debit || maxX * 0.7)) {
            // Zone de l'opération
            hasDateOrOperation = true;
            operationItems.push(item);
        }
    }

    // Traitement spécial pour la ligne de solde
    if (lineText.includes('SOLDE') && hasAmount) {
        result.operation = lineText;
        return result;
    }

    // Vérifier si nous avons suffisamment d'informations
    if (!hasDateOrOperation || (!result.debit && !result.credit)) {
        if (DEBUG) console.log('Ligne ignorée (données manquantes):', {
            text: lineText,
            hasDateOrOperation,
            hasAmount,
            result
        });
        return null;
    }

    // Construire la description à partir des items d'opération triés
    result.operation = operationItems
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map(item => item.str.trim())
        .join(' ')
        .trim();

    if (DEBUG) {
        console.log('Ligne traitée:', {
            text: lineText,
            result,
            positions: sortedItems.map(item => ({
                text: item.str,
                x: item.transform[4]
            }))
        });
    }

    return result;
}


interface BankStatementJSON {
    infos_releve: {
        bank_name: string;
        numero_releve: string;
        date_emission: string;
        solde_ancien: string;
        solde_nouveau: string;
    };
    operations: Array<{
        date_operation: string;
        description: string;
        categorie: string;
        montant: {
            debit: string;
            credit: string;
        };
    }>;
    resume_operations: {
        total_debits: string;
        total_credits: string;
        solde_final: string;
    };
}

function formatTableDataToJSON(rows: TableRow[]): BankStatementJSON {
    let totalDebits = 0;
    let totalCredits = 0;
    let soldeAncien = '';
    let soldeNouveau = '';

    // Extraire les soldes et calculer les totaux
    rows.forEach(row => {
        if (row.operation.includes('ANCIEN SOLDE')) {
            soldeAncien = row.credit || row.debit;
        } else if (row.operation.includes('NOUVEAU SOLDE')) {
            soldeNouveau = row.credit || row.debit;
        } else {
            if (row.debit) totalDebits += parseFloat(row.debit.replace(',', '.'));
            if (row.credit) totalCredits += parseFloat(row.credit.replace(',', '.'));
        }
    });

    // Formater les opérations
    const operations = rows
        .filter(row => !row.operation.includes('SOLDE'))
        .map(row => ({
            date_operation: row.dateValeur, // Utiliser la date de valeur
            description: row.operation || 'Transaction bancaire',
            categorie: 'Autre',
            montant: {
                debit: row.debit,
                credit: row.credit
            }
        }));

    return {
        infos_releve: {
            bank_name: 'Banque',
            numero_releve: '',
            date_emission: rows[0]?.dateValeur || '',
            solde_ancien: soldeAncien,
            solde_nouveau: soldeNouveau
        },
        operations,
        resume_operations: {
            total_debits: totalDebits.toFixed(2),
            total_credits: totalCredits.toFixed(2),
            solde_final: soldeNouveau
        }
    };
}

export async function extractBankStatement(file: File): Promise<BankStatement> {
    if (DEBUG) console.log('Début de l\'extraction du relevé bancaire');
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        if (DEBUG) console.log('Fichier PDF chargé en mémoire');
        
        const pdf = await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: DEBUG ? pdfjsLib.VerbosityLevel.ERRORS : pdfjsLib.VerbosityLevel.ERRORS
        }).promise;
        
        if (DEBUG) console.log(`PDF chargé avec succès. Nombre de pages: ${pdf.numPages}`);
        
        let allTableRows: TableRow[] = [];
        
        // Extraire le texte de toutes les pages
        for (let i = 1; i <= pdf.numPages; i++) {
            if (DEBUG) console.log(`Traitement de la page ${i}/${pdf.numPages}`);
            
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const items = textContent.items.filter((item): item is TextItem => 
                'str' in item && 'transform' in item
            );

            const pageRows = extractTableData(items);
            allTableRows = allTableRows.concat(pageRows);
        }

        if (DEBUG) {
            console.log('Lignes extraites:', allTableRows);
        }

        // Convertir les lignes en opérations
        const operations = allTableRows.map(row => ({
            date_operation: row.dateValeur,  // Utiliser dateValeur au lieu de date
            date_valeur: row.dateValeur,
            description: row.operation || 'Transaction bancaire',
            debit: row.debit,
            credit: row.credit
        }));

        // Extraire les informations du relevé
        const soldeAncien = allTableRows.find(row => row.operation.includes('ANCIEN SOLDE'))?.credit || '';
        const soldeNouveau = allTableRows.find(row => row.operation.includes('NOUVEAU SOLDE'))?.credit || '';

        return {
            titulaire: { nom: 'À extraire' },
            infos_releve: {
                numero_releve: '',
                date_emission: operations[0]?.date_valeur || '',
                date_arrete: operations[operations.length - 1]?.date_valeur || '',
                solde_ancien: soldeAncien
            },
            operations
        };
    } catch (error) {
        console.error('Erreur lors de l\'extraction du relevé bancaire:', error);
        throw new Error('Impossible de traiter le relevé bancaire');
    }
}

export async function extractTableDataJSON(file: File): Promise<BankStatementJSON> {
    if (DEBUG) console.log('Début de l\'extraction des données au format JSON');
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        if (DEBUG) console.log('Fichier PDF chargé en mémoire');
        
        const pdf = await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: DEBUG ? pdfjsLib.VerbosityLevel.ERRORS : pdfjsLib.VerbosityLevel.ERRORS
        }).promise;
        
        if (DEBUG) console.log(`PDF chargé avec succès. Nombre de pages: ${pdf.numPages}`);
        
        let allTableRows: TableRow[] = [];
        
        // Extraire le texte de toutes les pages
        for (let i = 1; i <= pdf.numPages; i++) {
            if (DEBUG) console.log(`Traitement de la page ${i}/${pdf.numPages}`);
            
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const items = textContent.items.filter((item): item is TextItem => 
                'str' in item && 'transform' in item
            );

            const pageRows = extractTableData(items);
            allTableRows = allTableRows.concat(pageRows);
        }

        if (DEBUG) {
            console.log('Lignes extraites:', allTableRows);
        }

        // Formater les données au format JSON demandé
        return formatTableDataToJSON(allTableRows);
    } catch (error) {
        console.error('Erreur lors de l\'extraction des données au format JSON:', error);
        throw new Error('Impossible de traiter le relevé bancaire');
    }
}

function extractPattern(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
}

function extractOperations(text: string): BankOperation[] {
    const operations: BankOperation[] = [];
    let match;

    if (DEBUG) console.log('Début de l\'extraction des opérations');

    // Réinitialiser le regex pour les opérations multiples
    PATTERNS.OPERATION.lastIndex = 0;

    try {
        while ((match = PATTERNS.OPERATION.exec(text)) !== null) {
            const [_, date_operation, date_valeur, description, debit, credit] = match;
            
            // Vérifier si la ligne correspond à une opération valide
            if (!date_operation || (!debit && !credit)) {
                if (DEBUG) console.log('Ligne ignorée - données invalides:', match[0]);
                continue;
            }

            // Nettoyer et valider la description
            const cleanDescription = description.trim()
                .replace(/\s+/g, ' ')
                .replace(/\n/g, ' ');

            if (cleanDescription.length < 2) {
                if (DEBUG) console.log('Ligne ignorée - description trop courte:', match[0]);
                continue;
            }

            // Détecter le type d'opération
            const operationType = OPERATION_TYPES.find(type => 
                cleanDescription.toUpperCase().includes(type)
            );

            if (DEBUG && operationType) {
                console.log(`Type d'opération détecté: ${operationType}`);
            }

            operations.push({
                date_operation: date_operation.trim(),
                date_valeur: date_valeur ? date_valeur.trim() : date_operation.trim(),
                description: cleanDescription,
                debit: debit.trim(),
                credit: credit.trim()
            });

            if (DEBUG) {
                console.log('Opération extraite:', operations[operations.length - 1]);
            }
        }

        if (DEBUG) {
            console.log(`Total des opérations extraites: ${operations.length}`);
        }

        return operations;
    } catch (error) {
        console.error('Erreur lors de l\'extraction des opérations:', error);
        throw new Error('Impossible d\'extraire les opérations du relevé');
    }
}

export function sanitizeAmount(amount: string): number {
    if (!amount) return 0;
    
    try {
        // Nettoyer le montant
        const cleanAmount = amount
            .replace(/\s/g, '')
            .replace(/[€EUR]/gi, '')
            .replace(/\./g, '')  // Gérer les milliers
            .replace(',', '.')   // Gérer les décimales
            .replace(/[^-\d.]/g, ''); // Enlever tout caractère non numérique sauf - et .

        const number = parseFloat(cleanAmount);
        
        if (isNaN(number)) {
            if (DEBUG) console.log(`Montant invalide: ${amount} -> ${cleanAmount}`);
            return 0;
        }

        return number;
    } catch (error) {
        console.error('Erreur lors du nettoyage du montant:', error);
        return 0;
    }
}

export function validateBankStatement(statement: BankStatement): boolean {
    // Vérifications de base
    if (!statement.titulaire.nom) {
        console.error('Titulaire manquant');
        return false;
    }

    if (!statement.infos_releve.numero_releve || 
        !statement.infos_releve.date_emission || 
        !statement.infos_releve.date_arrete) {
        console.error('Informations du relevé incomplètes');
        return false;
    }

    if (!statement.operations || statement.operations.length === 0) {
        console.error('Aucune opération trouvée');
        return false;
    }

    // Vérification des dates des opérations
    const dateArrete = new Date(statement.infos_releve.date_arrete.split('/').reverse().join('-'));
    
    for (const operation of statement.operations) {
        const dateOp = new Date(operation.date_operation.split('/').reverse().join('-'));
        if (dateOp > dateArrete) {
            console.error('Date d\'opération postérieure à la date d\'arrêté');
            return false;
        }
    }

    return true;
}
