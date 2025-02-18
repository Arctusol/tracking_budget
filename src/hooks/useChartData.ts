import { useMemo } from 'react';
import { Transaction } from '@/types/transaction';
import { CATEGORY_COLORS, CATEGORY_HIERARCHY, CATEGORY_NAMES, getParentCategory } from '@/lib/constants/constants';
import { GranularityType } from '@/components/dashboard/charts/ChartGranularity';
import { CategoryGranularityType } from '@/components/dashboard/charts/CategoryGranularity';

interface TimeDataPoint {
  date: string;
  expenses: number;
  income: number;
  [key: string]: number | string;
}

interface ChartData {
  categoryData: Array<{ name: string; value: number; color: string }>;
  incomeData: Array<{ name: string; value: number; color: string }>;
  timeData: TimeDataPoint[];
  topExpenses: Array<{ name: string; amount: number }>;
  hasIncomeData: boolean;
  hasExpenseData: boolean;
  hasTimeData: boolean;
}

export function useChartData(
  transactions: Transaction[],
  granularity: GranularityType,
  selectedCategory: string | null,
  filters: { category: string },
  categoryGranularity: CategoryGranularityType = 'main'
): ChartData {
  return useMemo(() => {
    // Agréger les transactions par catégorie
    const { expensesByCategory, incomesByCategory } = transactions.reduce(
      (acc, transaction) => {
        if (!transaction.category_id) {
          // Gérer les transactions sans catégorie
          if (transaction.type === 'expense') {
            acc.expensesByCategory['Non catégorisé'] = (acc.expensesByCategory['Non catégorisé'] || 0) + transaction.amount;
          } else {
            acc.incomesByCategory['Non catégorisé'] = (acc.incomesByCategory['Non catégorisé'] || 0) + transaction.amount;
          }
          return acc;
        }

        let categoryId = transaction.category_id;
        let categoryName: string;

        // Appliquer la logique de granularité pour les catégories
        if (filters.category === 'all') {
          // Si on est sur "Toutes les catégories"
          if (categoryGranularity === 'main') {
            // Montrer uniquement les catégories principales
            categoryId = getParentCategory(transaction.category_id) || transaction.category_id;
          }
          // Si categoryGranularity est 'all', on garde la catégorie d'origine
        } else {
          // Si une catégorie spécifique est sélectionnée
          const parentCategory = getParentCategory(transaction.category_id);
          if (parentCategory === filters.category) {
            // Si c'est une sous-catégorie de la catégorie sélectionnée
            categoryId = categoryGranularity === 'main' ? parentCategory : transaction.category_id;
          } else if (transaction.category_id === filters.category) {
            // Si c'est la catégorie principale elle-même
            categoryId = filters.category;
          }
        }

        categoryName = CATEGORY_NAMES[categoryId] || 'Autre';

        if (transaction.type === 'expense') {
          acc.expensesByCategory[categoryName] = (acc.expensesByCategory[categoryName] || 0) + transaction.amount;
        } else {
          acc.incomesByCategory[categoryName] = (acc.incomesByCategory[categoryName] || 0) + transaction.amount;
        }

        return acc;
      },
      { expensesByCategory: {}, incomesByCategory: {} } as Record<string, Record<string, number>>
    );

    // Formater les données pour les graphiques en camembert
    const categoryData = Object.entries(expensesByCategory)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Autre'],
      }))
      .sort((a, b) => b.value - a.value);

    const incomeData = Object.entries(incomesByCategory)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Autre'],
      }))
      .sort((a, b) => b.value - a.value);

    // Formater les données temporelles
    const timeData = transactions.reduce((acc: TimeDataPoint[], transaction) => {
      let dateKey: string;
      const date = new Date(transaction.date);
      
      // Appliquer la granularité temporelle
      switch (granularity) {
        case "day":
          dateKey = date.toISOString().split('T')[0];
          break;
        case "week":
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          dateKey = startOfWeek.toISOString().split('T')[0];
          break;
        case "month":
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case "year":
          dateKey = `${date.getFullYear()}`;
          break;
        default:
          dateKey = date.toISOString().split('T')[0];
      }

      const existingPoint = acc.find(point => point.date === dateKey);
      
      if (!existingPoint) {
        const newPoint: TimeDataPoint = {
          date: dateKey,
          expenses: 0,
          income: 0
        };

        if (filters.category !== 'all') {
          newPoint[`total_${filters.category}`] = 0;
          const subCategories = CATEGORY_HIERARCHY[filters.category];
          if (subCategories) {
            subCategories.forEach(subCat => {
              newPoint[subCat] = 0;
            });
          }
        }

        acc.push(newPoint);
      }

      const point = acc.find(point => point.date === dateKey)!;

      if (transaction.type === "expense") {
        point.expenses += transaction.amount;
        
        if (filters.category !== 'all') {
          if (transaction.category_id === filters.category ||
              getParentCategory(transaction.category_id) === filters.category ||
              CATEGORY_HIERARCHY[filters.category]?.includes(transaction.category_id)) {
            point[`total_${filters.category}`] = (point[`total_${filters.category}`] as number || 0) + transaction.amount;
          }
          
          if (CATEGORY_HIERARCHY[filters.category]?.includes(transaction.category_id)) {
            point[transaction.category_id] = (point[transaction.category_id] as number || 0) + transaction.amount;
          }
        }
      } else {
        point.income += transaction.amount;
      }

      return acc;
    }, []).sort((a, b) => a.date.localeCompare(b.date));

    // Préparer les top dépenses
    const topExpenses = transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({
        name: t.description,
        amount: t.amount
      }));

    const hasIncomeData = Object.keys(incomesByCategory).length > 0;
    const hasExpenseData = Object.keys(expensesByCategory).length > 0;
    const hasTimeData = timeData.some(data => 
      (data.income > 0 && filters.category === "all") || 
      (data.expenses > 0 && filters.category === "all") ||
      (data.income > 0 && filters.category !== "all") ||
      (data.expenses > 0 && filters.category !== "all")
    );

    return {
      categoryData,
      incomeData,
      timeData,
      topExpenses,
      hasIncomeData,
      hasExpenseData,
      hasTimeData
    };
  }, [transactions, granularity, selectedCategory, filters.category, categoryGranularity]);
}
