import { supabase } from "@/lib/supabase";
import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import { getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";
import { findMerchantIdByName } from "@/lib/constants/merchants";
import { 
  DocumentAnalysisError,
  ConfigurationError,
  ExtractError,
  DocumentProcessingError,
} from "../errors/documentProcessingErrors";
import { detectCategory } from "../fileProcessing/categoryDetection";
import { detectItemCategory } from '../constants/itemCategories';
import { CATEGORY_IDS } from "../constants/constants";

export interface ReceiptData {
  id?: string;
  user_id: string;
  merchantName?: string;
  merchant_id?: string;
  total: number;
  date: string;
  items: ReceiptItem[];
  category_id: string;
  image_url?: string;
  status: 'pending' | 'processed' | 'error';
  error?: string;
  metadata?: any;
  group_id?: string;
  discounts?: ReceiptDiscount[];
  validation?: {
    detectedTotal: number;
    calculatedTotal: number;
    discrepancy: number;
    warnings: string[];
  };
}

export interface ReceiptDiscount {
  description: string;
  amount: number;
  type: 'item' | 'total';
  itemIndex?: number;  // Si la remise s'applique à un article spécifique
}

export interface ReceiptItem {
  id?: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  product_category_id?: string;
  merchant_id?: string;
  discount?: number;  // Montant de la remise sur cet article
  originalTotal?: number;  // Total avant remise
}

interface PolygonBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function isWithinPolygon(bounds: PolygonBounds, x: number, y: number): boolean {
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

function extractNumberFromString(str: string): number {
  const match = str.match(/(\d+[.,]\d+)/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  const intMatch = str.match(/(\d+)/);
  if (intMatch) {
    return parseInt(intMatch[1], 10);
  }
  return 0;
}

export async function analyzeReceipt(file: File): Promise<ReceiptData | null> {
  try {
    const endpoint = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      throw new ConfigurationError("Azure Document Intelligence credentials not configured");
    }

    // Read file as base64
    const base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    console.log("Sending request to Azure...");
    const client = DocumentIntelligence(endpoint, { key });

    const initialResponse = await client
      .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
      .post({
        contentType: "application/json",
        body: {
          base64Source: base64Content
        }
      });

    console.log("Got initial response:", initialResponse);
    if (isUnexpected(initialResponse)) {
      console.error("Unexpected response:", initialResponse);
      throw initialResponse.body.error;
    }

    const poller = getLongRunningPoller(client, initialResponse);
    console.log("Waiting for Azure receipt analysis to complete...");
    const result = await poller.pollUntilDone();
    console.log("Azure receipt analysis completed", result);

    if (!result.body || typeof result.body !== 'object' || !('analyzeResult' in result.body)) {
      console.error("Invalid response format:", result.body);
      throw new ExtractError("Invalid response format from Azure");
    }

    const analyzeResult = result.body.analyzeResult as any;
    console.log("Tables found:", analyzeResult.tables?.length);
    
    // Extract merchant name from the first line (title)
    let merchantName = "Unknown Merchant";
    let merchant_id = null;
    const firstLine = analyzeResult.pages?.[0]?.lines?.[0];
    if (firstLine?.content) {
      merchantName = firstLine.content.trim();
      merchant_id = findMerchantIdByName(merchantName);
    }
    console.log("Merchant name:", merchantName, "Merchant ID:", merchant_id);

    // Extract items from the table structure
    const items: ReceiptItem[] = [];
    const discounts: ReceiptDiscount[] = [];
    let total = 0;

    // Process all tables from the document
    if (analyzeResult.tables && analyzeResult.tables.length > 0) {
      console.log(`Processing ${analyzeResult.tables.length} tables...`);

      let isAfterTotal = false; // Flag pour indiquer si on a dépassé la section des articles

      for (const table of analyzeResult.tables) {
        console.log("Processing table with", table.cells.length, "cells");
        
        // Group cells by row
        const cellsByRow = table.cells.reduce((acc: any, cell: any) => {
          if (!acc[cell.rowIndex]) {
            acc[cell.rowIndex] = [];
          }
          acc[cell.rowIndex].push(cell);
          return acc;
        }, {});

        // Process each row
        Object.entries(cellsByRow).forEach(([rowIndex, cells]: [string, any[]]) => {
          console.log("Processing row", rowIndex, "with cells:", cells.length);

          // Find description cell (usually first column)
          const descriptionCell = cells.find(cell => 
            cell.columnIndex === 0 && 
            cell.content && 
            !cell.content.toLowerCase().includes('montant') && 
            !cell.content.toLowerCase().includes('total') &&
            !cell.content.toLowerCase().includes('ticket') &&
            !cell.content.toLowerCase().includes('article') &&
            !cell.content.toLowerCase().includes('nombre de lignes')
          );

          if (!descriptionCell?.content) return;
          
          const description = descriptionCell.content.trim();
          
          // Vérifier si on a atteint la section des totaux
          if (description.toLowerCase().includes('a payer') || 
              description.toLowerCase().includes('total eligible') ||
              description.toLowerCase().includes('carte') ||
              description.toLowerCase().includes('tva') ||
              description.toLowerCase().includes('cb')) {
            isAfterTotal = true;
            return;
          }

          // Skip if we're after the total section
          if (isAfterTotal) return;

          // Skip if this is already processed as a discount
          if (discounts.some(d => d.description === description)) return;

          // Find quantity cell (usually in the middle)
          const quantityCell = cells.find(cell => {
            const content = cell.content?.trim();
            return content?.match(/^\d+$/); // Nombre entier uniquement
          });

          // Find price cells (look for currency patterns)
          const priceCell = cells.find(cell => {
            const content = cell.content?.trim();
            return content?.match(/-?\d+[.,]\d+\s*(EUR?|€)?(\s+[A-Z])?/) || // Prix avec EUR ou € ou sans unité
                   content?.match(/-?\d+[.,]\d+/); // Prix numérique simple
          });

          console.log("Row cells found:", {
            description,
            quantity: quantityCell?.content,
            price: priceCell?.content
          });

          // Determine if this is a discount line
          const isDiscount = description.toLowerCase().includes('remise') || 
                           description.toLowerCase().includes('reduction') ||
                           description.toLowerCase().includes('rem ') ||
                           (priceCell?.content && priceCell.content.trim().startsWith('-'));

          if (isDiscount) {
            const amount = Math.abs(extractNumberFromString(priceCell?.content || '0'));
            if (amount > 0) {
              // Find the item this discount applies to
              let itemDescription = description;
              let itemIndex = -1;

              if (description.toLowerCase().startsWith('rem ')) {
                // Pour les remises "Rem X", on cherche l'article X
                itemDescription = description.substring(4).trim();
                itemIndex = items.findIndex(item => 
                  item.description.toLowerCase().includes(itemDescription.toLowerCase())
                );
              } else if (description.toLowerCase().includes('reduction lidl plus')) {
                // Pour les réductions Lidl Plus, on prend l'article précédent
                // Vérifier qu'il y a au moins un article
                if (items.length > 0) {
                  itemIndex = items.length - 1;
                  console.log(`Found previous item for Lidl Plus discount: ${items[itemIndex].description}`);
                } else {
                  console.log('No previous item found for Lidl Plus discount');
                }
              }

              if (itemIndex !== -1 && itemIndex < items.length) {
                // Update the item's discount
                if (!items[itemIndex].discount) {
                  items[itemIndex].discount = 0;
                }
                items[itemIndex].discount += amount;
                items[itemIndex].originalTotal = items[itemIndex].total;
                items[itemIndex].total = items[itemIndex].originalTotal - items[itemIndex].discount;
                console.log(`Applied discount ${amount} to item ${items[itemIndex].description}. New total: ${items[itemIndex].total}`);
              } else {
                console.log(`Could not find item for discount: ${description}`);
              }
            }
          } else {
            const quantity = quantityCell ? parseInt(quantityCell.content) : 1;
            const price = extractNumberFromString(priceCell?.content || '0');

            if (price > 0 && price < 1000) {
              items.push({
                description,
                quantity,
                price,
                total: price * quantity,
                product_category_id: detectItemCategory(description)
              });
              console.log("Added item:", { description, quantity, price, total: price * quantity });
            } else {
              console.log("Skipped item:", { description, price });
            }
          }
        });
      }
    }

    // Find total amount
    const totalKeywords = ['montant du', 'cb', 'a payer', 'total', 'net a payer', 'total ttc', 'total €', 'total eur'];
    
    const totalLines = analyzeResult.pages?.[0]?.lines?.filter((line: any) => {
      const content = line.content?.toLowerCase() || '';
      return totalKeywords.some(keyword => content.includes(keyword)) ||
             content.match(/total.*\d+[.,]\d+/) ||
             content.match(/a\s+payer.*\d+[.,]\d+/);
    }) || [];

    console.log("Total lines found:", totalLines.length);
    
    totalLines.forEach((line: any) => {
      const content = line.content.toLowerCase();
      const amountMatch = line.content.match(/(\d+[.,]\d+)/);
      
      if (amountMatch) {
        const amount = extractNumberFromString(amountMatch[1]);
        
        // Prendre le montant le plus élevé comme total final
        if (amount > total) {
          total = amount;
          console.log("Total amount updated:", total);
        }
      }
    });

    // Si des remises ont été trouvées, mettre à jour le total final
    const totalDiscounts = discounts.reduce((sum, discount) => sum + discount.amount, 0);
    console.log("Total discounts:", totalDiscounts);

    // Detect category based on merchant and items
    const suggestedCategory = CATEGORY_IDS.GROCERIES; // Par défaut pour Intermarché
    console.log("Items found:", items.length);

    // Calculer le total à partir des items
    const calculatedTotal = items.reduce((sum, item) => sum + item.total, 0);
    console.log("Calculated total:", calculatedTotal);

    // Préparer les avertissements
    const warnings: string[] = [];
    
    // Vérifier la différence entre les totaux
    const discrepancy = Math.abs(total - totalDiscounts - calculatedTotal);
    if (discrepancy > 0.1) { // Différence de plus d'un centime
      if (total - totalDiscounts > calculatedTotal) {
        warnings.push(`Il manque potentiellement des articles pour un montant de ${discrepancy.toFixed(2)}€`);
      } else {
        warnings.push(`Le total calculé (${calculatedTotal.toFixed(2)}€) est supérieur au total du ticket (${(total - totalDiscounts).toFixed(2)}€)`);
      }
    }

    // Si aucun total n'a été détecté, utiliser le total calculé
    const finalTotal = total > 0 ? total - totalDiscounts : calculatedTotal;

    return {
      items,
      merchantName,
      merchant_id, // Ajouter l'ID du marchand
      total: finalTotal,
      date: new Date().toISOString(),
      category_id: suggestedCategory,
      status: "processed",
      user_id: "", // This will be set by the caller
      discounts, // Ajouter les remises détectées
      validation: {
        detectedTotal: total,
        calculatedTotal,
        discrepancy,
        warnings
      }
    };
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    if (error instanceof DocumentProcessingError) {
      throw error;
    }
    throw new DocumentAnalysisError("Failed to analyze receipt", error as Error);
  }
}

export async function storeReceipt(receiptData: ReceiptData) {
  try {
    let merchant_id = receiptData.merchant_id;

    // Si on n'a pas d'ID de marchand mais qu'on a un nom, essayer de le trouver
    if (!merchant_id && receiptData.merchantName) {
      merchant_id = findMerchantIdByName(receiptData.merchantName);
    }

    // Si on n'a toujours pas d'ID de marchand connu, on ne crée pas de nouveau marchand
    // car on veut s'assurer d'utiliser uniquement des marchands validés

    // Insérer le reçu
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert([{
        user_id: receiptData.user_id,
        merchant_id, // Utiliser l'ID du marchand s'il est connu
        total: receiptData.total,
        date: receiptData.date,
        category_id: receiptData.category_id,
        image_url: receiptData.image_url,
        status: receiptData.status,
        metadata: receiptData.metadata,
        group_id: receiptData.group_id,
        discount: receiptData.discounts?.reduce((total, d) => total + d.amount, 0) || 0
      }])
      .select()
      .single();

    if (receiptError) throw receiptError;

    // 3. Insérer les articles
    if (receiptData.items && receiptData.items.length > 0) {
      const { error: itemsError } = await supabase
        .from("receipt_items")
        .insert(
          receiptData.items.map(item => ({
            receipt_id: receipt.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            product_category_id: item.product_category_id,
            merchant_id: item.merchant_id,
            discount: item.discount || 0,
            original_total: item.originalTotal || item.total
          }))
        );

      if (itemsError) throw itemsError;
    }

    // 4. Insérer les remises si présentes
    if (receiptData.discounts && receiptData.discounts.length > 0) {
      const { error: discountsError } = await supabase
        .from("receipt_discounts")
        .insert(
          receiptData.discounts.map(discount => ({
            receipt_id: receipt.id,
            description: discount.description,
            amount: discount.amount,
            type: discount.type,
            item_index: discount.itemIndex
          }))
        );

      if (discountsError) throw discountsError;
    }

    return receipt;
  } catch (error) {
    console.error("Error storing receipt:", error);
    throw error;
  }
}

export async function getReceiptsByUser(user_id: string) {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", user_id)
      .order("date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching receipts:", error);
    throw error;
  }
}

export async function editReceiptItem(
  receiptId: string,
  itemId: string,
  updates: Partial<ReceiptItem>
): Promise<ReceiptItem | null> {
  try {
    const { data, error } = await supabase
      .from('receipt_items')
      .update(updates)
      .eq('id', itemId)
      .eq('receipt_id', receiptId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating receipt item:', error);
    return null;
  }
}

export async function deleteReceiptItem(
  receiptId: string,
  itemId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('receipt_items')
      .delete()
      .eq('id', itemId)
      .eq('receipt_id', receiptId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting receipt item:', error);
    return false;
  }
}
