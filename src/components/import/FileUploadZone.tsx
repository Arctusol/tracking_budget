import React from "react";
import { Upload, FileType, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface FileUploadZoneProps {
  onFileSelect?: (files: File[]) => void;
  accept?: { [key: string]: string[] };
  maxFiles?: number;
  maxSize?: number;
  children?: React.ReactNode;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

const FileUploadZone = ({
  onFileSelect = () => {},
  accept = { 
    "image/*": [".jpg", ".png", ".jpeg"], 
    "text/csv": [".csv"],
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/vnd.ms-excel": [".xls"]
  },
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB par défaut
  children,
  isUploading = false,
  uploadProgress = 0,
  error = "",
}: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const validateFiles = (files: File[]): File[] => {
    // Vérifier le nombre de fichiers
    if (files.length > maxFiles) {
      console.warn(`Too many files. Maximum allowed: ${maxFiles}`);
      return files.slice(0, maxFiles);
    }

    // Vérifier les types de fichiers et la taille
    return files.filter(file => {
      // Vérifier la taille
      if (file.size > maxSize) {
        console.warn(`File ${file.name} is too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
        return false;
      }

      // Vérifier le type
      const fileType = file.type || '';
      const fileExtension = `.${file.name.split('.').pop()}`.toLowerCase();
      
      const isValidType = Object.entries(accept).some(([mimeType, extensions]) => {
        if (mimeType.endsWith('/*')) {
          const baseType = mimeType.split('/')[0];
          return fileType.startsWith(`${baseType}/`) || extensions.includes(fileExtension);
        }
        return fileType === mimeType || extensions.includes(fileExtension);
      });

      if (!isValidType) {
        console.warn(`File ${file.name} has an invalid type`);
        return false;
      }

      return true;
    });
  };

  const handleFiles = (files: File[]) => {
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };

  return (
    <Card className="w-full bg-white p-8">
      <div
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={Object.keys(accept).join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-medium">
                Déposez votre fichier ici
              </h3>
              <p className="text-sm text-gray-800">
                ou cliquez pour sélectionner un fichier
              </p>
            </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <FileType className="w-4 h-4" />
                  <span>
                    Formats acceptés: PDF, CSV, Excel, Images
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Taille maximale: {maxSize / 1024 / 1024}MB</p>
                <p>Formats: {Object.values(accept)
                      .flat()
                      .map((type) => type.replace(/^\./, ""))
                      .join(", ")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {isUploading && (
          <div className="absolute bottom-4 left-4 right-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-center mt-2">
              Traitement en cours... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-4 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {children}
    </Card>
  );
};

export default FileUploadZone;
