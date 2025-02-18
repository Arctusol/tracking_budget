import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { MonthlyBudget } from "@/types/budget";
import { CATEGORY_NAMES, getParentCategory } from "@/lib/fileProcessing/constants";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BudgetComparisonProps {
  transactions: Transaction[];
  currentBudget: MonthlyBudget;
}

interface ComparisonData {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  actual: number;
  difference: number;
  percentageUsed: number;
}

export function BudgetComparison({ transactions, currentBudget }: BudgetComparisonProps) {
  // Calculer les dépenses réelles du mois en cours
  const currentMonthTransactions = transactions.filter(t => {
    const transactionMonth = format(parseISO(t.date), 'yyyy-MM');
    return transactionMonth === currentBudget.month;
  });

  // Filtrer et préparer les données pour la comparaison
  const comparisonData: ComparisonData[] = Object.entries(currentBudget.categories)
    .filter(([categoryId, category]) => {
      const hasTransactions = currentMonthTransactions.some(t => 
        t.category_id === categoryId || 
        getParentCategory(t.category_id) === categoryId
      );
      const hasAmount = category.totalEstimated > 0 || category.totalAdjusted > 0;
      return hasTransactions || hasAmount;
    })
    .map(([categoryId, category]) => {
      const actualAmount = currentMonthTransactions
        .filter(t => t.category_id === categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      const budgetedAmount = category.totalAdjusted ?? category.totalEstimated;
      
      return {
        categoryId,
        categoryName: CATEGORY_NAMES[categoryId],
        budgeted: budgetedAmount,
        actual: actualAmount,
        difference: budgetedAmount - actualAmount,
        percentageUsed: (actualAmount / budgetedAmount) * 100
      };
    });

  // Données pour le graphique
  const chartData = comparisonData.map(data => ({
    name: data.categoryName,
    Budget: data.budgeted,
    Réel: data.actual
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comparaison Budget vs Réalité - {currentBudget.month}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="Budget" fill="#8884d8" />
                <Bar dataKey="Réel" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détails par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th className="px-6 py-3">Catégorie</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Dépenses réelles</th>
                  <th className="px-6 py-3">Différence</th>
                  <th className="px-6 py-3">% Utilisé</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((data) => (
                  <tr key={data.categoryId} className="border-b">
                    <td className="px-6 py-4 font-medium">{data.categoryName}</td>
                    <td className="px-6 py-4">{formatCurrency(data.budgeted)}</td>
                    <td className="px-6 py-4">{formatCurrency(data.actual)}</td>
                    <td className={`px-6 py-4 ${data.difference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(data.difference)}
                    </td>
                    <td className={`px-6 py-4 ${data.percentageUsed > 100 ? 'text-red-500' : 'text-green-500'}`}>
                      {data.percentageUsed.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-muted/50">
                  <td className="px-6 py-4">Total</td>
                  <td className="px-6 py-4">
                    {formatCurrency(comparisonData.reduce((sum, d) => sum + d.budgeted, 0))}
                  </td>
                  <td className="px-6 py-4">
                    {formatCurrency(comparisonData.reduce((sum, d) => sum + d.actual, 0))}
                  </td>
                  <td className="px-6 py-4">
                    {formatCurrency(comparisonData.reduce((sum, d) => sum + d.difference, 0))}
                  </td>
                  <td className="px-6 py-4">
                    {((comparisonData.reduce((sum, d) => sum + d.actual, 0) / 
                      comparisonData.reduce((sum, d) => sum + d.budgeted, 0)) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
