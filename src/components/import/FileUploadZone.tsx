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
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

const FileUploadZone = ({
  onFileSelect = () => {},
  acceptedFileTypes = [".pdf", ".csv", ".jpg", ".png", ".jpeg"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
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

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isValidType = acceptedFileTypes.some((type) =>
        file.name.toLowerCase().endsWith(type),
      );
      const isValidSize = file.size <= maxFileSize;
      return isValidType && isValidSize;
    });

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
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-gray-400" />
          <div className="text-center">
            <p className="text-lg font-medium">Drag and drop your files here</p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse from your computer
            </p>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileType className="w-4 h-4" />
                  <span>Accepted formats: {acceptedFileTypes.join(", ")}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Maximum file size: {maxFileSize / (1024 * 1024)}MB</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {isUploading && (
          <div className="absolute bottom-4 left-4 right-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-center mt-2">
              Uploading... {uploadProgress}%
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
    </Card>
  );
};

export default FileUploadZone;
