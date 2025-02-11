import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IndeterminateCheckbox } from '@/components/ui/checkbox-indeterminate';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income' | 'transfer';
}

interface AddGroupTransactionsDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionsAdded: () => void;
}

export function AddGroupTransactionsDialog({
  groupId,
  open,
  onOpenChange,
  onTransactionsAdded,
}: AddGroupTransactionsDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadUserTransactions();
      setSelectedTransactions([]); // Réinitialiser la sélection à l'ouverture
    }
  }, [open]);

  async function loadUserTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .is('group_id', null)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      return;
    }

    setTransactions(data || []);
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(transactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const isAllSelected = transactions.length > 0 && selectedTransactions.length === transactions.length;
  const isPartiallySelected = selectedTransactions.length > 0 && selectedTransactions.length < transactions.length;

  async function handleAddToGroup() {
    if (selectedTransactions.length === 0) return;

    setLoading(true);
    const { error } = await supabase
      .from('transactions')
      .update({ group_id: groupId })
      .in('id', selectedTransactions);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les transactions au groupe",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: `${selectedTransactions.length} transaction(s) ajoutée(s) au groupe avec succès`,
      });
      onTransactionsAdded();
      onOpenChange(false);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter des transactions existantes au groupe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* En-tête avec "Tout sélectionner" */}
          <div className="flex items-center space-x-4 p-2 border-b">
            <IndeterminateCheckbox
              checked={isAllSelected}
              indeterminate={isPartiallySelected}
              onCheckedChange={toggleSelectAll}
            />
            <span className="font-medium">
              Tout sélectionner ({selectedTransactions.length}/{transactions.length})
            </span>
          </div>

          {/* Liste des transactions */}
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center space-x-4 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => {
                  setSelectedTransactions(prev =>
                    prev.includes(transaction.id)
                      ? prev.filter(id => id !== transaction.id)
                      : [...prev, transaction.id]
                  );
                }}
              >
                <IndeterminateCheckbox
                  checked={selectedTransactions.includes(transaction.id)}
                  onCheckedChange={(checked) => {
                    setSelectedTransactions(prev =>
                      checked
                        ? [...prev, transaction.id]
                        : prev.filter(id => id !== transaction.id)
                    );
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    <span className={transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                      {transaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddToGroup} 
            disabled={selectedTransactions.length === 0 || loading}
          >
            {loading 
              ? "Ajout en cours..." 
              : `Ajouter ${selectedTransactions.length} transaction(s)`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 