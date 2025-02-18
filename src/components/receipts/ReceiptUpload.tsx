import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Upload, Image, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { analyzeReceipt, storeReceipt, type ReceiptData } from "@/lib/services/receipt.service";
import { 
  DocumentAnalysisError,
  ConfigurationError,
  ExtractError,
  DocumentProcessingError,
} from "@/lib/errors/documentProcessingErrors";
import FileUploadZone from "@/components/import/FileUploadZone";
import ReceiptProcessingPreview from "./ReceiptProcessingPreview";

export function ReceiptUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzedReceipt, setAnalyzedReceipt] = useState<ReceiptData | undefined>();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  const resetState = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setAnalyzedReceipt(undefined);
    setError("");
  };

  const handleFileSelect = async (files: File[]) => {
    if (!files.length || !user) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      setUploadProgress(20);

      // Analyze receipt with Azure
      const receiptData = await analyzeReceipt(file);
      setUploadProgress(60);

      if (!receiptData) {
        throw new Error("Failed to analyze receipt");
      }

      // Only upload to storage if analysis was successful
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error("Failed to upload receipt image");
      }

      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileData.path);

      setUploadProgress(80);

      // Add the image URL to the receipt data
      const receiptWithImage = {
        ...receiptData,
        image_url: publicUrl,
        user_id: user.id
      };

      setAnalyzedReceipt(receiptWithImage);
      setUploadProgress(100);
    } catch (err) {
      console.error("Error processing receipt:", err);
      let errorMessage = "Une erreur est survenue lors du traitement du ticket de caisse.";
      
      if (err instanceof DocumentAnalysisError) {
        errorMessage = "Erreur lors de l'analyse du document : " + err.message;
      } else if (err instanceof ConfigurationError) {
        errorMessage = "Erreur de configuration : " + err.message;
      } else if (err instanceof ExtractError) {
        errorMessage = "Erreur lors de l'extraction des données : " + err.message;
      } else if (err instanceof DocumentProcessingError) {
        errorMessage = "Erreur lors du traitement du document : " + err.message;
      }

      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!analyzedReceipt || !user) return;

    try {
      await storeReceipt(analyzedReceipt);
      toast({
        title: "Succès",
        description: "Le ticket de caisse a été enregistré avec succès.",
      });
      resetState();
    } catch (err) {
      console.error("Error storing receipt:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du ticket de caisse.",
      });
    }
  };

  const handleUpdateCategory = (itemIndex: number, categoryId: string) => {
    if (!analyzedReceipt) return;

    setAnalyzedReceipt({
      ...analyzedReceipt,
      items: analyzedReceipt.items.map((item, index) => 
        index === itemIndex ? { ...item, product_category_id: categoryId } : item
      )
    });
  };

  const handleUpdateReceipt = (updatedReceipt: ReceiptData) => {
    setAnalyzedReceipt(updatedReceipt);
  };

  return (
    <div className="space-y-4">
      {!isUploading && !analyzedReceipt && !error && (
        <Card className="p-6">
          <FileUploadZone
            onFileSelect={handleFileSelect}
            accept={{
              "image/*": [".png", ".jpg", ".jpeg"],
              "application/pdf": [".pdf"]
            }}
            maxFiles={1}
            maxSize={10 * 1024 * 1024} // 10MB
          >
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-medium">
                Déposez votre ticket de caisse ici
              </h3>
              <p className="text-sm text-gray-500">
                ou cliquez pour sélectionner un fichier
              </p>
            </div>
          </FileUploadZone>
        </Card>
      )}

      <ReceiptProcessingPreview
        isProcessing={isUploading}
        progress={uploadProgress}
        error={error}
        receipt={analyzedReceipt}
        onConfirm={handleConfirm}
        onCancel={resetState}
        onUpdateCategory={handleUpdateCategory}
        onUpdateReceipt={handleUpdateReceipt}
      />
    </div>
  );
}
