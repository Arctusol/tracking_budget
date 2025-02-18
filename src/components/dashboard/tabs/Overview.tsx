import { Transaction } from "@/types/transaction";
import { ExpenseByCategory } from "../charts/ExpenseByCategory";
import { IncomeByCategory } from "../charts/IncomeByCategory";
import { ExpenseOverTime } from "../charts/ExpenseOverTime";
import { TopExpenses } from "../charts/TopExpenses";
import { CATEGORY_NAMES } from "@/lib/fileProcessing/constants";
import { CategoryGranularity, CategoryGranularityType } from "../charts/CategoryGranularity";
import { ChartGranularity, GranularityType } from "../charts/ChartGranularity";
import { StatsDisplay } from "../stats/StatsDisplay";
import { Stat } from "@/types/stats";

interface TimeDataPoint {
  date: string;
  expenses: number;
  income: number;
  [key: string]: number | string;
}

interface OverviewProps {
  filteredTransactions: Transaction[];
  expensesByCategory: Array<{ name: string; value: number; color: string }>;
  incomesByCategory: Array<{ name: string; value: number; color: string }>;
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
    incomes: number;
  };
  timeData: TimeDataPoint[];
  topExpenses: Array<{ name: string; amount: number }>;
  hasIncomeData: boolean;
  hasExpenseData: boolean;
  hasTimeData: boolean;
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
  stats,
  timeData,
  topExpenses,
  hasIncomeData,
  hasExpenseData,
  hasTimeData
}: OverviewProps) {
  return (
    <div className="w-full gap-4 space-y-4 ">
      <StatsDisplay stats={stats} />

      <div className="flex justify-end gap-4 mb-4">
        <CategoryGranularity 
          value={categoryGranularity} 
          onChange={handleCategoryGranularityChange}
          selectedFilter={filters.category}
        />
        <ChartGranularity value={granularity} onChange={handleGranularityChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {hasExpenseData && (
          <>
            <div className="lg:col-span-2">
              <ExpenseByCategory
                data={expensesByCategory}
                title={`Dépenses par catégorie ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
                onChartClick={handleChartClick}
              />
            </div>
          </>
        )}
        {hasIncomeData && (
          <div className="lg:col-span-2">
            <IncomeByCategory
              data={incomesByCategory}
              title={`Revenus par catégorie ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
              onChartClick={handleChartClick}
            />
          </div>
        )}
        {hasExpenseData && (
          <>
            <div className="lg:col-span-4">
              <TopExpenses
                data={topExpenses}
                title={`Top 5 des dépenses ${filters.category !== 'all' ? `- ${CATEGORY_NAMES[filters.category]}` : ''}`}
                onItemClick={handleChartClick}
              />
            </div>
          </>
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
