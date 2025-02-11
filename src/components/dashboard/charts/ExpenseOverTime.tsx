import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GranularityType } from "./ChartGranularity";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORY_HIERARCHY, getCategoryName, getParentCategory, CATEGORY_NAMES, CATEGORY_COLORS } from "@/lib/fileProcessing/constants";
import { useState, useEffect } from "react";
import { Transaction } from "@/types/transaction";

interface TimeDataPoint {
  date: string;
  expenses: number;
  income: number;
  [key: string]: number | string;
}

interface ExpenseOverTimeProps {
  data: TimeDataPoint[];
  transactions: Transaction[];
  title: string;
  granularity: GranularityType;
  showIncome?: boolean;
  showExpenses?: boolean;
  selectedCategory?: string;
  categoryGranularity?: string;
}

export function ExpenseOverTime({ 
  data,
  transactions,
  title,
  granularity,
  selectedCategory,
  categoryGranularity
}: ExpenseOverTimeProps) {
  const [visibleSubcategories, setVisibleSubcategories] = useState<string[]>([]);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showIncome, setShowIncome] = useState(true);
  const [showCategoryTotal, setShowCategoryTotal] = useState(true);

  // Reset visible subcategories when main category changes
  useEffect(() => {
    setVisibleSubcategories([]);
    setShowCategoryTotal(true);
  }, [selectedCategory]);

  const prepareData = () => {
    console.log('ExpenseOverTime prepareData:', {
      selectedCategory,
      dataPoints: data.length,
      transactions: transactions.length,
      visibleSubcategories,
      sampleTransaction: transactions[0]
    });

    if (!selectedCategory || selectedCategory === 'all') {
      return data;
    }

    // Get parent category if selected category is a subcategory
    const parentCategory = getParentCategory(selectedCategory);
    const effectiveCategory = parentCategory || selectedCategory;
    const isSubcategorySelected = parentCategory !== null;

    console.log('Category info:', {
      selectedCategory,
      parentCategory,
      effectiveCategory,
      isSubcategorySelected
    });

    const enrichedData = data.map(point => {
      const pointDate = point.date;
      const newPoint = { ...point };
      
      // 1. Keep total expenses
      newPoint.expenses = point.expenses;

      // 2. Get transactions for this date
      const dateTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        let formattedTransactionDate: string;
        
        switch (granularity) {
          case 'day':
            formattedTransactionDate = transactionDate.toISOString().split('T')[0];
            break;
          case 'week': {
            // Get the first day of the week (Monday)
            const firstDayOfWeek = new Date(transactionDate);
            firstDayOfWeek.setHours(0, 0, 0, 0);
            const day = firstDayOfWeek.getDay();
            const diff = firstDayOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            firstDayOfWeek.setDate(diff);
            // Format as YYYY-MM-DD
            formattedTransactionDate = firstDayOfWeek.toISOString().split('T')[0];
            break;
          }
          case 'month':
            formattedTransactionDate = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            formattedTransactionDate = `${transactionDate.getFullYear()}`;
            break;
          default:
            formattedTransactionDate = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        }
        
        // Log a few transactions for debugging
        if (transactions.indexOf(t) < 3) {
          console.log('Transaction date comparison:', {
            pointDate,
            transactionDate: t.date,
            formattedTransactionDate,
            granularity,
            matches: formattedTransactionDate === pointDate
          });
        }
        
        return formattedTransactionDate === pointDate && t.type === "expense";
      });

      console.log(`Processing date ${pointDate}:`, {
        totalTransactions: dateTransactions.length,
        expenses: point.expenses,
        sampleTransaction: dateTransactions[0]
      });

      // 3. Calculate category total (includes subcategories)
      const categoryTransactions = dateTransactions.filter(t => {
        if (isSubcategorySelected) {
          // If a subcategory is selected, only show transactions from that subcategory
          return t.category_id === selectedCategory;
        } else {
          // If a main category is selected, show all transactions from it and its subcategories
          return t.category_id === effectiveCategory || 
                 CATEGORY_HIERARCHY[effectiveCategory]?.includes(t.category_id);
        }
      });

      const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      newPoint[`total_${effectiveCategory}`] = categoryTotal;

      console.log(`Category total for ${effectiveCategory}:`, {
        date: pointDate,
        total: categoryTotal,
        transactionCount: categoryTransactions.length,
        isSubcategorySelected,
        categoryTransactions: categoryTransactions.slice(0, 2) // Log first 2 transactions
      });

      // 4. Calculate subcategory totals (only if main category is selected)
      if (!isSubcategorySelected) {
        const subcategories = CATEGORY_HIERARCHY[effectiveCategory] || [];
        subcategories.forEach(subCat => {
          const subCatTransactions = dateTransactions.filter(t => t.category_id === subCat);
          const subCatTotal = subCatTransactions.reduce((sum, t) => sum + t.amount, 0);
          
          newPoint[subCat] = subCatTotal;

          if (subCatTotal > 0 || subCatTransactions.length > 0) {
            console.log(`Subcategory ${subCat} total:`, {
              date: pointDate,
              total: subCatTotal,
              transactions: subCatTransactions.slice(0, 2) // Log first 2 transactions
            });
          }
        });
      }
      
      return newPoint;
    });

    console.log('Enriched data sample:', enrichedData[0]);
    return enrichedData;
  };

  const preparedData = prepareData();
  const subcategories = selectedCategory && !getParentCategory(selectedCategory) ? 
    (CATEGORY_HIERARCHY[selectedCategory] || []) : 
    [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (granularity) {
      case "day":
        return new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
        }).format(date);
      case "week":
        return `Sem. ${new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
        }).format(date)}`;
      case "month":
        return new Intl.DateTimeFormat("fr-FR", {
          month: "short",
          year: "2-digit",
        }).format(date);
      case "year":
        return new Intl.DateTimeFormat("fr-FR", {
          year: "numeric",
        }).format(date);
      default:
        return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {selectedCategory && subcategories.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {/* Total income toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-income"
                checked={showIncome}
                onCheckedChange={(checked) => setShowIncome(checked as boolean)}
              />
              <label
                htmlFor="show-income"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Revenus totaux
              </label>
            </div>

            {/* Total expenses toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-expenses"
                checked={showExpenses}
                onCheckedChange={(checked) => setShowExpenses(checked as boolean)}
              />
              <label
                htmlFor="show-expenses"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Dépenses totales
              </label>
            </div>

            {/* Subcategories toggles */}
            {subcategories.map((subCat) => (
              <div key={subCat} className="flex items-center space-x-2">
                <Checkbox
                  id={subCat}
                  checked={visibleSubcategories.includes(subCat)}
                  onCheckedChange={(checked) => {
                    setVisibleSubcategories(prev => 
                      checked 
                        ? [...prev, subCat]
                        : prev.filter(sc => sc !== subCat)
                    );
                  }}
                />
                <label htmlFor={subCat} className="text-sm">
                  {getCategoryName(subCat)}
                </label>
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={preparedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(value)
              }
              labelFormatter={formatDate}
            />
            <Legend />
            {/* Ligne des revenus */}
            {showIncome && (
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                name="Revenus"
                dot={false}
              />
            )}

            {/* Ligne des dépenses totales */}
            {showExpenses && (
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                name="Dépenses totales"
                dot={false}
              />
            )}

            {/* Lignes des sous-catégories */}
            {visibleSubcategories.map((subCat) => (
              <Line
                key={subCat}
                type="monotone"
                dataKey={subCat}
                stroke={CATEGORY_COLORS[CATEGORY_NAMES[subCat]]}
                name={getCategoryName(subCat)}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
