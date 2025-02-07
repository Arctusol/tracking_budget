import React, { useState } from "react";
import { processFile } from "@/lib/fileProcessing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FileUploadZone from "@/components/import/FileUploadZone";
import ProcessingPreview from "@/components/import/ProcessingPreview";

const ImportPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    setIsUploading(true);
    setUploadError("");

    try {
      for (const file of files) {
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

        // Show preview with processed transactions
        setProcessingProgress(100);
        setIsProcessing(false);
        setShowPreview(true);

        // Update the CategoryMappingTable with the processed transactions
        // You'll need to implement this part based on your data structure
        console.log("Processed transactions:", transactions);
      }
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const simulateProcessing = () => {
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setShowPreview(true);
          return 100;
        }
        return prev + 20;
      });
    }, 1000);
  };

  const handleConfirmImport = () => {
    // Handle import confirmation
    console.log("Import confirmed");
  };

  const handleCancelImport = () => {
    // Reset the state
    setShowPreview(false);
    setUploadProgress(0);
    setProcessingProgress(0);
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
              onConfirm={handleConfirmImport}
              onCancel={handleCancelImport}
            />
          )}
        </Card>

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
