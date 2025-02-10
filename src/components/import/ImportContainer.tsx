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

  const handleFileSelect = async (files: File[]) => {
    setIsProcessing(true);
    setError("");
    setProgress(0);

    try {
      // Traiter chaque fichier
      for (const file of files) {
        console.log("Processing file:", file.name, "type:", file.type);
        setProgress(10);

        // Traiter le fichier
        const result = await processFile(file);
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
      }
    } catch (err) {
      console.error("Error in handleFileSelect:", err);
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

      // Stocker les transactions dans Supabase
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
      const transaction = transactions.find((t) => t.id === transactionId);
      if (!transaction) return;

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
          acceptedFileTypes={[".pdf", ".csv"]}
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
    </div>
  );
}
