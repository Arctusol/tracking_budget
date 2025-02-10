import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AutoCategoryButton } from '../import/AutoCategoryButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { CATEGORY_IDS, getCategoryName } from "@/lib/fileProcessing/constants";

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
  const [editValues, setEditValues] = useState<Partial<Transaction>>({});

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction.id);
    setEditValues(transaction);
  };

  const handleSave = async (transaction: Partial<Transaction>) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: transaction.description,
          amount: transaction.amount,
          category_id: transaction.category_id,
          date: transaction.date,
        })
        .eq('id', transaction.id);

      if (error) throw error;

      setEditingTransaction(null);
      onTransactionUpdated();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleCancel = () => {
    setEditingTransaction(null);
    setEditValues({});
  };

  const handleCategoryDetected = (transactionId: string, category: string) => {
    const categoryId = Object.entries(CATEGORY_IDS).find(([_, name]) => name === category)?.[0];
    if (categoryId) {
      handleSave({
        ...editValues,
        id: transactionId,
        category_id: categoryId,
      });
    }
  };

  return (
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
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {editingTransaction === transaction.id ? (
                  <Input
                    type="date"
                    value={editValues.date?.split('T')[0]}
                    onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                  />
                ) : (
                  new Date(transaction.date).toLocaleDateString('fr-FR')
                )}
              </TableCell>
              <TableCell>
                {editingTransaction === transaction.id ? (
                  <Input
                    value={editValues.description}
                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  />
                ) : (
                  transaction.description
                )}
              </TableCell>
              <TableCell>
                {editingTransaction === transaction.id ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={editValues.category_id || transaction.category_id || ''}
                      onValueChange={(value) => handleSave({ ...transaction, category_id: value })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_IDS).map(([id, name]) => (
                          <SelectItem key={id} value={id}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AutoCategoryButton
                      description={transaction.description}
                      currentCategory={getCategoryName(transaction.category_id)}
                      onCategoryDetected={(category) => {
                        const categoryId = Object.entries(CATEGORY_IDS).find(([_, name]) => name === category)?.[0];
                        if (categoryId) {
                          handleSave({
                            ...transaction,
                            category_id: categoryId
                          });
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{getCategoryName(transaction.category_id)}</span>
                    <AutoCategoryButton
                      description={transaction.description}
                      currentCategory={getCategoryName(transaction.category_id)}
                      onCategoryDetected={(category) => {
                        const categoryId = Object.entries(CATEGORY_IDS).find(([_, name]) => name === category)?.[0];
                        if (categoryId) {
                          handleSave({
                            ...transaction,
                            category_id: categoryId
                          });
                        }
                      }}
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editingTransaction === transaction.id ? (
                  <Input
                    type="number"
                    value={editValues.amount}
                    onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) })}
                  />
                ) : (
                  transaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                )}
              </TableCell>
              <TableCell>
                {editingTransaction === transaction.id ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(editValues)}>
                      Enregistrer
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleEdit(transaction)}>
                    Modifier
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
