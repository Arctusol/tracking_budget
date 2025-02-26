import React, { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NestedSelect } from "@/components/ui/nested-select";
import {
  CATEGORY_IDS,
  CATEGORY_NAMES,
  getCategoryName,
} from "@/lib/constants/constants";
import { AutoCategoryButton } from "@/components/import/AutoCategoryButton";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  amount: number;
  type: "expense" | "income";
  description: string;
  date: string;
  category_id?: string;
  created_by: string;
  shared_with?: string[];
  split_type?: string;
}

interface TransactionEditTableProps {
  transactions: Transaction[];
  onTransactionUpdated: () => void;
}

export function TransactionEditTable({
  transactions,
  onTransactionUpdated,
}: TransactionEditTableProps) {
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: keyof Transaction;
  } | null>(null);
  const [modifiedTransactions, setModifiedTransactions] = useState<{
    [key: string]: Partial<Transaction>;
  }>({});
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editRef.current && !editRef.current.contains(event.target as Node)) {
        handleSaveAll();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCellClick = (transaction: Transaction, field: keyof Transaction) => {
    setEditingCell({ id: transaction.id, field });
    if (!modifiedTransactions[transaction.id]) {
      const { id, description, amount, category_id, date, created_by, type } =
        transaction;
      setModifiedTransactions({
        ...modifiedTransactions,
        [transaction.id]: { id, description, amount, category_id, date, created_by, type },
      });
    }
  };

  const handleChange = (transactionId: string, changes: Partial<Transaction>) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    setModifiedTransactions((prevModified) => {
      if (!prevModified[transactionId]) {
        const { id, description, amount, category_id, date, created_by, type } =
          transaction;
        return {
          ...prevModified,
          [transactionId]: {
            id,
            description,
            amount,
            category_id,
            date,
            created_by,
            type,
            ...changes,
          },
        };
      } else {
        return {
          ...prevModified,
          [transactionId]: {
            ...prevModified[transactionId],
            ...changes,
          },
        };
      }
    });
  };

  const handleCategoryDetected = (transactionId: string, category: string) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    setModifiedTransactions((prevModified) => {
      if (!prevModified[transactionId]) {
        const { id, description, amount, date, created_by, type } = transaction;
        return {
          ...prevModified,
          [transactionId]: {
            id,
            description,
            amount,
            date,
            created_by,
            type,
            category_id: category,
          },
        };
      } else {
        return {
          ...prevModified,
          [transactionId]: {
            ...prevModified[transactionId],
            category_id: category,
          },
        };
      }
    });
  };

  const handleSaveAll = async () => {
    try {
      const updates = Object.entries(modifiedTransactions).map(([id, transaction]) => ({
        id,
        description: transaction.description,
        amount: transaction.amount,
        category_id: transaction.category_id,
        date: transaction.date,
        created_by: transaction.created_by,
        type: transaction.type,
      }));

      if (updates.length === 0) return;

      const { error } = await supabase
        .from("transactions")
        .upsert(updates);

      if (error) throw error;

      setEditingCell(null);
      setModifiedTransactions({});
      onTransactionUpdated();
    } catch (error) {
      console.error("Error updating transactions:", error);
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const selectAllTransactions = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((t) => t.id));
    }
  };

  const handleBulkCategoryChange = async (categoryId: string) => {
    const updates = selectedTransactions.map((id) => ({
      id,
      category_id: categoryId,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("transactions")
        .update({ category_id: update.category_id })
        .eq("id", update.id);

      if (error) {
        console.error("Error updating transaction:", error);
      }
    }

    onTransactionUpdated();
    setSelectedTransactions([]);
    setShowBulkEditModal(false);
  };

  const hasModifications = Object.keys(modifiedTransactions).length > 0;

  return (
    <div className="space-y-4">
      {selectedTransactions.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <span className="text-sm">
            {selectedTransactions.length} transaction(s) sélectionnée(s)
          </span>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={selectedTransactions.length === transactions.length}
                  onCheckedChange={selectAllTransactions}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const modifiedTransaction = {
                ...transaction,
                ...modifiedTransactions[transaction.id],
              };

              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                    />
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCellClick(transaction, "date")}
                  >
                    {editingCell?.id === transaction.id &&
                    editingCell?.field === "date" ? (
                      <div ref={editRef}>
                        <Input
                          type="date"
                          value={modifiedTransaction.date?.split("T")[0]}
                          onChange={(e) =>
                            handleChange(transaction.id, { date: e.target.value })
                          }
                          autoFocus
                        />
                      </div>
                    ) : (
                      new Date(modifiedTransaction.date).toLocaleDateString(
                        "fr-FR"
                      )
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCellClick(transaction, "description")}
                  >
                    {editingCell?.id === transaction.id &&
                    editingCell?.field === "description" ? (
                      <div ref={editRef}>
                        <Input
                          value={modifiedTransaction.description}
                          onChange={(e) =>
                            handleChange(transaction.id, {
                              description: e.target.value,
                            })
                          }
                          autoFocus
                        />
                      </div>
                    ) : (
                      modifiedTransaction.description
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCellClick(transaction, "category_id")}
                  >
                    <div className="flex items-center gap-2">
                      {editingCell?.id === transaction.id &&
                      editingCell?.field === "category_id" ? (
                        <div ref={editRef} className="w-full">
                          <NestedSelect
                            value={modifiedTransaction.category_id}
                            onValueChange={(value) => {
                              handleChange(transaction.id, { category_id: value });
                              setEditingCell(null);
                            }}
                            includeIncome={modifiedTransaction.type === "income"}
                          />
                        </div>
                      ) : (
                        <span>{getCategoryName(modifiedTransaction.category_id)}</span>
                      )}
                      <AutoCategoryButton
                        description={modifiedTransaction.description}
                        currentCategory={getCategoryName(
                          modifiedTransaction.category_id
                        )}
                        onCategoryDetected={(category) =>
                          handleCategoryDetected(transaction.id, category)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCellClick(transaction, "amount")}
                  >
                    {editingCell?.id === transaction.id &&
                    editingCell?.field === "amount" ? (
                      <div ref={editRef}>
                        <Input
                          type="number"
                          value={modifiedTransaction.amount}
                          onChange={(e) =>
                            handleChange(transaction.id, {
                              amount: parseFloat(e.target.value),
                            })
                          }
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span
                        className={
                          modifiedTransaction.type === "expense"
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {(modifiedTransaction.type === "expense" ? "-" : "+") +
                          modifiedTransaction.amount.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {hasModifications && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleSaveAll}>
            Enregistrer les modifications
          </Button>
        </div>
      )}

      <Dialog open={showBulkEditModal} onOpenChange={setShowBulkEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Choisissez une nouvelle catégorie pour les{" "}
              {selectedTransactions.length} transaction(s) sélectionnée(s).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <NestedSelect
              value=""
              onValueChange={handleBulkCategoryChange}
              placeholder="Sélectionner une catégorie"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
