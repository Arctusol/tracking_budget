export interface BankStatementHolder {
    nom: string;
}

export interface BankStatementInfo {
    numero_releve: string;
    date_emission: string;
    date_arrete: string;
    solde_ancien: string;
}

export interface BankOperation {
    date_operation: string;
    date_valeur: string;
    description: string;
    debit: string;
    credit: string;
}

export interface BankStatement {
    titulaire: BankStatementHolder;
    infos_releve: BankStatementInfo;
    operations: BankOperation[];
}

// Regex patterns pour l'extraction
export const PATTERNS = {
    TITULAIRE: /(?:Titulaire|Nom du client|Compte de)\s*:?\s*([^\n]+)/i,
    NUMERO_RELEVE: /(?:Relevé|N°|Numéro de relevé)\s*:?\s*([A-Z0-9]+)/i,
    DATE_EMISSION: /(?:Date d'émission|Édité le|Émis le)\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
    DATE_ARRETE: /(?:Arrêté au|Période arrêtée au|Date d'arrêté)\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
    SOLDE_ANCIEN: /(?:Solde\s*(?:ancien|précédent|initial)|Report\s*du)\s*:?\s*([-+]?\d[\d\s.,]*\d)/i,
    // Pattern amélioré pour les opérations
    OPERATION: /(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})\s+(?:(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})\s+)?([^]*?)(?:\s{2,}|\t)((?:[-+]?\d[\d\s.,]*(?:€|\EUR)?)|)\s*((?:[-+]?\d[\d\s.,]*(?:€|\EUR)?)|)\s*$/gm
};

// Formats de date possibles
export const DATE_FORMATS = [
    'DD/MM/YYYY',
    'DD-MM-YYYY',
    'DD.MM.YYYY'
];

// Types d'opérations courantes pour l'analyse
export const OPERATION_TYPES = [
    'VIREMENT',
    'PRELEVEMENT',
    'CARTE',
    'RETRAIT',
    'CHEQUE',
    'VERSEMENT',
    'FRAIS',
    'INTERET'
];
