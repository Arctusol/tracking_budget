import React, { useState } from "react";
import { processFile, ProcessedTransaction } from "@/lib/fileProcessing";
import { Card } from "@/components/ui/card";
import { ImportHistory } from "@/components/import/ImportHistory";
import {
  createImportRecord,
  updateImportRecord,
} from "@/lib/services/import.service";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import FileUploadZone from "@/components/import/FileUploadZone";
import ProcessingPreview from "@/components/import/ProcessingPreview";
import { storeTransactions } from "@/lib/services/transaction.service";
import { supabase } from "@/lib/supabase";

const ImportPage = () => {
  const { toast } = useToast();
  const [processedTransactions, setProcessedTransactions] = useState<
    ProcessedTransaction[]
  >([]);
  const [editedTransactions, setEditedTransactions] = useState<
    ProcessedTransaction[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    const file = files[0]; // Handle one file at a time
    let importRecordId: string | null = null;

    setIsUploading(true);
    setUploadError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create import record
      const importRecord = await createImportRecord({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        status: "pending",
        transaction_count: 0,
      });
      importRecordId = importRecord.id;

      // Update upload progress
      setUploadProgress(0);
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Process the file
      setIsProcessing(true);
      const transactions = await processFile(file);
      clearInterval(uploadInterval);
      setUploadProgress(100);

      // Store processed transactions and show preview
      setProcessedTransactions(transactions);
      setEditedTransactions(transactions);
      setProcessingProgress(100);
      setIsProcessing(false);
      setShowPreview(true);

      // Update import record with success
      if (importRecordId) {
        await updateImportRecord(importRecordId, {
          status: "completed",
          transaction_count: transactions.length,
        });
      }
    } catch (error) {
      // Update import record with error
      if (importRecordId) {
        await updateImportRecord(importRecordId, {
          status: "failed",
          error_message: error.message,
        });
      }
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await storeTransactions(editedTransactions, user.id);

      toast({
        title: "Success",
        description: `${editedTransactions.length} transactions imported successfully`,
      });

      // Reset state
      setProcessedTransactions([]);
      setEditedTransactions([]);
      setShowPreview(false);
      setUploadProgress(0);
      setProcessingProgress(0);
    } catch (error) {
      console.error("Error importing transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to import transactions. Please try again.",
      });
    }
  };

  const handleCancelImport = () => {
    // Reset the state
    setShowPreview(false);
    setProcessedTransactions([]);
    setEditedTransactions([]);
    setUploadProgress(0);
    setProcessingProgress(0);
  };

  const handleCategoryChange = (transactionId: string, category: string) => {
    setEditedTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, category } : t)),
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Import Transactions</h1>
          <p className="text-gray-600">
            Upload your bank statements in PDF, CSV, or image format to import
            transactions.
          </p>
        </div>

        <Card className="p-6 bg-white">
          {!showPreview ? (
            <FileUploadZone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={uploadError}
            />
          ) : (
            <ProcessingPreview
              isProcessing={isProcessing}
              progress={processingProgress}
              transactions={editedTransactions}
              onConfirm={handleConfirmImport}
              onCancel={handleCancelImport}
              onCategoryChange={handleCategoryChange}
            />
          )}
        </Card>

        <ImportHistory />

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Import Guidelines</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Supported file formats: PDF, CSV, JPG, PNG</li>
            <li>Maximum file size: 10MB</li>
            <li>
              For best results, ensure your statements are clear and readable
            </li>
            <li>Processing time may vary depending on file size and format</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
