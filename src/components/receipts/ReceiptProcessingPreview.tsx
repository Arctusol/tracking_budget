import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { AlertCircle, CheckCircle2, Info, Plus, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReceiptData, ReceiptItem, ReceiptDiscount } from "@/lib/services/receipt.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutoCategoryButton } from "../import/AutoCategoryButton";
import { ITEM_CATEGORIES, PRODUCT_CATEGORY_IDS } from "@/lib/constants/itemCategories";
import { getCategoryName } from "@/lib/constants/constants";
import { AddReceiptItemForm } from "./AddReceiptItemForm";
import { Input } from "@/components/ui/input";

// Créer un map des catégories
const categoryMap = Object.entries(ITEM_CATEGORIES).map(([key, category]) => ({
  id: category.id,
  name: category.frenchName,
  subType: category.subType
}));

interface ReceiptProcessingPreviewProps {
  isProcessing?: boolean;
  progress?: number;
  error?: string;
  receipt?: ReceiptData;
  onConfirm?: () => void;
  onCancel?: () => void;
  onUpdateCategory?: (itemIndex: number, categoryId: string) => void;
  onUpdateReceipt?: (receipt: ReceiptData) => void;
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            zIndex: 1,
            bottom: '100%',
            left: '70%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '0.8em',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

const ReceiptProcessingPreview = ({
  isProcessing = false,
  progress = 0,
  error = "",
  receipt,
  onConfirm,
  onCancel,
  onUpdateCategory,
  onUpdateReceipt,
}: ReceiptProcessingPreviewProps) => {
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{ index: number; description: string } | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ index: number; price: number } | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<{ index: number; quantity: number } | null>(null);

  // Calculer le total des articles (sans les remises)
  const calculatedTotal = useMemo(() => {
    if (!receipt?.items) return 0;
    return receipt.items.reduce((sum, item) => sum + item.total, 0);
  }, [receipt?.items]);

  // Calculer le total des remises
  const totalDiscounts = useMemo(() => {
    if (!receipt?.discounts) return 0;
    return receipt.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  }, [receipt?.discounts]);

  // Appliquer automatiquement les remises au total lors du premier rendu
  useEffect(() => {
    if (receipt && onUpdateReceipt && receipt.discounts && receipt.discounts.length > 0) {
      // Vérifier si les remises sont déjà appliquées au total
      const expectedTotal = calculatedTotal - totalDiscounts;
      
      // Si le total actuel ne reflète pas les remises, mettre à jour le reçu
      if (Math.abs(receipt.total - expectedTotal) > 0.01) {
        const updatedReceipt = {
          ...receipt,
          total: expectedTotal
        };
        
        console.log("Applying discounts automatically:", {
          calculatedTotal,
          totalDiscounts,
          oldTotal: receipt.total,
          newTotal: expectedTotal
        });
        
        onUpdateReceipt(updatedReceipt);
      }
    }
  }, [receipt, calculatedTotal, totalDiscounts, onUpdateReceipt]);

  const handleAddItem = (newItem: ReceiptItem) => {
    if (!receipt || !onUpdateReceipt) return;

    const updatedReceipt: ReceiptData = {
      ...receipt,
      items: [...receipt.items, newItem],
    };

    // Recalculer les totaux
    const calculatedTotal = updatedReceipt.items.reduce((sum, item) => sum + item.total, 0);
    const detectedTotal = receipt.validation?.detectedTotal ?? calculatedTotal;

    updatedReceipt.validation = {
      detectedTotal,
      calculatedTotal,
      discrepancy: Math.abs(detectedTotal - calculatedTotal),
      warnings: []
    };

    if (updatedReceipt.validation.discrepancy > 0.01) {
      if (detectedTotal > calculatedTotal) {
        updatedReceipt.validation.warnings.push(
          `Il manque potentiellement des articles pour un montant de ${updatedReceipt.validation.discrepancy.toFixed(2)}€`
        );
      } else {
        updatedReceipt.validation.warnings.push(
          `Le total calculé (${calculatedTotal.toFixed(2)}€) est supérieur au total du ticket (${detectedTotal.toFixed(2)}€)`
        );
      }
    }

    onUpdateReceipt(updatedReceipt);
    setShowAddItemForm(false);
  };

  const handleUpdateCategory = (index: number, categoryId: string) => {
    if (receipt && onUpdateReceipt) {
      const updatedReceipt = {
        ...receipt,
        items: receipt.items.map((item, i) => 
          i === index 
            ? { ...item, product_category_id: categoryId }
            : item
        )
      };
      onUpdateReceipt(updatedReceipt);
    }
    onUpdateCategory?.(index, categoryId);
  };

  const handleUpdateDiscount = (itemIndex: number, discount: number | undefined) => {
    if (!receipt || !onUpdateReceipt) return;

    const updatedReceipt = {
      ...receipt,
      items: receipt.items.map((item, index) => {
        if (index === itemIndex) {
          const originalTotal = item.originalTotal || item.total;
          return {
            ...item,
            discount,
            originalTotal: originalTotal,
            total: discount ? originalTotal - discount : originalTotal
          };
        }
        return item;
      })
    };

    // Recalculer le total du reçu
    const newTotal = updatedReceipt.items.reduce((sum, item) => sum + item.total, 0);
    updatedReceipt.total = newTotal;

    onUpdateReceipt(updatedReceipt);
  };

  const handleDeleteItem = (index: number) => {
    if (!receipt || !onUpdateReceipt) return;

    const updatedReceipt = {
      ...receipt,
      items: receipt.items.filter((_, i) => i !== index)
    };

    // Recalculer les totaux
    const calculatedTotal = updatedReceipt.items.reduce((sum, item) => sum + item.total, 0);
    updatedReceipt.total = calculatedTotal;

    onUpdateReceipt(updatedReceipt);
  };

  const handleEditDescription = (index: number, newDescription: string) => {
    if (!receipt || !onUpdateReceipt) return;

    const updatedReceipt = {
      ...receipt,
      items: receipt.items.map((item, i) => 
        i === index 
          ? { ...item, description: newDescription }
          : item
      )
    };

    onUpdateReceipt(updatedReceipt);
    setEditingItem(null);
  };

  const handleEditPrice = (index: number, newPrice: number) => {
    if (!receipt || !onUpdateReceipt) return;

    const updatedReceipt = {
      ...receipt,
      items: receipt.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { 
            ...item, 
            price: newPrice,
            total: newPrice * item.quantity
          };
          
          // Si l'article a une remise, recalculer le total après remise
          if (item.discount) {
            updatedItem.originalTotal = updatedItem.total;
            updatedItem.total = updatedItem.total - item.discount;
          }
          
          return updatedItem;
        }
        return item;
      })
    };

    // Recalculer le total du reçu
    const calculatedTotal = updatedReceipt.items.reduce((sum, item) => sum + item.total, 0);
    const totalDiscounts = updatedReceipt.discounts?.reduce((sum, d) => sum + d.amount, 0) || 0;
    updatedReceipt.total = calculatedTotal - totalDiscounts;

    onUpdateReceipt(updatedReceipt);
    setEditingPrice(null);
  };

  const handleEditQuantity = (index: number, newQuantity: number) => {
    if (!receipt || !onUpdateReceipt) return;

    const updatedReceipt = {
      ...receipt,
      items: receipt.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { 
            ...item, 
            quantity: newQuantity,
            total: item.price * newQuantity
          };
          
          // Si l'article a une remise, recalculer le total après remise
          if (item.discount) {
            updatedItem.originalTotal = updatedItem.total;
            updatedItem.total = updatedItem.total - item.discount;
          }
          
          return updatedItem;
        }
        return item;
      })
    };

    // Recalculer le total du reçu
    const calculatedTotal = updatedReceipt.items.reduce((sum, item) => sum + item.total, 0);
    const totalDiscounts = updatedReceipt.discounts?.reduce((sum, d) => sum + d.amount, 0) || 0;
    updatedReceipt.total = calculatedTotal - totalDiscounts;

    onUpdateReceipt(updatedReceipt);
    setEditingQuantity(null);
  };

  const handleAddGlobalDiscount = () => {
    if (!receipt || !onUpdateReceipt) return;

    const newDiscount: ReceiptDiscount = {
      description: "Remise",
      amount: 0,
      type: "total"
    };

    const updatedReceipt = {
      ...receipt,
      discounts: [...(receipt.discounts || []), newDiscount]
    };

    onUpdateReceipt(updatedReceipt);
  };

  const handleUpdateGlobalDiscount = (index: number, updatedDiscount: ReceiptDiscount) => {
    if (!receipt || !onUpdateReceipt) return;

    const updatedReceipt = {
      ...receipt,
      discounts: receipt.discounts?.map((discount, i) => 
        i === index ? updatedDiscount : discount
      ) || []
    };

    // Recalculer le total après mise à jour des remises
    const newTotalDiscounts = updatedReceipt.discounts.reduce((sum, d) => sum + d.amount, 0);
    updatedReceipt.total = calculatedTotal - newTotalDiscounts;

    onUpdateReceipt(updatedReceipt);
  };

  const handleRemoveGlobalDiscount = (index: number) => {
    if (!receipt || !onUpdateReceipt) return;

    const updatedDiscounts = receipt.discounts?.filter((_, i) => i !== index) || [];
    
    const updatedReceipt = {
      ...receipt,
      discounts: updatedDiscounts
    };

    // Recalculer le total après suppression de la remise
    const newTotalDiscounts = updatedDiscounts.reduce((sum, d) => sum + d.amount, 0);
    updatedReceipt.total = calculatedTotal - newTotalDiscounts;

    onUpdateReceipt(updatedReceipt);
  };

  return (
    <div className="w-full bg-gray-50 rounded-lg">
      {isProcessing ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Traitement en cours...</h3>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500">
              Analyse du ticket de caisse en cours. Veuillez patienter...
            </p>
          </div>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </Alert>
      ) : receipt ? (
        <div className="space-y-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Ticket de caisse analysé avec succès</AlertTitle >
            <AlertDescription>
              Veuillez vérifier les informations extraites ci-dessous.
            </AlertDescription >
          </Alert >

          {receipt && !isProcessing && !error && (
            <Card className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Détails du ticket</h3>
                <div className="flex space-x-2">
                  <Button onClick={onCancel} variant="outline">
                    Annuler
                  </Button>
                  <Button onClick={onConfirm}>Confirmer</Button>
                </div>
              </div>

              {/* <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Différence de total détectée</AlertTitle >
                <AlertDescription>
                  <p>Il y a une différence entre le total détecté sur le ticket ({receipt.validation.detectedTotal.toFixed(2)}€) 
                  et le total calculé à partir des articles ({receipt.validation.calculatedTotal.toFixed(2)}€).</p >
                  <p className="mt-2">Différence : {receipt.validation.discrepancy.toFixed(2)}€</p >
                  <p className="mt-2 text-sm text-gray-500">Cela peut être dû à des remises ou des articles non détectés.</p >
                </AlertDescription >
              </Alert > */}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Marchand</p >
                    <p className="font-medium">{receipt.merchantName || "Non détecté"}</p >
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p >
                    <p className="font-medium">
                      {receipt.date
                        ? new Date(receipt.date).toLocaleDateString("fr-FR")
                        : "Non détectée"}
                    </p >
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p >
                    <p className="font-medium">
                      {receipt.total
                        ? new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(receipt.total)
                        : "Non détecté"}
                    </p >
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Catégorie</p >
                    <p className="font-medium">{receipt.category_id ? getCategoryName(receipt.category_id) : "Non catégorisé"}</p >
                  </div>
                </div>

                {receipt.items && receipt.items.length > 0 && (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium">Articles</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddItemForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un article
                      </Button>
                    </div>

                    {showAddItemForm && (
                      <Card className="p-4 mb-4">
                        <h5 className="text-sm font-medium mb-4">Ajouter un article</h5>
                        <AddReceiptItemForm
                          onSubmit={handleAddItem}
                          onCancel={() => setShowAddItemForm(false)}
                        />
                      </Card>
                    )}

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap w-[25%]">Description</TableHead >
                            <TableHead className="whitespace-nowrap w-[10%]">Quantité</TableHead >
                            <TableHead className="whitespace-nowrap w-[12%]">Prix unitaire</TableHead >
                            <TableHead className="whitespace-nowrap w-[12%]">Total</TableHead >
                            <TableHead className="whitespace-nowrap w-[12%]">Remise</TableHead >
                            <TableHead className="whitespace-nowrap w-[20%]">Catégorie</TableHead >
                            <TableHead className="whitespace-nowrap w-[9%]">Actions</TableHead >
                          </TableRow >
                        </TableHeader >
                        <TableBody>
                          {receipt.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => !editingItem && setEditingItem({ index, description: item.description })}
                              >
                                {editingItem?.index === index ? (
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      value={editingItem.description}
                                      onChange={(e) => setEditingItem({ index, description: e.target.value })}
                                      className="w-full"
                                      autoFocus
                                      onBlur={() => handleEditDescription(index, editingItem.description)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleEditDescription(index, editingItem.description);
                                        } else if (e.key === 'Escape') {
                                          setEditingItem(null);
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    
                                    <Tooltip text="Cliquer pour modifier">
                                      <span>{item.description}</span>
                                    </Tooltip>
                                  </div>
                                )}
                              </TableCell >
                              <TableCell 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => !editingQuantity && setEditingQuantity({ index, quantity: item.quantity })}
                              >
                                {editingQuantity?.index === index ? (
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      value={editingQuantity.quantity}
                                      onChange={(e) => setEditingQuantity({ 
                                        index, 
                                        quantity: parseInt(e.target.value) || 1 
                                      })}
                                      className="w-20"
                                      min="1"
                                      autoFocus
                                      onBlur={() => handleEditQuantity(index, editingQuantity.quantity)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleEditQuantity(index, editingQuantity.quantity);
                                        } else if (e.key === 'Escape') {
                                          setEditingQuantity(null);
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <Tooltip text="Cliquer pour modifier">
                                    <span>{item.quantity}</span>
                                  </Tooltip >
                                )}
                              </TableCell >
                              <TableCell 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => !editingPrice && setEditingPrice({ index, price: item.price })}
                              >
                                {editingPrice?.index === index ? (
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingPrice.price}
                                      onChange={(e) => setEditingPrice({ 
                                        index, 
                                        price: parseFloat(e.target.value) || 0 
                                      })}
                                      className="w-24"
                                      min="0"
                                      autoFocus
                                      onBlur={() => handleEditPrice(index, editingPrice.price)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleEditPrice(index, editingPrice.price);
                                        } else if (e.key === 'Escape') {
                                          setEditingPrice(null);
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <Tooltip text="Cliquer pour modifier">
                                    <span>
                                      {new Intl.NumberFormat("fr-FR", {
                                        style: "currency",
                                        currency: "EUR",
                                      }).format(item.price)}
                                    </span>
                                  </Tooltip >
                                )}
                              </TableCell >
                              <TableCell>
                                <div className="flex items-center justify-between">
                                  <span className={item.discount ? "line-through text-gray-500" : ""}>
                                    {item.total.toFixed(2)} €
                                  </span>
                                  {item.discount && (
                                    <span className="text-green-600">
                                      {(item.total - item.discount).toFixed(2)} €
                                    </span>
                                  )}
                                </div>
                              </TableCell >
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    placeholder="Remise"
                                    value={item.discount || ""}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      handleUpdateDiscount(index, isNaN(value) ? undefined : value);
                                    }}
                                    className="w-24"
                                  />
                                  {item.discount && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleUpdateDiscount(index, undefined)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell >
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Select
                                    value={item.product_category_id || ""}
                                    onValueChange={(value) => handleUpdateCategory(index, value)}
                                  >
                                    <SelectTrigger className="w-full max-w-[150px]">
                                      <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger >
                                    <SelectContent>
                                      {categoryMap.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                          {category.name}
                                        </SelectItem >
                                      ))}
                                    </SelectContent >
                                  </Select >
                                  <AutoCategoryButton
                                    description={item.description}
                                    currentCategory={categoryMap.find(cat => cat.id === item.product_category_id)?.name || "Autre"}
                                    onCategoryDetected={(category) => handleUpdateCategory(index, category)}
                                    type="product"
                                  />
                                </div>
                              </TableCell >
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-800"
                                    onClick={() => handleDeleteItem(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell >
                            </TableRow >
                          ))}
                          {receipt.discounts?.map((discount, index) => (
                            <TableRow key={`discount-${index}`} className="bg-gray-50">
                              <TableCell colSpan={3}>{discount.description}</TableCell >
                              <TableCell colSpan={3} className="text-green-600">
                                -{discount.amount.toFixed(2)} €
                              </TableCell >
                            </TableRow >
                          ))}
                          <TableRow className="font-bold">
                            <TableCell colSpan={6}>
                              <div className="flex items-center justify-between">
                                <span>Sous-total</span>
                                <span>{calculatedTotal.toFixed(2)} €</span>
                              </div>
                            </TableCell >
                          </TableRow >
                          
                          {/* Remises existantes */}
                          {receipt.discounts?.map((discount, index) => (
                            <TableRow key={`discount-${index}`} className="bg-gray-50">
                              <TableCell colSpan={6}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <Input
                                      value={discount.description}
                                      onChange={(e) => handleUpdateGlobalDiscount(index, {
                                        ...discount,
                                        description: e.target.value
                                      })}
                                      className="w-64"
                                    />
                                    <Input
                                      type="number"
                                      value={discount.amount}
                                      onChange={(e) => handleUpdateGlobalDiscount(index, {
                                        ...discount,
                                        amount: parseFloat(e.target.value) || 0
                                      })}
                                      className="w-24"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveGlobalDiscount(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <span className="text-green-600">-{discount.amount.toFixed(2)} €</span>
                                </div>
                              </TableCell >
                            </TableRow >
                          ))}

                          {/* Bouton pour ajouter une remise */}
                          <TableRow>
                            <TableCell colSpan={6}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddGlobalDiscount}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter une remise
                              </Button>
                            </TableCell >
                          </TableRow >

                          {/* Total final */}
                          <TableRow className="font-bold text-lg">
                            <TableCell colSpan={6}>
                              <div className="flex items-center justify-between">
                                <span>Total</span>
                                <span>{receipt.total.toFixed(2)} €</span>
                              </div>
                            </TableCell >
                          </TableRow >
                      
                        </TableBody >
                      </Table >
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
          <div className="flex justify-between items-center space-x-2">
            <Button onClick={onCancel} variant="outline">
              Annuler
            </Button>
            <Button onClick={onConfirm}>Confirmer</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReceiptProcessingPreview;
