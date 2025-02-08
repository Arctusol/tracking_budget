import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CategoryMappingTable from "./CategoryMappingTable";
import { ProcessedTransaction } from "@/lib/fileProcessing";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { ValidationError } from "@/lib/validation";

interface ProcessingPreviewProps {
  isProcessing?: boolean;
  progress?: number;
  error?: string;
  validationErrors?: ValidationError[];
  transactions?: ProcessedTransaction[];
  onConfirm?: () => void;
  onCancel?: () => void;
  onCategoryChange?: (transactionId: string, category: string) => void;
}

const ProcessingPreview = ({
  isProcessing = false,
  progress = 0,
  error = "",
  transactions = [],
  onConfirm = () => {},
  onCancel = () => {},
  onCategoryChange = () => {},
}: ProcessingPreviewProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-50 p-6 rounded-lg">
      {isProcessing ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Processing File...</h3>
          <Progress value={progress} className="mb-4" />
          <p className="text-sm text-gray-600">
            Analyzing and extracting transaction data. Please wait...
          </p>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>File Processed Successfully</AlertTitle>
            <AlertDescription>
              Review the extracted transactions below and adjust categories if
              needed.
            </AlertDescription>
          </Alert>

          <CategoryMappingTable
            transactions={transactions}
            onCategoryChange={onCategoryChange}
          />

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Confirm Import</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingPreview;
