import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ITEM_CATEGORIES } from "@/lib/constants/itemCategories";
import { ReceiptItem } from "@/lib/services/receipt.service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  quantity: z.number().min(1, "La quantité doit être supérieure à 0"),
  price: z.number().min(0.01, "Le prix doit être supérieur à 0"),
  category_id: z.string().min(1, "La catégorie est requise"),
});

interface AddReceiptItemFormProps {
  onSubmit: (item: ReceiptItem) => void;
  onCancel: () => void;
}

// Créer un map des catégories
const categoryMap = Object.entries(ITEM_CATEGORIES).map(([key, category]) => ({
  id: key,
  name: category.frenchName,
  subType: category.subType
}));

export function AddReceiptItemForm({ onSubmit, onCancel }: AddReceiptItemFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      quantity: 1,
      price: 0,
      category_id: "OTHER",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const total = values.quantity * values.price;
    onSubmit({
      description: values.description,
      quantity: values.quantity,
      price: values.price,
      total,
      product_category_id: values.category_id,
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Description de l'article" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix unitaire (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryMap.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                      {category.subType && ` (${category.subType})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">Ajouter</Button>
        </div>
      </form>
    </Form>
  );
}
