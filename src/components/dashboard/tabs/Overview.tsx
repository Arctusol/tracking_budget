import { Transaction } from "@/types/transaction";
import { ExpenseByCategory } from "../charts/ExpenseByCategory";
import { IncomeByCategory } from "../charts/IncomeByCategory";
import { ExpenseOverTime } from "../charts/ExpenseOverTime";
import { TopExpenses } from "../charts/TopExpenses";
import { CATEGORY_COLORS, CATEGORY_NAMES, CATEGORY_HIERARCHY, getParentCategory } from "@/lib/fileProcessing/constants";
import { CategoryGranularity, CategoryGranularityType } from "../charts/CategoryGranularity";
import { ChartGranularity, GranularityType } from "../charts/ChartGranularity";
import { StatsCards } from "../stats/StatsCards";
import { Stat } from "@/types/stats";

interface TimeDataPoint {
  date: string;
  expenses: number;
  income: number;
  [key: string]: number | string;
}

interface OverviewProps {
  filteredTransactions: Transaction[];
  expensesByCategory: Record<string, number>;
  incomesByCategory: Record<string, number>;
  categoryGranularity: CategoryGranularityType;
  granularity: GranularityType;
  handleGranularityChange: (value: GranularityType) => void;
  handleChartClick: (categoryName: string) => void;
  handleCategoryGranularityChange: (value: CategoryGranularityType) => void;
  filters: { category: string };
  stats: {
    balance: number;
    monthlyExpenses: number;
    transfersAmandine: number;
    transfersAntonin: number;
  };
}

export function Overview({
  filteredTransactions,
  expensesByCategory,
  incomesByCategory,
  categoryGranularity,
  granularity,
  handleGranularityChange,
  handleChartClick,
  handleCategoryGranularityChange,
  filters,
  stats
}: OverviewProps) {
  // Préparation des stats pour les cartes
  const statsDisplay: Stat[] = [
    {
      name: "Solde Global",
      value: stats.balance.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: stats.balance >= 0 ? "up" : "down",
    },
    {
      name: "Dépenses Totales",
      value: stats.monthlyExpenses.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "down",
    },
    {
      name: "Virements Amandine",
      value: stats.transfersAmandine.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "neutral",
    },
    {
      name: "Virements Antonin",
      value: stats.transfersAntonin.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "neutral",
    },
  ];

  // Formatage des données pour les graphiques en camembert
  const categoryData = Object.entries(expensesByCategory).map(
    ([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Autre'],
    })
  );

  const incomeData = Object.entries(incomesByCategory).map(
    ([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Autre'],
    })
  );

  // Formatage des données pour le graphique d'évolution temporelle
  const timeData: TimeDataPoint[] = filteredTransactions.reduce((acc: TimeDataPoint[], transaction) => {
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

      // Initialiser les sous-catégories si une catégorie est sélectionnée
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
      
      // Ajouter aux totaux des catégories si pertinent
      if (filters.category !== 'all') {
        if (transaction.category_id === filters.category ||
            getParentCategory(transaction.category_id) === filters.category ||
            CATEGORY_HIERARCHY[filters.category]?.includes(transaction.category_id)) {
          point[`total_${filters.category}`] = (point[`total_${filters.category}`] as number || 0) + transaction.amount;
        }
        
        // Ajouter aux sous-catégories
        if (CATEGORY_HIERARCHY[filters.category]?.includes(transaction.category_id)) {
          point[transaction.category_id] = (point[transaction.category_id] as number || 0) + transaction.amount;
        }
      }
    } else {
      point.income += transaction.amount;
    }

    return acc;
  }, []).sort((a, b) => a.date.localeCompare(b.date));

  // Formatage des données pour le top des dépenses
  const topExpensesData = filteredTransactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(t => ({
      name: t.description,
      amount: t.amount
    }));

  // Vérifications pour l'affichage conditionnel
  const hasIncomeData = Object.keys(incomesByCategory).length > 0;
  const hasExpenseData = Object.keys(expensesByCategory).length > 0;
  const hasTimeData = timeData.some(data => 
    (data.income > 0 && filters.category === "all") || 
    (data.expenses > 0 && filters.category === "all") ||
    (data.income > 0 && filters.category !== "all") ||
    (data.expenses > 0 && filters.category !== "all")
  );

  return (
    <div className="w-full space-y-4">
      <StatsCards stats={statsDisplay} />

      <div className="flex justify-end gap-4 mb-4">
        <CategoryGranularity 
          value={categoryGranularity} 
          onChange={handleCategoryGranularityChange}
          selectedFilter={filters.category}
        />
        <ChartGranularity value={granularity} onChange={handleGranularityChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {hasExpenseData && (
          <>
            <div className="lg:col-span-1">
              <ExpenseByCategory
                data={categoryData}
                title={`Dépenses par catégorie ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
                onChartClick={handleChartClick}
              />
            </div>
            <div className="lg:col-span-1">
              <TopExpenses 
                data={topExpensesData}
                title={`Top 5 des dépenses ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
                onItemClick={handleChartClick}
              />
            </div>
          </>
        )}
        {hasIncomeData && (
          <div className="lg:col-span-1">
            <IncomeByCategory
              data={incomeData}
              title={`Revenus par catégorie ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
              onChartClick={handleChartClick}
            />
          </div>
        )}
      </div>

      {hasTimeData && (
        <div className="w-full">
          <ExpenseOverTime
            data={timeData}
            transactions={filteredTransactions}
            title={`Évolution des ${hasExpenseData ? 'dépenses' : ''} ${hasExpenseData && hasIncomeData ? 'et' : ''} ${hasIncomeData ? 'revenus' : ''} ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
            granularity={granularity}
            showIncome={hasIncomeData}
            showExpenses={hasExpenseData}
            selectedCategory={filters.category}
            categoryGranularity={categoryGranularity}
          />
        </div>
      )}
    </div>
  );
}
