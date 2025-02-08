import React, { useState } from "react";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProcessedTransaction } from "@/lib/fileProcessing";
import { getCategoryConfidence } from "@/lib/categorization";

interface CategoryMappingTableProps {
  transactions?: ProcessedTransaction[];
  onCategoryChange?: (transactionId: string, category: string) => void;
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

const CategoryMappingTable = ({
  transactions = [],
  onCategoryChange = () => {},
}: CategoryMappingTableProps) => {
  const [selectedTransaction, setSelectedTransaction] =
    useState<ProcessedTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const getConfidenceDisplay = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.8) return "text-yellow-600";
    return "text-gray-400";
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Review Categories</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review and adjust the automatically assigned categories
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const confidence = getCategoryConfidence(transaction);

              return (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setIsModalOpen(true);
                  }}
                >
                  <TableCell className="whitespace-nowrap">
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <span
                      className={
                        transaction.amount < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {transaction.amount.toFixed(2)} €
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={transaction.category || "other"}
                        onValueChange={(value) =>
                          onCategoryChange(transaction.id, value)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
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
                  </TableCell>
                </TableRow>
              );
            })}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  No transactions to display
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
};

export default CategoryMappingTable;
