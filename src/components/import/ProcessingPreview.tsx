import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CategoryMappingTable from "./CategoryMappingTable";
import { ProcessedTransaction } from "@/lib/fileProcessing/types";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ValidationError } from "@/lib/validation";

interface ProcessingPreviewProps {
  isProcessing?: boolean;
  progress?: number;
  error?: string;
  validationErrors?: ValidationError[];
  transactions?: ProcessedTransaction[];
  onConfirm?: () => void;
  onCancel?: () => void;
  onCategoryChange?: (transactionId: string, category: string) => void;
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
  // Extraire les métadonnées du premier relevé
  const statementInfo = transactions[0]?.metadata;
  const totalDebits = transactions.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
  const totalCredits = transactions.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
  const netBalance = totalCredits - totalDebits;

  console.log("ProcessingPreview - transactions:", transactions);
  console.log("ProcessingPreview - statementInfo:", statementInfo);

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
                <p className="font-medium">{statementInfo?.document_name || "Non spécifié"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Numéro</p>
                <p className="font-medium">{statementInfo?.numero_releve || "Non spécifié"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date d'arrêté</p>
                <p className="font-medium">{statementInfo?.date_arrete || "Non spécifié"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Titulaire</p>
                <p className="font-medium">{statementInfo?.titulaire || "Non spécifié"}</p>
              </div>
            </div>
            
            {/* Résumé financier */}
            <div className="grid grid-cols-3 gap-4 bg-gray-100 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Solde initial</p>
                <p className="font-medium">{statementInfo?.solde_ancien || "0.00"} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Solde final</p>
                <p className="font-medium">{statementInfo?.solde_nouveau || "0.00"} €</p>
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

          {/* Table des transactions */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Fichier traité avec succès</AlertTitle>
            <AlertDescription>
              {transactions.length} transactions ont été extraites. Vérifiez-les ci-dessous et ajustez les catégories si nécessaire.
            </AlertDescription>
          </Alert>

          <CategoryMappingTable
            transactions={transactions}
            onCategoryChange={onCategoryChange}
          />

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button onClick={onConfirm}>Confirmer l'import</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProcessingPreview;
