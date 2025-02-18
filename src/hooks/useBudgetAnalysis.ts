import { format, parseISO, subMonths } from "date-fns";
import { useEffect, useState } from "react";
import { BudgetAnalysis, MonthlyBudget, CategoryBudget, BudgetEstimate } from "@/types/budget";
import { Transaction } from "@/types/transaction";
import { CATEGORY_HIERARCHY, CATEGORY_IDS, getParentCategory } from "@/lib/constants/constants";

export const useBudgetAnalysis = (transactions: Transaction[]) => {
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis>({
    averageByCategory: {},
    threeMonthAverageByCategory: {},
    trendByCategory: {},
    seasonalFactors: {}
  });
  const [currentBudget, setCurrentBudget] = useState<MonthlyBudget | null>(null);

  // Fonction utilitaire pour filtrer les transactions
  const filterTransactions = (transaction: Transaction) => {
    // Vérifier si c'est une dépense
    if (transaction.type !== 'expense') return false;
    
    // Obtenir la catégorie parente
    const parentCategory = getParentCategory(transaction.category_id);
    const categoryId = parentCategory || transaction.category_id;
    
    // Exclure les transactions des catégories Virements et Revenus
    return categoryId !== CATEGORY_IDS.INCOME && 
           categoryId !== CATEGORY_IDS.TRANSFERS;
  };

  const calculateAverages = (transactions: Transaction[]) => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const sixMonthsAgo = format(subMonths(new Date(), 6), 'yyyy-MM');
    
    // Filtrer les transactions des 6 derniers mois et appliquer les filtres de catégorie
    const historicalTransactions = transactions.filter(t => {
      const transactionMonth = format(parseISO(t.date), 'yyyy-MM');
      return filterTransactions(t) && transactionMonth < currentMonth && transactionMonth >= sixMonthsAgo;
    });

    // 2. Grouper par catégorie et calculer les totaux mensuels
    const monthlyTotals: { [key: string]: { [month: string]: number } } = {};
    
    historicalTransactions.forEach(transaction => {
      const month = format(parseISO(transaction.date), 'yyyy-MM');
      if (!monthlyTotals[transaction.category_id]) {
        monthlyTotals[transaction.category_id] = {};
      }
      if (!monthlyTotals[transaction.category_id][month]) {
        monthlyTotals[transaction.category_id][month] = 0;
      }
      monthlyTotals[transaction.category_id][month] += transaction.amount;
    });

    // 3. Calculer les moyennes mensuelles
    const averages: { [key: string]: number } = {};
    
    Object.entries(monthlyTotals).forEach(([categoryId, months]) => {
      const totalAmount = Object.values(months).reduce((sum, amount) => sum + amount, 0);
      const monthCount = Object.keys(months).length;
      averages[categoryId] = totalAmount / monthCount;
    });

    return averages;
  };

  const calculateThreeMonthAverage = (transactions: Transaction[]) => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const threeMonthsAgo = format(subMonths(new Date(), 3), 'yyyy-MM');
    
    // Filtrer les transactions des 3 derniers mois
    const recentTransactions = transactions.filter(t => {
      const transactionMonth = format(parseISO(t.date), 'yyyy-MM');
      return filterTransactions(t) && transactionMonth < currentMonth && transactionMonth >= threeMonthsAgo;
    });

    // Grouper par catégorie et calculer les moyennes
    const monthlyTotals: { [key: string]: { [month: string]: number } } = {};

    recentTransactions.forEach(transaction => {
      const month = format(parseISO(transaction.date), 'yyyy-MM');
      if (!monthlyTotals[transaction.category_id]) {
        monthlyTotals[transaction.category_id] = {};
      }
      if (!monthlyTotals[transaction.category_id][month]) {
        monthlyTotals[transaction.category_id][month] = 0;
      }
      monthlyTotals[transaction.category_id][month] += transaction.amount;
    });

    const averages: { [key: string]: number } = {};
    Object.entries(monthlyTotals).forEach(([categoryId, months]) => {
      const totalAmount = Object.values(months).reduce((sum, amount) => sum + amount, 0);
      const monthCount = Object.keys(months).length;
      averages[categoryId] = totalAmount / monthCount;
    });

    return averages;
  };

  const calculateTrends = (transactions: Transaction[]) => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const threeMonthsAgo = format(subMonths(new Date(), 3), 'yyyy-MM');
    const sixMonthsAgo = format(subMonths(new Date(), 6), 'yyyy-MM');

    // 1. Séparer en deux périodes de 3 mois et appliquer les filtres de catégorie
    const recentMonths = transactions.filter(t => {
      const month = format(parseISO(t.date), 'yyyy-MM');
      return filterTransactions(t) && month < currentMonth && month >= threeMonthsAgo;
    });

    const previousMonths = transactions.filter(t => {
      const month = format(parseISO(t.date), 'yyyy-MM');
      return filterTransactions(t) && month < threeMonthsAgo && month >= sixMonthsAgo;
    });

    // 2. Calculer les moyennes pour chaque période
    const calculatePeriodTotal = (transactions: Transaction[]) => {
      const totals: { [key: string]: number } = {};
      transactions.forEach(t => {
        totals[t.category_id] = (totals[t.category_id] || 0) + t.amount;
      });
      return totals;
    };

    const recentTotals = calculatePeriodTotal(recentMonths);
    const previousTotals = calculatePeriodTotal(previousMonths);

    // 3. Calculer les tendances
    const trends: { [key: string]: number } = {};
    
    Object.keys({ ...recentTotals, ...previousTotals }).forEach(categoryId => {
      const recent = recentTotals[categoryId] || 0;
      const previous = previousTotals[categoryId] || 0;
      
      if (previous > 0) {
        trends[categoryId] = ((recent - previous) / previous) * 100;
      } else if (recent > 0) {
        trends[categoryId] = 100; // Nouvelle catégorie
      } else {
        trends[categoryId] = 0;
      }
    });

    return trends;
  };

  const calculatePreviousMonth = (transactions: Transaction[]) => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
    
    // Filtrer les transactions du mois précédent et appliquer les filtres de catégorie
    const lastMonthTransactions = transactions.filter(t => {
      const transactionMonth = format(parseISO(t.date), 'yyyy-MM');
      return filterTransactions(t) && transactionMonth === lastMonth;
    });

    // Calculer les totaux par catégorie
    const previousMonthTotals: { [key: string]: number } = {};
    lastMonthTransactions.forEach(transaction => {
      previousMonthTotals[transaction.category_id] = (previousMonthTotals[transaction.category_id] || 0) + transaction.amount;
    });

    return previousMonthTotals;
  };

  useEffect(() => {
    if (!transactions.length) return;

    const averages = calculateAverages(transactions);
    const threeMonthAverages = calculateThreeMonthAverage(transactions);
    const trends = calculateTrends(transactions);
    const previousMonthTotals = calculatePreviousMonth(transactions);

    setBudgetAnalysis({
      averageByCategory: averages,
      threeMonthAverageByCategory: threeMonthAverages,
      trendByCategory: trends,
      seasonalFactors: {}
    });

    // Mise à jour du budget actuel
    const nextMonth = format(subMonths(new Date(), -1), 'yyyy-MM');
    const categories: { [key: string]: CategoryBudget } = {};
    let totalEstimated = 0;

    Object.entries(CATEGORY_HIERARCHY).forEach(([mainCategory, subCategories]) => {
      const subCategoriesData: { [key: string]: BudgetEstimate } = {};
      let categoryTotal = 0;

      subCategories.forEach(categoryId => {
        const average6Months = averages[categoryId] || 0;
        const average3Months = threeMonthAverages[categoryId] || 0;
        const previousMonth = previousMonthTotals[categoryId] || 0;
        const trend = trends[categoryId] || 0;

        const estimate: BudgetEstimate = {
          categoryId,
          average6Months: Math.round(average6Months * 100) / 100,
          average3Months: Math.round(average3Months * 100) / 100,
          trend: Math.round(trend * 10) / 10,
          trend3Months: Math.round(((previousMonth - average3Months) / average3Months) * 100 * 10) / 10,
          estimatedAmount: Math.round(previousMonth * 100) / 100,
          previousMonth: Math.round(previousMonth * 100) / 100
        };

        subCategoriesData[categoryId] = estimate;
        categoryTotal += estimate.estimatedAmount;
      });

      categories[mainCategory] = {
        mainCategory,
        subCategories: subCategoriesData,
        totalEstimated: Math.round(categoryTotal * 100) / 100
      };

      totalEstimated += categoryTotal;
    });

    setCurrentBudget({
      month: nextMonth,
      categories,
      totalEstimated: Math.round(totalEstimated * 100) / 100
    });

  }, [transactions]);

  return { 
    budgetAnalysis, 
    currentBudget,
    setCurrentBudget
  };
};
