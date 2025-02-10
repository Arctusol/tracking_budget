import { v4 as uuidv4 } from 'uuid';
import { ProcessedTransaction } from "./types";
import { TransactionType } from "../../types/transaction";
import { detectCategory } from "./categoryDetection";
import { extractMerchantFromDescription } from "./merchantExtraction";

export async function processText(text: string): Promise<ProcessedTransaction[]> {
  const lines = text.split('\n');
  const transactions: ProcessedTransaction[] = [];
  
  for (const line of lines) {
    // Extract date, amount, and description using regex
    const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/);
    const amountMatch = line.match(/(\d+[.,]\d{2})/);
    
    if (dateMatch && amountMatch) {
      const date = dateMatch[1];
      const amount = parseFloat(amountMatch[1].replace(',', '.'));
      const description = line
        .replace(dateMatch[1], '')
        .replace(amountMatch[1], '')
        .trim();
      
      const merchant = extractMerchantFromDescription(description);
      const category_id = detectCategory(description, amount);
      
      transactions.push({
        id: uuidv4(),
        date,
        amount,
        description,
        type: amount >= 0 ? 'income' : 'expense',
        merchant,
        category_id
      });
    }
  }
  
  return transactions;
}
