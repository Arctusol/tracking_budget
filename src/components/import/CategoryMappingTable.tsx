import React, { useState, useEffect } from "react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProcessedTransaction } from "@/lib/fileProcessing/types";
import { getCategoryConfidence } from "@/lib/categorization";
import { getCategories, buildCategoryHierarchy } from "@/lib/services/category.service";
import { Category } from "@/types/database";
import { AutoCategoryButton } from "./AutoCategoryButton";

// Déplacer la fonction en dehors du composant car c'est une fonction pure
const getConfidenceDisplay = (confidence: number): string => {
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.8) return "text-yellow-600";
  return "text-gray-400";
};

interface CategoryMappingTableProps {
  transactions?: ProcessedTransaction[];
  onCategoryChange?: (transactionId: string, category: string) => void;
}

const CategoryMappingTable = ({
  transactions = [],
  onCategoryChange = () => {},
}: CategoryMappingTableProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<ProcessedTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<(Category & { children: Category[] })[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        if (isMounted) {
          setCategories(cats);
          setCategoryHierarchy(buildCategoryHierarchy(cats));
          setError(null);
        }
      } catch (error) {
        if (isMounted) {
          setError("Impossible de charger les catégories. Veuillez réessayer plus tard.");
          console.error("Failed to load categories:", error);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const initialCategories: Record<string, string> = {};
    transactions.forEach((transaction) => {
      if (transaction.category_id) {
        initialCategories[transaction.id] = transaction.category_id;
      }
    });
    setSelectedCategories(initialCategories);
  }, [transactions]);

  const renderCategoryOptions = (cats: (Category & { children: Category[] })[]) => {
    return cats.map((category) => {
      if (category.children.length > 0) {
        return (
          <SelectGroup key={category.id}>
            <SelectLabel className="font-semibold text-sm text-gray-900 px-2 py-1.5 bg-gray-50">
              {category.name}
            </SelectLabel>
            {category.children.map((child) => (
              <SelectItem key={child.id} value={child.id} className="pl-4">
                {child.name}
              </SelectItem>
            ))}
          </SelectGroup>
        );
      }
      return (
        <SelectItem key={category.id} value={category.id} className="font-semibold">
          {category.name}
        </SelectItem>
      );
    });
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Vérification des catégories</h2>
        <p className="text-sm text-gray-500 mt-1">
          Vérifiez et ajustez les catégories attribuées automatiquement
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Catégorie</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const confidence = getCategoryConfidence(transaction);
              const selectedCategory = categories.find(c => c.id === (selectedCategories[transaction.id] || transaction.category_id));

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
                    <span className={transaction.type === 'expense' ? "text-red-600" : "text-green-600"}>
                      {(transaction.type === 'expense' ? '-' : '') + transaction.amount.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={selectedCategories[transaction.id] || transaction.category_id}
                        onValueChange={(value) => {
                          setSelectedCategories(prev => ({
                            ...prev,
                            [transaction.id]: value
                          }));
                          onCategoryChange(transaction.id, value);
                        }}
                      >
                        <SelectTrigger className="w-[200px] bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                          <SelectValue>
                            <span>{selectedCategory ? selectedCategory.name : "Sélectionner..."}</span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
                          {renderCategoryOptions(categoryHierarchy)}
                        </SelectContent>
                      </Select>
                      <AutoCategoryButton
                        description={transaction.description}
                        currentCategory={selectedCategory?.name || ""}
                        onCategoryDetected={(detectedCategory) => {
                          const cat = categories.find(c => c.name.toUpperCase() === detectedCategory);
                          if (cat) {
                            setSelectedCategories(prev => ({
                              ...prev,
                              [transaction.id]: cat.id
                            }));
                            onCategoryChange(transaction.id, cat.id);
                          }
                        }}
                      />
                      <span className={getConfidenceDisplay(confidence)}>
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onCategoryChange={onCategoryChange}
        />
      )}
    </div>
  );
};

export default CategoryMappingTable;
