import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CategoryMappingTable from "./CategoryMappingTable";
import { ProcessedTransaction } from "@/lib/fileProcessing";
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

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-50 p-6 rounded-lg">
      {isProcessing ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Traitement du fichier en cours...</h3>
          <Progress value={progress} className="mb-4" />
          <p className="text-sm text-gray-600">
            Analyse et extraction des données de transaction. Veuillez patienter...
          </p>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Fichier traité avec succès</AlertTitle>
            <AlertDescription>
              Vérifiez les transactions extraites ci-dessous et ajustez les catégories si nécessaire.
            </AlertDescription>
          </Alert>

          {statementInfo && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-4 w-4" />
                <h3 className="font-semibold">Informations du relevé</h3>
              </div>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Titulaire</TableCell>
                    <TableCell>{statementInfo.titulaire}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Numéro de relevé</TableCell>
                    <TableCell>{statementInfo.numero_releve}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          )}

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
        </div>
      )}
    </div>
  );
};

export default ProcessingPreview;
