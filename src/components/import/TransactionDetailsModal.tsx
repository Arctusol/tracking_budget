import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProcessedTransaction } from "@/lib/fileProcessing";
import { Badge } from "@/components/ui/badge";
import { getCategoryConfidence } from "@/lib/categorization";

interface TransactionDetailsModalProps {
  transaction: ProcessedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryChange: (transactionId: string, category: string) => void;
}

const categories = [
  "food",
  "transport",
  "shopping",
  "leisure",
  "health",
  "housing",
  "salary",
  "other",
];

const categoryLabels: Record<string, string> = {
  food: "Alimentation",
  transport: "Transport",
  shopping: "Shopping",
  leisure: "Loisirs",
  health: "Santé",
  housing: "Logement",
  salary: "Salaire",
  other: "Autre",
};

export function TransactionDetailsModal({
  transaction,
  open,
  onOpenChange,
  onCategoryChange,
}: TransactionDetailsModalProps) {
  if (!transaction) return null;

  const confidence = getCategoryConfidence(transaction);
  const getConfidenceDisplay = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.8) return "text-yellow-600";
    return "text-gray-400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input
              value={new Date(transaction.date).toLocaleDateString()}
              readOnly
            />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Input value={transaction.description} readOnly />
          </div>
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input
              value={`${transaction.amount.toFixed(2)} €`}
              className={
                transaction.amount < 0 ? "text-red-600" : "text-green-600"
              }
              readOnly
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <div className="flex items-center gap-2">
              <Select
                value={transaction.category || "other"}
                onValueChange={(value) =>
                  onCategoryChange(transaction.id, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {categoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {confidence >= 0.8 && (
                <Badge
                  variant="outline"
                  className={getConfidenceDisplay(confidence)}
                >
                  {Math.round(confidence * 100)}%
                </Badge>
              )}
            </div>
          </div>
          {transaction.merchant && (
            <div className="grid gap-2">
              <Label>Merchant</Label>
              <Input value={transaction.merchant} readOnly />
            </div>
          )}
          {transaction.location && (
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={`${transaction.location.lat}, ${transaction.location.lng}`}
                readOnly
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
