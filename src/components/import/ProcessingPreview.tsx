import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import CategoryMappingTable from "./CategoryMappingTable";
import { ProcessedTransaction } from "@/lib/fileProcessing/types";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ValidationError } from "@/lib/validation";

interface ProcessingPreviewProps {
  isProcessing?: boolean;
  progress?: number;
  error?: string;
  validationErrors?: ValidationError[];
  transactions?: ProcessedTransaction[];
  onConfirm?: (metadata: StatementMetadata) => void;
  onCancel?: () => void;
  onCategoryChange?: (transactionId: string, category: string) => void;
}

interface StatementMetadata {
  document_name?: string;
  numero_releve?: string;
  date_arrete?: string;
  titulaire?: string;
  solde_ancien?: string;
  solde_nouveau?: string;
  date_valeur?: string;
  bank_statement_id?: string;
  debit_amount?: string;
  original_description?: string;
  detection_source?: 'historical' | 'rules' | 'keywords' | 'amount';
  confidence?: number;
}

const ProcessingPreview = ({
  isProcessing = false,
  progress = 0,
  error = "",
  transactions = [],
  onConfirm = () => {},
  onCancel = () => {},
  onCategoryChange = () => {},
}: ProcessingPreviewProps) => {
  const initialMetadata: StatementMetadata = {
    document_name: "",
    numero_releve: "",
    date_arrete: "",
    titulaire: "",
    solde_ancien: "0.00",
    solde_nouveau: "0.00"
  };

  const [metadata, setMetadata] = useState<StatementMetadata>(initialMetadata);

  useEffect(() => {
    if (transactions[0]?.metadata) {
      setMetadata(transactions[0].metadata);
    }
  }, [transactions]);

  const handleMetadataChange = (field: keyof StatementMetadata) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleConfirm = () => {
    onConfirm(metadata);
  };

  // Extraire les métadonnées du premier relevé
  const statementInfo = transactions[0]?.metadata;
  const totalDebits = transactions.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
  const totalCredits = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
  const netBalance = totalCredits - totalDebits;

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-50 p-6 rounded-lg">
      {isProcessing ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Traitement du fichier en cours...</h3>
          <Progress value={progress} className="mb-4" />
          <p className="text-sm text-gray-600">
            Veuillez patienter pendant l'analyse du document...
          </p>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : transactions.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Aucune transaction</AlertTitle>
          <AlertDescription>
            Aucune transaction n'a été trouvée dans le fichier. Vérifiez que le fichier est au bon format.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Informations du relevé */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Informations du relevé</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Document</p>
                <Input
                  value={metadata.document_name}
                  onChange={handleMetadataChange('document_name')}
                  className="font-medium"
                  placeholder="Nom du document"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Numéro</p>
                <Input
                  value={metadata.numero_releve}
                  onChange={handleMetadataChange('numero_releve')}
                  className="font-medium"
                  placeholder="Numéro de relevé"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Date d'arrêté</p>
                <Input
                  value={metadata.date_arrete}
                  onChange={handleMetadataChange('date_arrete')}
                  className="font-medium"
                  placeholder="Date d'arrêté"
                  type="date"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Titulaire</p>
                <Input
                  value={metadata.titulaire}
                  onChange={handleMetadataChange('titulaire')}
                  className="font-medium"
                  placeholder="Nom du titulaire"
                />
              </div>
            </div>
            
            {/* Résumé financier */}
            <div className="grid grid-cols-3 gap-4 bg-gray-100 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Solde initial</p>
                <p className="font-medium">{metadata.solde_ancien || "0.00"} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Solde final</p>
                <p className="font-medium">{metadata.solde_nouveau || "0.00"} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance nette</p>
                <p className={`font-medium ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {netBalance.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total débits</p>
                <p className="font-medium text-red-600">-{totalDebits.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total crédits</p>
                <p className="font-medium text-green-600">+{totalCredits.toFixed(2)} €</p>
              </div>
            </div>
          </Card>

          {/* Transaction Table */}
          <div className="space-y-4">
            <CategoryMappingTable
              transactions={transactions}
              onCategoryChange={onCategoryChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button onClick={handleConfirm}>
              Confirmer l'import
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProcessingPreview;
