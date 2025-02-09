import React, { useState } from "react";
import FileUploadZone from "./FileUploadZone";
import ProcessingPreview from "./ProcessingPreview";
import { processFile, ProcessedTransaction } from "@/lib/fileProcessing";
import { BankStatement } from "@/types/bankStatement";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { useToast } from "@/components/ui/use-toast";
import {
  DocumentAnalysisError,
  ConfigurationError,
  ValidationError,
  ExtractError,
} from "@/lib/errors/documentProcessingErrors";

export default function ImportContainer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [currentStatement, setCurrentStatement] =
    useState<BankStatement | null>(null);
  const { toast } = useToast();

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleFileSelect = async (files: File[]) => {
    setIsProcessing(true);
    setError("");
    setProgress(0);

    try {
      // Traiter chaque fichier
      for (const file of files) {
        setProgress(10);

        // Traiter le fichier
        const result = await processFile(file);
        setProgress(70);

        // Ajouter des IDs uniques aux transactions
        const processedTransactions = result.map((transaction) => ({
          ...transaction,
          id: generateUniqueId(),
        }));

        // Mettre à jour les transactions
        setTransactions(processedTransactions);
        setProgress(100);

        toast({
          title: "Fichier traité avec succès",
          description: `${processedTransactions.length} transactions ont été extraites.`,
        });
      }
    } catch (err) {
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

      setError(errorMessage);
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
    try {
      // Ici, vous pouvez ajouter la logique pour sauvegarder les transactions
      toast({
        title: "Import réussi",
        description: "Les transactions ont été importées avec succès.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des transactions.",
      });
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

      // Sauvegarder le pattern pour une utilisation future
      await savePattern(transaction.description, categoryId);

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, category_id: categoryId } : t,
        ),
      );

      toast({
        title: "Catégorie mise à jour",
        description:
          "Le pattern a été enregistré pour les futures transactions similaires.",
      });
    } catch (error) {
      console.error("Error saving pattern:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer le pattern.",
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
          isProcessing={isProcessing}
          progress={progress}
          error={error}
          transactions={transactions}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onCategoryChange={handleCategoryChange}
        />
      )}
    </div>
  );
}
