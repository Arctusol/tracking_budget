import { supabase } from "../supabase";

interface MatchResult {
  categoryId: string;
  confidence: number;
  source: 'historical' | 'rules' | 'keywords' | 'amount';
}

class TransactionMatcher {
  private static instance: TransactionMatcher;

  private constructor() {
    console.log("[TransactionMatcher] Instance created");
  }

  public static getInstance(): TransactionMatcher {
    if (!TransactionMatcher.instance) {
      TransactionMatcher.instance = new TransactionMatcher();
    }
    return TransactionMatcher.instance;
  }

  private extractMerchantName(description: string): string | null {
    // Pattern pour les transactions par carte
    const cardPattern = /CARTE \d{2}\/\d{2}\/\d{2}\s+(.*?)\s*CB\*\d{4}/;
    // Pattern pour les virements SEPA
    const virPattern = /VIR SEPA\s+(.*?)(?:\s*$|\s+(?:REF|MOTIF))/;
    // Pattern pour les prélèvements SEPA
    const prlvPattern = /PRLV SEPA\s+(.*?)(?:\s*$|\s+(?:REF|MOTIF))/;

    let match = description.match(cardPattern);
    if (match) {
      console.log("[TransactionMatcher] Extracted merchant from card transaction:", match[1].trim());
      return match[1].trim();
    }

    match = description.match(virPattern);
    if (match) {
      console.log("[TransactionMatcher] Extracted merchant from SEPA transfer:", match[1].trim());
      return match[1].trim();
    }

    match = description.match(prlvPattern);
    if (match) {
      console.log("[TransactionMatcher] Extracted merchant from SEPA direct debit:", match[1].trim());
      return match[1].trim();
    }

    console.log("[TransactionMatcher] No merchant pattern matched, using full description");
    return description;
  }

  public async findMatch(description: string): Promise<MatchResult | null> {
    console.log("[TransactionMatcher] Finding match for:", description);
    
    try {
      const merchantName = this.extractMerchantName(description);
      if (!merchantName) {
        console.log("[TransactionMatcher] Could not extract merchant name");
        return null;
      }

      console.log("[TransactionMatcher] Searching for merchant:", merchantName);
      const { data: matches, error } = await supabase
        .rpc('find_exact_transaction_match', { 
          description_param: merchantName 
        });

      if (error) {
        console.error("[TransactionMatcher] Database error:", error);
        return null;
      }

      if (matches && matches.length > 0) {
        console.log("[TransactionMatcher] Found match:", matches[0]);
        return {
          categoryId: matches[0].category_id,
          confidence: 1.0,
          source: 'historical'
        };
      }

      console.log("[TransactionMatcher] No match found");
      return null;
    } catch (error) {
      console.error("[TransactionMatcher] Error finding match:", error);
      return null;
    }
  }
}

export const transactionMatcher = TransactionMatcher.getInstance();
