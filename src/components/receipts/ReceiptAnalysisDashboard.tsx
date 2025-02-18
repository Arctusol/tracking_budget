import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart as PieChartIcon, BarChart, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/lib/auth";
import { getReceiptsByUser, type ReceiptData } from "@/lib/services/receipt.service";
import {getCategoryName } from "@/lib/constants/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TrendData {
  date: string;
  amount: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export function ReceiptAnalysisDashboard() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadReceipts();
    }
  }, [user]);

  const loadReceipts = async () => {
    try {
      if (!user) return;
      
      const receipts = await getReceiptsByUser(user.id);
      setReceipts(receipts);

      // Process category data
      const categoryTotals = receipts.reduce((acc: Record<string, number>, receipt) => {
        const category = receipt.category_id || "Uncategorized";
        acc[category] = (acc[category] || 0) + (receipt.total || 0);
        return acc;
      }, {});

      const categoryDataArray: CategoryData[] = Object.entries(categoryTotals).map(([name, value], index) => ({
        name,
        value: value as number,
        color: COLORS[index % COLORS.length],
      }));
      setCategoryData(categoryDataArray);

      // Process trend data
      const trendMap = new Map<string, number>();
      receipts.forEach((receipt) => {
        const date = format(new Date(receipt.date), "yyyy-MM-dd");
        trendMap.set(date, (trendMap.get(date) || 0) + receipt.total);
      });

      const sortedTrendData = Array.from(trendMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTrendData(sortedTrendData);
    } catch (error) {
      console.error("Error loading receipts:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends">
            <BarChart className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <Calendar className="h-4 w-4 mr-2" />
            All Receipts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Expense Trends</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      {format(new Date(receipt.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{receipt.merchantName || "Unknown"}</TableCell>
                    <TableCell>
                      {getCategoryName(receipt.category_id)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${receipt.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
