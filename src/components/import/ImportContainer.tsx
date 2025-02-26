import React, { useState } from "react";
import FileUploadZone from "./FileUploadZone";
import ProcessingPreview from "./ProcessingPreview";
import { processFile } from "@/lib/fileProcessing";
import { ProcessedTransaction } from "@/lib/fileProcessing/types";
import { BankStatement } from "@/types/bankStatement";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { useToast } from "@/components/ui/use-toast";
import {
  DocumentAnalysisError,
  ConfigurationError,
  ValidationError,
  ExtractError,
} from "@/lib/errors/documentProcessingErrors";
import { supabase } from "@/lib/supabase";
import { storeTransactions as saveTransactions } from "@/lib/services/transaction.service";
import { createImportRecord, updateImportRecord } from "@/lib/services/import.service";
import BankSelectionDialog from "@/lib/fileProcessing/BankSelectionDialog";

export interface ImportContainerProps {
  onClose?: () => void;
}

export default function ImportContainer({ onClose }: ImportContainerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [currentStatement, setCurrentStatement] =
    useState<BankStatement | null>(null);
  const { toast } = useToast();
  
  // États pour la sélection de banque
  const [showBankSelection, setShowBankSelection] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const processFileWithBank = async (file: File, bankType?: string) => {
    setIsProcessing(true);
    setError("");
    setProgress(10);

    try {
      // Traiter le fichier avec le type de banque sélectionné
      const result = await processFile(file, bankType);
      console.log("File processing result:", result);
      setProgress(70);

      if (!result || result.length === 0) {
        throw new Error("Aucune transaction n'a été trouvée dans le fichier");
      }

      // Mettre à jour les transactions
      setTransactions(result);
      setProgress(100);

      toast({
        title: "Fichier traité avec succès",
        description: `${result.length} transactions ont été extraites.`,
      });
    } catch (err) {
      console.error("Error in processFileWithBank:", err);
      let errorMessage =
        "Une erreur est survenue lors du traitement du fichier";
      let errorDetails = "";

      if (err instanceof DocumentAnalysisError) {
        errorMessage = "Erreur lors de l'analyse du document";
        errorDetails = err.message;
        if (err.details) {
          console.error("Document Analysis Details:", err.details);
        }
      } else if (err instanceof ConfigurationError) {
        errorMessage = "Erreur de configuration";
        errorDetails = err.message;
      } else if (err instanceof ValidationError) {
        errorMessage = "Erreur de validation";
        errorDetails = err.message;
        if (err.validationErrors?.length) {
          console.error("Validation Errors:", err.validationErrors);
        }
      } else if (err instanceof ExtractError) {
        errorMessage = "Erreur lors de l'extraction des données";
        errorDetails = err.message;
      } else if (err instanceof Error) {
        errorDetails = err.message;
      }

      setError(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      toast({
        variant: "destructive",
        title: errorMessage,
        description:
          errorDetails ||
          "Veuillez réessayer ou contacter le support si le problème persiste.",
      });
    } finally {
      setIsProcessing(false);
      setCurrentFile(null);
    }
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0]; // Nous ne prenons que le premier fichier
    console.log("Selected file:", file.name, "type:", file.type);

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
      // Ouvrir la boîte de dialogue de sélection de banque pour les PDF
      setCurrentFile(file);
      setShowBankSelection(true);
    } else {
      // Pour les autres types, traiter directement
      processFileWithBank(file);
    }
  };

  const handleBankSelect = (bankType: string) => {
    if (currentFile) {
      console.log("Banque sélectionnée:", bankType);
      // Fermer d'abord la boîte de dialogue
      setShowBankSelection(false);
      // Puis traiter le fichier avec la banque sélectionnée
      processFileWithBank(currentFile, bankType);
    } else {
      console.error("Aucun fichier sélectionné pour l'analyse");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucun fichier sélectionné pour l'analyse",
      });
      setShowBankSelection(false);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Créer un enregistrement d'import
      const importRecord = await createImportRecord({
        user_id: userId,
        file_name: "Import du " + new Date().toLocaleDateString(),
        file_type: "bank_statement",
        status: "pending",
        transaction_count: transactions.length,
      });

      // Stocker les transactions dans Supabase avec leurs catégories mises à jour
      await saveTransactions(transactions, userId);

      // Mettre à jour le statut de l'import
      await updateImportRecord(importRecord.id, {
        status: "completed",
      });

      // Réinitialiser l'état
      setTransactions([]);
      setCurrentStatement(null);
      setProgress(0);

      // Notifier le succès
      toast({
        title: "Import réussi",
        description: `${transactions.length} transactions ont été importées avec succès.`,
      });

      // Fermer le modal ou rediriger si nécessaire
      onClose?.();
    } catch (err) {
      console.error("Error storing transactions:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'import des transactions"
      );
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          "Une erreur est survenue lors de l'import des transactions.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setTransactions([]);
    setCurrentStatement(null);
    setError("");
  };

  const handleCategoryChange = async (
    transactionId: string,
    categoryId: string,
  ) => {
    try {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, category_id: categoryId } : t,
        ),
      );

      toast({
        title: "Catégorie mise à jour",
        description:
          "La catégorie a été mise à jour pour la transaction sélectionnée.",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la catégorie.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {transactions.length === 0 ? (
        <FileUploadZone
          onFileSelect={handleFileSelect}
          isUploading={isProcessing}
          uploadProgress={progress}
          error={error}
          accept={{
            "text/csv": [".csv"],
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"]
          }}
          maxFiles={1}
        />
      ) : (
        <ProcessingPreview
          transactions={transactions}
          onConfirm={handleConfirm}
          onCancel={() => {
            setTransactions([]);
            setCurrentStatement(null);
            setProgress(0);
          }}
        />
      )}

      {/* Boîte de dialogue de sélection de banque */}
      <BankSelectionDialog
        open={showBankSelection}
        onClose={() => setShowBankSelection(false)}
        onBankSelect={handleBankSelect}
        fileName={currentFile?.name || ""}
      />
    </div>
  );
}
