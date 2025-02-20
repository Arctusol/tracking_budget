import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DashboardFilters } from '../dashboard/DashboardFilters';
import { ExpenseByCategory } from '../dashboard/charts/ExpenseByCategory';
import { ExpenseOverTime } from '../dashboard/charts/ExpenseOverTime';
import { TopExpenses } from '../dashboard/charts/TopExpenses';
import { ShoppingHabits } from '../dashboard/charts/ShoppingHabits';
import { MerchantTreemap } from '../dashboard/charts/MerchantTreemap';
import { CategoryEvolution } from '../dashboard/charts/CategoryEvolution';
import { SavingsAnalysis } from '../dashboard/charts/SavingsAnalysis';
import { useReceipts } from '@/hooks/useReceipts';
import { useProductCategories } from '@/hooks/useProductCategories';
import { Receipt, ReceiptItem } from '@/types/receipt';
import { ProductCategory } from '@/hooks/useProductCategories';
import { FilterOptions } from '../dashboard/DashboardFilters';
import { PieChartData, TimeChartDataPoint } from '@/types/charts';
import { Transaction } from '@/types/transaction';
import { ReceiptData } from '@/lib/services/receipt.service';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart as PieChartIcon, BarChart, Calendar, TrendingUp, ShoppingBag, Percent } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ReceiptAnalysisDashboard() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: '',
    period: '30d',
    startDate: undefined,
    endDate: undefined
  });

  const { loading: receiptsLoading, error: receiptsError, fetchReceipts } = useReceipts({
    onReceiptsLoaded: (data: ReceiptData[]) => {
      // Convertir ReceiptData en Receipt
      const convertedReceipts: Receipt[] = data.map(receipt => ({
        id: receipt.id || crypto.randomUUID(), // Générer un ID si non présent
        user_id: receipt.user_id,
        merchant_id: receipt.merchant_id,
        merchantName: receipt.merchantName,
        total: receipt.total,
        date: receipt.date,
        status: receipt.status || 'processed',
        items: receipt.items.map(item => ({
          id: item.id || crypto.randomUUID(),
          name: item.description,
          quantity: item.quantity || 1,
          price: item.price || item.total,
          total: item.total,
          product_category_id: item.product_category_id,
          merchant_id: item.merchant_id,
          discount: item.discount,
          originalTotal: item.originalTotal
        })),
        created_at: receipt.date,
        created_by: receipt.user_id,
        updated_at: receipt.date
      }));
      setReceipts(convertedReceipts);
    }
  });

  const { loading: categoriesLoading, error: categoriesError, fetchCategories } = useProductCategories({
    onCategoriesLoaded: setCategories
  });

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchReceipts(filters),
      fetchCategories()
    ]);
  }, [fetchReceipts, fetchCategories, filters]);

  // Recharger les données quand les filtres changent
  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    fetchReceipts(newFilters);
  }, [fetchReceipts]);

  const categoryData = useMemo<PieChartData[]>(() => {
    if (!receipts?.length) return [];

    const categoryTotals = new Map<string, number>();
    const colors = [
      "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
      "#82CA9D", "#FF99C3", "#B39DDB", "#81D4FA", "#A5D6A7"
    ];

    receipts.forEach(receipt => {
      receipt.items?.forEach(item => {
        if (!item?.product_category?.id) return;
        
        const currentTotal = categoryTotals.get(item.product_category.id) || 0;
        categoryTotals.set(item.product_category.id, currentTotal + (item.total || 0));
      });
    });

    const totalExpenses = Array.from(categoryTotals.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(categoryTotals.entries()).map(([categoryId, value], index) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        name: category?.name || 'Inconnu',
        value,
        color: colors[index % colors.length],
        total: totalExpenses
      };
    });
  }, [receipts, categories]);

  const timeData = useMemo<TimeChartDataPoint[]>(() => {
    const dailyTotals = new Map<string, { expenses: number; income: number }>();
    
    if (!receipts?.length) return [];
    
    receipts.forEach(receipt => {
      if (!receipt?.date) return;
      
      const date = format(new Date(receipt.date), "yyyy-MM-dd");
      const total = receipt.items?.reduce((sum, item) => sum + (item?.total || 0), 0) || 0;
      const current = dailyTotals.get(date) || { expenses: 0, income: 0 };
      
      dailyTotals.set(date, {
        ...current,
        expenses: current.expenses + total,
        income: 0 // Les reçus sont toujours des dépenses
      });
    });

    return Array.from(dailyTotals.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date]) => ({
        date,
        expenses: dailyTotals.get(date)?.expenses || 0,
        income: 0
      }));
  }, [receipts]);

  const transactions = useMemo<Transaction[]>(() => {
    if (!receipts?.length) return [];

    return receipts.map(receipt => ({
      id: receipt.id,
      amount: receipt.total,
      type: 'expense' as const,
      description: receipt.merchantName || 'Sans nom',
      date: receipt.date,
      merchant: receipt.merchantName,
      created_by: receipt.created_by,
      created_at: receipt.created_at,
      updated_at: receipt.updated_at
    }));
  }, [receipts]);

  const topExpensesData = useMemo(() => {
    if (!receipts?.length) return [];

    return receipts
      .map(receipt => ({
        name: receipt.merchantName || 'Inconnu',
        amount: receipt.items?.reduce((sum, item) => sum + (item?.total || 0), 0) || 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [receipts]);

  const shoppingHabitsData = useMemo(() => {
    if (!receipts?.length) return [];
    
    const dayCount = new Map<string, { count: number; total: number }>();
    const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    receipts.forEach(receipt => {
      if (!receipt.date) return;
      const date = new Date(receipt.date);
      const dayIndex = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      // Convertir l'index pour commencer par Lundi (0)
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      const day = daysOrder[adjustedIndex];
      
      const current = dayCount.get(day) || { count: 0, total: 0 };
      dayCount.set(day, {
        count: current.count + 1,
        total: current.total + (receipt.total || 0)
      });
    });

    return daysOrder.map(day => ({
      dayOfWeek: day,
      count: dayCount.get(day)?.count || 0,
      total: dayCount.get(day)?.total || 0
    }));
  }, [receipts]);

  const merchantTreemapData = useMemo(() => {
    if (!receipts?.length || !categories?.length) return [];

    console.log('Receipts:', receipts);
    console.log('Sample receipt merchant:', receipts[0]?.merchantName);

    const merchantData = new Map<string, {
      total: number;
      categories: Map<string, number>;
    }>();

    // Couleurs pour les marchands
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
      "#D4A5A5", "#9B6B6B", "#E9D985", "#556270", "#6C5B7B"
    ];

    // Agréger les données par marchand
    receipts.forEach(receipt => {
      const name = receipt.merchantName;
      if (!name) return;

      const current = merchantData.get(name) || {
        total: 0,
        categories: new Map<string, number>()
      };

      // Ajouter le total du reçu
      current.total += receipt.total || 0;

      // Agréger les catégories des items
      receipt.items.forEach(item => {
        if (item.product_category?.id) {
          const categoryTotal = current.categories.get(item.product_category.id) || 0;
          current.categories.set(item.product_category.id, categoryTotal + (item.total || 0));
        }
      });

      merchantData.set(name, current);
    });

    console.log('Merchant data:', Array.from(merchantData.entries()));

    // Convertir les données pour le treemap
    const treemapData = Array.from(merchantData.entries())
      .filter(([_, data]) => data.total > 0) // Exclure les marchands sans dépenses
      .map(([name, data], index) => {
        // Trouver la catégorie principale
        const mainCategory = Array.from(data.categories.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        const category = categories.find(c => c.id === mainCategory?.[0]);

        return {
          name: name.length > 20 ? name.substring(0, 17) + '...' : name,
          size: data.total,
          color: colors[index % colors.length],
          category: category?.name || 'Non catégorisé'
        };
      })
      .sort((a, b) => b.size - a.size) // Trier par taille décroissante
      .slice(0, 15); // Limiter aux 15 plus gros marchands

    console.log('Treemap data:', treemapData);
    return treemapData;
  }, [receipts, categories]);

  const categoryColors = useMemo(() => {
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
      "#D4A5A5", "#9B6B6B", "#E9D985", "#556270", "#6C5B7B"
    ];
    
    return new Map(categories.map((category, index) => [
      category.id,
      colors[index % colors.length]
    ]));
  }, [categories]);

  const categoryEvolutionData = useMemo(() => {
    if (!receipts?.length) return [];

    const dailyTotals = new Map<string, Map<string, number>>();

    receipts.forEach(receipt => {
      if (!receipt.date) return;
      const date = format(new Date(receipt.date), 'yyyy-MM-dd');
      
      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, new Map());
      }

      receipt.items.forEach(item => {
        if (!item.product_category?.id) return;
        const currentTotal = dailyTotals.get(date)?.get(item.product_category.id) || 0;
        dailyTotals.get(date)?.set(item.product_category.id, currentTotal + item.total);
      });
    });

    return Array.from(dailyTotals.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, categoryTotals]) => {
        const data: { [key: string]: number | string } & { date: string } = { date };
        categories.forEach(category => {
          data[category.id] = categoryTotals.get(category.id) || 0;
        });
        return data;
      });
  }, [receipts, categories]);

  const savingsData = useMemo(() => {
    if (!receipts?.length || !categories?.length) return [];

    const categoryStats = new Map<string, {
      originalTotal: number;
      finalTotal: number;
      count: number;
    }>();

    // Agréger les économies par catégorie
    receipts.forEach(receipt => {
      receipt.items.forEach(item => {
        if (!item.product_category?.id) return;

        const current = categoryStats.get(item.product_category.id) || {
          originalTotal: 0,
          finalTotal: 0,
          count: 0
        };

        // Calculer le prix original si disponible
        const originalTotal = item.originalTotal || item.total;
        const finalTotal = item.total;

        if (originalTotal !== finalTotal) { // Ne prendre en compte que les articles avec des réductions
          current.originalTotal += originalTotal;
          current.finalTotal += finalTotal;
          current.count += 1;
          categoryStats.set(item.product_category.id, current);
        }
      });
    });

    // Convertir les données pour le graphique
    return Array.from(categoryStats.entries())
      .map(([categoryId, stats]) => {
        const category = categories.find(c => c.id === categoryId);
        const savings = stats.originalTotal - stats.finalTotal;
        return {
          category: category?.name || 'Non catégorisé',
          originalPrice: stats.originalTotal,
          finalPrice: stats.finalTotal,
          savings,
          savingsPercentage: (savings / stats.originalTotal) * 100
        };
      })
      .filter(data => data.savings > 0) // Ne garder que les catégories avec des économies
      .sort((a, b) => b.savings - a.savings); // Trier par montant d'économies décroissant
  }, [receipts, categories]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <DashboardFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          usedCategories={categories.map(c => c.id)}
        />
      </div>

      {(receiptsError || categoriesError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {receiptsError?.message || categoriesError?.message}</span>
        </div>
      )}

      {(receiptsLoading || categoriesLoading) ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendances
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Chronologie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <ExpenseByCategory 
                  data={categoryData}
                  title="Répartition par Catégorie"
                  showPercentage
                />
              </Card>

              <Card className="p-4">
                <ExpenseOverTime 
                  data={timeData}
                  transactions={transactions}
                  title="Évolution des Dépenses"
                  granularity="day"
                  showExpenses
                  showIncome={false}
                />
              </Card>

              <Card className="p-4">
                <ShoppingHabits
                  data={shoppingHabitsData}
                  title="Habitudes d'Achat"
                />
              </Card>

              <Card className="p-4">
                <SavingsAnalysis
                  data={savingsData}
                  title="Analyse des Économies"
                />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card className="p-4">
              <CategoryEvolution
                data={categoryEvolutionData}
                categories={categories.map(c => ({
                  id: c.id,
                  name: c.name,
                  color: categoryColors.get(c.id) || '#' + Math.floor(Math.random()*16777215).toString(16)
                }))}
                title="Évolution des Catégories"
              />
            </Card>

            <Card className="p-4">
              <ExpenseOverTime 
                data={timeData}
                transactions={transactions}
                title="Analyse des Tendances"
                granularity="day"
                showExpenses
                showIncome={false}
              />
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card className="p-4">
              <MerchantTreemap
                data={merchantTreemapData}
                title="Répartition des Marchands"
              />
            </Card>

            <Card className="p-4">
              <TopExpenses 
                data={topExpensesData}
                title="Top des Dépenses"
              />
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Historique des Achats</h3>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Magasin</TableHead>
                      <TableHead>Montant Total</TableHead>
                      <TableHead>Nombre d'Articles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts?.map((receipt) => receipt && (
                      <TableRow key={receipt.id}>
                        <TableCell>{receipt.date ? format(new Date(receipt.date), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell>{receipt.merchantName || "Inconnu"}</TableCell>
                        <TableCell>
                          {(receipt.total || 0).toFixed(2)} €
                        </TableCell>
                        <TableCell>{receipt.items?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
