import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { ReceiptData } from "@/lib/services/receipt.service";

interface ReceiptProcessingPreviewProps {
  isProcessing?: boolean;
  progress?: number;
  error?: string;
  receipt?: ReceiptData;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ReceiptProcessingPreview = ({
  isProcessing = false,
  progress = 0,
  error = "",
  receipt,
  onConfirm,
  onCancel,
}: ReceiptProcessingPreviewProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-50 p-6 rounded-lg">
      {isProcessing ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Traitement en cours...</h3>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500">
              Analyse du ticket de caisse en cours. Veuillez patienter...
            </p>
          </div>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </Alert>
      ) : receipt ? (
        <div className="space-y-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Ticket de caisse analysé avec succès</AlertTitle>
            <AlertDescription>
              Veuillez vérifier les informations extraites ci-dessous.
            </AlertDescription>
          </Alert>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Détails du ticket</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Marchand</p>
                <p className="font-medium">{receipt.merchantName || "Non détecté"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {receipt.date
                    ? new Date(receipt.date).toLocaleDateString("fr-FR")
                    : "Non détectée"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-medium">
                  {receipt.total
                    ? new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(receipt.total)
                    : "Non détecté"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Catégorie</p>
                <p className="font-medium">{receipt.category || "Non détectée"}</p>
              </div>
            </div>

            {receipt.items && receipt.items.length > 0 && (
              <>
                <h4 className="text-md font-medium mb-2">Articles</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(item.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button onClick={onConfirm}>Confirmer</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReceiptProcessingPreview;
