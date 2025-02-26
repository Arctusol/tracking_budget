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
import { detectTransactionCategory, CategoryDetectionResult } from "@/lib/services/categoryDetectionService";
import { getCategories, buildCategoryHierarchy } from "@/lib/services/category.service";
import { Category } from "@/types/database";
import { AutoCategoryButton } from "./AutoCategoryButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Déplacer la fonction en dehors du composant car c'est une fonction pure
const getConfidenceDisplay = (confidence: number): string => {
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.7) return "text-yellow-600";
  return "text-gray-400";
};

interface CategoryMappingTableProps {
  transactions?: ProcessedTransaction[];
  onCategoryChange?: (transactionId: string, category: string) => void;
}

interface DetectionInfo {
  method: 'priority' | 'exact' | 'pattern' | 'amount' | 'none';
  confidence: number;
  source: 'historical' | 'rules' | 'keywords' | 'amount';
  ignored?: boolean;
  categoryId: string;
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
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [detectionMethods, setDetectionMethods] = useState<Record<string, DetectionInfo>>({});
  const [isProcessing, setIsProcessing] = useState(false);

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
    const processTransactions = async () => {
      if (transactions.length === 0) return;
      
      setIsProcessing(true);
      const initialCategories: Record<string, string> = {};
      const methods: Record<string, DetectionInfo> = {};

      try {
        // Process in batches of 10 transactions
        const BATCH_SIZE = 10;
        for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
          const batch = transactions.slice(i, i + BATCH_SIZE);
          const detectionPromises = batch.map(async (transaction) => {
            if (!transaction.category_id) {
              const detection = await detectTransactionCategory(transaction);
              return {
                id: transaction.id,
                detection,
              };
            }
            return {
              id: transaction.id,
              detection: {
                categoryId: transaction.category_id,
                confidence: 1,
                source: 'historical' as const
              }
            };
          });

          const results = await Promise.all(detectionPromises);
          
          results.forEach(({ id, detection }) => {
            initialCategories[id] = detection.categoryId;
            methods[id] = {
              ...detection,
              method: detection.source === 'historical' ? 'none' :
                     detection.confidence >= 0.9 ? 'priority' :
                     detection.confidence >= 0.8 ? 'exact' : 'pattern',
              categoryId: detection.categoryId,
            };
          });
        }

        setSelectedCategories((prev) => ({ ...prev, ...initialCategories }));
        setDetectionMethods((prev) => ({ ...prev, ...methods }));
      } catch (error) {
        console.error("Error processing transactions:", error);
        setError("Une erreur est survenue lors du traitement des transactions.");
      } finally {
        setIsProcessing(false);
      }
    };

    processTransactions();
  }, [transactions]);

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const selectAllTransactions = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const handleCategoryChange = (transactionId: string, categoryId: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [transactionId]: categoryId
    }));
    setDetectionMethods(prev => ({
      ...prev,
      [transactionId]: {
        categoryId,
        confidence: 1,
        source: 'historical',
        method: 'none',
      }
    }));
    onCategoryChange(transactionId, categoryId);
  };

  const handleBulkCategoryChange = (categoryId: string) => {
    const newCategories = { ...selectedCategories };
    const newMethods = { ...detectionMethods };

    selectedTransactions.forEach(id => {
      newCategories[id] = categoryId;
      newMethods[id] = {
        categoryId,
        confidence: 1,
        source: 'historical',
        method: 'none',
      };
      onCategoryChange(id, categoryId);
    });

    setSelectedCategories(newCategories);
    setDetectionMethods(newMethods);
    setSelectedTransactions([]);
    setShowBulkEditModal(false);
  };

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

      {/* Processing indicator */}
      {isProcessing && (
        <div className="p-4 border-b bg-muted">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">
              Traitement des transactions en cours...
            </p>
          </div>
        </div>
      )}

      {/* Bulk Edit Actions */}
      {selectedTransactions.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md mx-4 my-2">
          <span className="text-sm">{selectedTransactions.length} transaction(s) sélectionnée(s)</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBulkEditModal(true)}
          >
            Modifier la catégorie
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTransactions([])}
          >
            Annuler
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedTransactions.length === transactions.length}
                  onCheckedChange={selectAllTransactions}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead className="min-w-[200px]">
                <div className="flex items-center gap-2">
                  Catégorie
                  <span className="text-xs text-muted-foreground font-normal">
                    (source de détection)
                  </span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const detectionInfo = detectionMethods[transaction.id];
              const confidence = detectionInfo?.confidence || 0;

              return (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setIsModalOpen(true);
                  }}
                >
                  <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTransactions([...selectedTransactions, transaction.id]);
                        } else {
                          setSelectedTransactions(selectedTransactions.filter(id => id !== transaction.id));
                        }
                      }}
                      aria-label={`Select transaction ${transaction.description}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
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
                        onValueChange={(value) => handleCategoryChange(transaction.id, value)}
                      >
                        <SelectTrigger className="w-[200px] bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                          <SelectValue>
                            <span>{categories.find(c => c.id === (selectedCategories[transaction.id] || transaction.category_id))?.name || "Sélectionner..."}</span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
                          {renderCategoryOptions(categoryHierarchy)}
                        </SelectContent>
                      </Select>
                      <AutoCategoryButton
                        description={transaction.description}
                        currentCategory={categories.find(c => c.id === (selectedCategories[transaction.id] || transaction.category_id))?.name || ""}
                        onCategoryDetected={(detectedCategory) => {
                          const cat = categories.find(c => c.name.toUpperCase() === detectedCategory);
                          if (cat) {
                            handleCategoryChange(transaction.id, cat.id);
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Edit Modal */}
      <Dialog open={showBulkEditModal} onOpenChange={setShowBulkEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={handleBulkCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCategoryChange={(categoryId) => {
          if (selectedTransaction) {
            handleCategoryChange(selectedTransaction.id, categoryId);
          }
        }}
      />
    </div>
  );
};

export default CategoryMappingTable;
