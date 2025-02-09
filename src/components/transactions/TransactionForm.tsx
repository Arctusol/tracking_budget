import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { createTransaction, updateTransaction } from '@/lib/services/transaction.service';
import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionCategory, TransactionType } from '@/types/transaction';

const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['expense', 'income', 'transfer']),
  description: z.string().min(1),
  date: z.date(),
  category_id: z.string().optional(),
  merchant: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: Transaction;
  categories: TransactionCategory[];
  onSuccess: () => void;
}

export function TransactionForm({ transaction, categories, onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction ? {
      ...transaction,
      date: new Date(transaction.date),
    } : {
      date: new Date(),
      type: 'expense' as const,
      amount: 0,
      description: '',
      category_id: '',
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);
      const formattedData: Partial<Transaction> = {
        ...data,
        date: data.date.toISOString().split('T')[0],
        amount: Number(data.amount),
        type: data.type,
        description: data.description,
      };

      if (transaction) {
        await updateTransaction(transaction.id, formattedData, transaction.created_by);
      } else {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) throw new Error("Utilisateur non connecté");
        
        const newTransaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
          ...formattedData,
          amount: Number(data.amount),
          type: data.type,
          description: data.description,
          date: data.date.toISOString().split('T')[0],
          created_by: userId,
        } as const;
        
        await createTransaction(newTransaction);
      }

      toast({
        title: `Transaction ${transaction ? 'mise à jour' : 'créée'} avec succès`,
        variant: "default",
      });
      reset();
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Montant</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            onValueChange={(value) => setValue('type', value as TransactionType)}
            defaultValue={watch('type')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Dépense</SelectItem>
              <SelectItem value="income">Revenu</SelectItem>
              <SelectItem value="transfer">Transfert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !watch('date') && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watch('date') ? format(watch('date'), 'P') : <span>Choisir une date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={watch('date')}
              onSelect={(date) => setValue('date', date as Date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Select
          onValueChange={(value) => setValue('category_id', value)}
          defaultValue={watch('category_id')}
        >
          <SelectTrigger>
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

      <div className="space-y-2">
        <Label htmlFor="merchant">Marchand</Label>
        <Input
          id="merchant"
          {...register('merchant')}
          placeholder="Nom du marchand..."
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Enregistrement...' : transaction ? 'Mettre à jour' : 'Créer'}
      </Button>
    </form>
  );
}
