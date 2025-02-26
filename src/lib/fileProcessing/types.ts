import { Transaction, TransactionType } from "../../types/transaction";

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
    document_name?: string;
    date_arrete?: string;
    solde_ancien?: string;
    solde_nouveau?: string;
    bank_statement_id?: string;
    debit_amount?: string;
    original_description?: string;
    detection_source?: 'historical' | 'rules' | 'keywords' | 'amount';
    confidence?: number;
  };
}

export interface BankStatement {
  document_name: string;
  titulaire: {
    nom: string;
  };
  infos_releve: {
    numero_releve: string;
    date_emission: string;
    date_arrete: string;
    solde_ancien: number;
    solde_nouveau: number;
    total_debits: number;
    total_credits: number;
    net_balance: number;
  };
  operations: Array<{
    date_operation: string;
    description: string;
    debit: string;
    credit: string;
  }>;
}

export interface AzureAnalyzeResult {
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

export interface AzureResponse {
  analyzeResult: AzureAnalyzeResult;
}

export interface BankProcessor {
  processPDF(file: File): Promise<ProcessedTransaction[]>;
  isSupportedBank(analyzeResult: AzureAnalyzeResult): boolean;
}
