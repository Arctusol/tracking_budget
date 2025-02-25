import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Upload, Image, FileText, Loader2, Maximize2, Minimize2, X } from "lucide-react";
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
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPreview } from "./ReceiptPreview";

export function ReceiptUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzedReceipt, setAnalyzedReceipt] = useState<ReceiptData | undefined>();
  const [error, setError] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetState = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setAnalyzedReceipt(undefined);
    setError("");
    setPreviewUrl(null);
  };

  const handleFileSelect = async (files: File[]) => {
    if (!files.length || !user) return;

    const file = files[0];
    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    // Créer un URL pour l'aperçu
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

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
          </FileUploadZone>
        </Card>
      )}

      {previewUrl && (
        <div className="w-full mx-auto bg-gray-50 p-4 md:p-6 rounded-lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start gap-4">
              <div className="w-full xl:w-3/4">
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
              
              <ReceiptPreview 
                previewUrl={previewUrl}
                file={selectedFile}
                onExpand={() => setIsPreviewExpanded(true)}
              />
            </div>
          </div>
        </div>
      )}
      
      {!previewUrl && (
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
      )}

      {/* Modal pour l'aperçu agrandi */}
      <Dialog open={isPreviewExpanded} onOpenChange={setIsPreviewExpanded}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">Aperçu du ticket de caisse</DialogTitle>
          <div className="relative h-[80vh]">
            <DialogClose className="absolute right-2 top-5 z-10">
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </DialogClose>
            {previewUrl && selectedFile?.type.includes('image') ? (
              <img 
                src={previewUrl} 
                alt="Aperçu du ticket" 
                className="object-contain w-full h-full"
              />
            ) : selectedFile?.type === 'application/pdf' ? (
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <p>Le PDF ne peut pas être affiché</p>
              </object>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
