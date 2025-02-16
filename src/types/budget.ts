import { Transaction } from "./transaction";

export interface BudgetEstimate {
  categoryId: string;
  average6Months: number;
  average3Months: number;  // Ajout de la moyenne sur 3 mois
  trend: number; // pourcentage de variation sur 6 mois
  trend3Months: number; // pourcentage de variation sur 3 mois
  estimatedAmount: number;
  adjustedAmount?: number;
  previousMonth: number;
}

export interface CategoryBudget {
  mainCategory: string;
  subCategories: {
    [key: string]: BudgetEstimate;
  };
  totalEstimated: number;
  totalAdjusted?: number;
}

export interface MonthlyBudget {
  month: string; // format YYYY-MM
  categories: {
    [key: string]: CategoryBudget;
  };
  totalEstimated: number;
  totalAdjusted?: number;
}

export interface BudgetAnalysis {
  averageByCategory: { [key: string]: number };
  threeMonthAverageByCategory: { [key: string]: number };
  trendByCategory: { [key: string]: number };
  seasonalFactors: { [key: string]: { [month: string]: number } };
}
