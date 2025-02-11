import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AutoCategoryButton } from '../import/AutoCategoryButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { CATEGORY_IDS, CATEGORY_NAMES, getCategoryName } from "@/lib/fileProcessing/constants";

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

export function TransactionEditTable({ transactions, onTransactionUpdated }: TransactionEditTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [modifiedTransactions, setModifiedTransactions] = useState<{ [key: string]: Partial<Transaction> }>({});

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction.id);
    if (!modifiedTransactions[transaction.id]) {
      // S'assurer que nous gardons toutes les propriétés nécessaires de la transaction
      const { id, description, amount, category_id, date, created_by, type } = transaction;
      setModifiedTransactions({
        ...modifiedTransactions,
        [transaction.id]: { id, description, amount, category_id, date, created_by, type }
      });
    }
  };

  const handleChange = (transactionId: string, changes: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Utilisation du updater pattern pour garantir que nous avons toujours le dernier état
    setModifiedTransactions(prevModified => {
      if (!prevModified[transactionId]) {
        const { id, description, amount, category_id, date, created_by, type } = transaction;
        return {
          ...prevModified,
          [transactionId]: { 
            id, description, amount, category_id, date, created_by, type,
            ...changes 
          }
        };
      } else {
        return {
          ...prevModified,
          [transactionId]: {
            ...prevModified[transactionId],
            ...changes
          }
        };
      }
    });
  };

  const handleCategoryDetected = (transactionId: string, category: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Utilisation du updater pattern pour garantir que nous avons toujours le dernier état
    setModifiedTransactions(prevModified => {
      if (!prevModified[transactionId]) {
        const { id, description, amount, date, created_by, type } = transaction;
        return {
          ...prevModified,
          [transactionId]: { id, description, amount, date, created_by, type, category_id: category }
        };
      } else {
        return {
          ...prevModified,
          [transactionId]: {
            ...prevModified[transactionId],
            category_id: category
          }
        };
      }
    });
  };

  const handleSaveAll = async () => {
    try {
      // Filtrer les transactions qui ont été réellement modifiées
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
        .from('transactions')
        .upsert(updates);

      if (error) throw error;

      setEditingTransaction(null);
      setModifiedTransactions({});
      onTransactionUpdated();
    } catch (error) {
      console.error('Error updating transactions:', error);
    }
  };

  const handleCancel = () => {
    setEditingTransaction(null);
    setModifiedTransactions({});
  };

  const hasModifications = Object.keys(modifiedTransactions).length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const isEditing = editingTransaction === transaction.id;
              const modifiedTransaction = modifiedTransactions[transaction.id] || transaction;

              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={modifiedTransaction.date?.split('T')[0]}
                        onChange={(e) => handleChange(transaction.id, { date: e.target.value })}
                      />
                    ) : (
                      new Date(modifiedTransaction.date).toLocaleDateString('fr-FR')
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={modifiedTransaction.description}
                        onChange={(e) => handleChange(transaction.id, { description: e.target.value })}
                      />
                    ) : (
                      modifiedTransaction.description
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Select
                          value={modifiedTransaction.category_id || ''}
                          onValueChange={(value) => handleChange(transaction.id, { category_id: value })}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue>
                              {getCategoryName(modifiedTransaction.category_id)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORY_IDS).map(([key, id]) => (
                              <SelectItem key={id} value={id}>
                                {CATEGORY_NAMES[id]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span>{getCategoryName(modifiedTransaction.category_id)}</span>
                      )}
                      <AutoCategoryButton
                        description={modifiedTransaction.description}
                        currentCategory={getCategoryName(modifiedTransaction.category_id)}
                        onCategoryDetected={(category) => handleCategoryDetected(transaction.id, category)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={modifiedTransaction.amount}
                        onChange={(e) => handleChange(transaction.id, { amount: parseFloat(e.target.value) })}
                      />
                    ) : (
                      <span className={modifiedTransaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                        {(modifiedTransaction.type === 'expense' ? '-' : '+') + 
                         modifiedTransaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(transaction)}>
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {hasModifications && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Annuler les modifications
          </Button>
          <Button onClick={handleSaveAll}>
            Enregistrer les modifications
          </Button>
        </div>
      )}
    </div>
  );
}
