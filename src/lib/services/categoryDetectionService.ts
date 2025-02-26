import { ProcessedTransaction } from "../fileProcessing/types";
import { detectCategory } from "../fileProcessing/categoryDetection";
import { categorizeTransaction, getCategoryConfidence } from "../categorization";
import { transactionMatcher } from "./transactionMatcher";
import { CATEGORY_IDS } from "../constants/constants";

export type DetectionSource = 'historical' | 'rules' | 'keywords' | 'amount';

export interface CategoryDetectionResult {
  categoryId: string;
  confidence: number;
  source: DetectionSource;
}

export async function detectTransactionCategory(
  transaction: ProcessedTransaction
): Promise<CategoryDetectionResult> {
  console.log("[CategoryDetection] Processing transaction:", transaction);

  try {
    // 1. Try historical matching first
    console.log("[CategoryDetection] Attempting historical match");
    const historicalMatch = await transactionMatcher.findMatch(transaction.description);
    
    if (historicalMatch) {
      console.log("[CategoryDetection] Found historical match:", historicalMatch);
      return historicalMatch;
    }
    console.log("[CategoryDetection] No historical match found");

    // 2. Try rule-based detection
    console.log("[CategoryDetection] Attempting rule-based detection");
    const ruleBasedCategory = await detectCategory(transaction.description, transaction.amount);
    if (ruleBasedCategory) {
      console.log("[CategoryDetection] Found rule-based match:", ruleBasedCategory);
      return {
        categoryId: ruleBasedCategory,
        confidence: 0.8,
        source: 'rules'
      };
    }
    console.log("[CategoryDetection] No rule-based match found");

    // 3. Try keyword-based detection
    console.log("[CategoryDetection] Attempting keyword-based detection");
    const keywordBasedCategory = categorizeTransaction(transaction);
    const confidence = getCategoryConfidence(transaction);
    
    if (keywordBasedCategory !== 'other') {
      console.log("[CategoryDetection] Found keyword match:", keywordBasedCategory, "with confidence:", confidence);
      return {
        categoryId: keywordBasedCategory,
        confidence,
        source: 'keywords'
      };
    }
    console.log("[CategoryDetection] No keyword match found");

    // 4. Fallback to amount-based detection
    console.log("[CategoryDetection] Falling back to amount-based detection");
    if (transaction.amount > 0) {
      if (transaction.amount > 1000) {
        return {
          categoryId: CATEGORY_IDS.SALARY,
          confidence: 0.5,
          source: 'amount'
        };
      }
    } else {
      const amount = Math.abs(transaction.amount);
      if (amount < 30) {
        return {
          categoryId: CATEGORY_IDS.GROCERIES,
          confidence: 0.3,
          source: 'amount'
        };
      }
      if (amount > 500) {
        return {
          categoryId: CATEGORY_IDS.HOUSING,
          confidence: 0.4,
          source: 'amount'
        };
      }
    }

    // If all else fails, return 'other' with low confidence
    console.log("[CategoryDetection] No matches found, using default category");
    return {
      categoryId: CATEGORY_IDS.OTHER,
      confidence: 0.1,
      source: 'amount'
    };
  } catch (error) {
    console.error("[CategoryDetection] Error during category detection:", error);
    // Return a safe default in case of error
    return {
      categoryId: CATEGORY_IDS.OTHER,
      confidence: 0.1,
      source: 'amount'
    };
  }
}
