import React, { useEffect, useState } from "react";
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
  SelectGroup,
} from "@/components/ui/select";
import { ProcessedTransaction } from "@/lib/fileProcessing/types";
import { Badge } from "@/components/ui/badge";
import { getCategoryConfidence } from "@/lib/categorization";
import { getCategories, buildCategoryHierarchy } from "@/lib/services/category.service";
import { Category } from "@/types/database";
import { AutoCategoryButton } from "./AutoCategoryButton";

interface TransactionDetailsModalProps {
  transaction: ProcessedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryChange: (transactionId: string, category: string) => void;
}

export function TransactionDetailsModal({
  transaction,
  open,
  onOpenChange,
  onCategoryChange,
}: TransactionDetailsModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<(Category & { children: Category[] })[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
        setCategoryHierarchy(buildCategoryHierarchy(cats));
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  const renderCategoryOptions = (cats: (Category & { children: Category[] })[]) => {
    return cats.map((category) => (
      <React.Fragment key={category.id}>
        <SelectItem value={category.id}>
          {category.name}
        </SelectItem>
        {category.children.length > 0 && (
          <SelectGroup>
            {category.children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                ↳ {child.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </React.Fragment>
    ));
  };

  if (!transaction) return null;

  const confidence = getCategoryConfidence(transaction);
  const category = categories.find(c => c.id === transaction.category_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détails de la transaction</DialogTitle>
        </DialogHeader>
        {transaction && (
          <div className="grid gap-4 py-4">
            {/* Informations du relevé */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Informations du relevé</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Document:</span>
                  <p className="font-medium">{transaction.metadata?.document_name || "Non spécifié"}</p>
                </div>
                <div>
                  <span className="text-gray-600">N° Relevé:</span>
                  <p className="font-medium">{transaction.metadata?.numero_releve || "Non spécifié"}</p>
                </div>
                <div>
                  <span className="text-gray-600">Date d'arrêté:</span>
                  <p className="font-medium">{transaction.metadata?.date_arrete || "Non spécifié"}</p>
                </div>
              </div>
            </div>

            {/* Informations de la transaction */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  value={new Date(transaction.date).toLocaleDateString()}
                  readOnly
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={transaction.description}
                  readOnly
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  value={transaction.amount.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                  readOnly
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Select
                    value={transaction.category_id}
                    onValueChange={(value) =>
                      onCategoryChange(transaction.id, value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a category">
                        {category?.name || "Select a category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {renderCategoryOptions(categoryHierarchy)}
                    </SelectContent>
                  </Select>
                  <AutoCategoryButton
                    description={transaction.description}
                    currentCategory={category?.name || ""}
                    onCategoryDetected={(detectedCategory) => {
                      const cat = categories.find(c => c.name.toUpperCase() === detectedCategory);
                      if (cat) {
                        onCategoryChange(transaction.id, cat.id);
                      }
                    }}
                  />
                  {confidence > 0 && (
                    <Badge
                      variant="outline"
                      className={
                        confidence >= 0.9
                          ? "text-green-600"
                          : confidence >= 0.8
                          ? "text-yellow-600"
                          : "text-gray-400"
                      }
                    >
                      {Math.round(confidence * 100)}%
                    </Badge>
                  )}
                </div>
              </div>

              {transaction.metadata && (
                <>
                  {transaction.metadata.titulaire && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="titulaire" className="text-right">
                        Titulaire
                      </Label>
                      <Input
                        id="titulaire"
                        value={transaction.metadata.titulaire}
                        readOnly
                        className="col-span-3"
                      />
                    </div>
                  )}
                  {transaction.metadata.numero_releve && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="numero_releve" className="text-right">
                        N° Relevé
                      </Label>
                      <Input
                        id="numero_releve"
                        value={transaction.metadata.numero_releve}
                        readOnly
                        className="col-span-3"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
