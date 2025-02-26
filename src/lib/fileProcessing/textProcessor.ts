import { v4 as uuidv4 } from 'uuid';
import { ProcessedTransaction } from "./types";
import { TransactionType } from "../../types/transaction";
import { detectCategory } from "./categoryDetection";
import { extractMerchantFromDescription } from "./merchantExtraction";

export async function processText(text: string): Promise<ProcessedTransaction[]> {
  const transactions: ProcessedTransaction[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.trim()) {
      const [date, description, amountStr] = line.split(',').map(s => s.trim());
      const amount = parseFloat(amountStr);
      const merchant = extractMerchantFromDescription(description);
      
      const category_id = await detectCategory(description, amount);
      
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
