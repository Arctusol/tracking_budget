import { ExpenseList } from "./ExpenseList";
import { ExpenseChart } from "./ExpenseChart";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrendingUp,
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  date: Date;
  category: string;
  created_by: string;
  shared_with?: string[];
  split_type?: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState({
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    userShare: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Charger les transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactionsError) {
        console.error('Error loading transactions:', transactionsError);
        return;
      }

      // Charger les profils
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      setTransactions(transactionsData || []);
      setProfiles(profilesData || []);

      // Calculer les statistiques
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthlyTransactions = (transactionsData || []).filter(
        (t: Transaction) => new Date(t.date) >= firstDayOfMonth
      );

      const monthlyIncome = monthlyTransactions
        .filter((t: Transaction) => t.type === 'income')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const monthlyExpenses = monthlyTransactions
        .filter((t: Transaction) => t.type === 'expense')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const balance = monthlyIncome - monthlyExpenses;

      const userExpenses = monthlyTransactions
        .filter((t: Transaction) => t.type === 'expense' && t.created_by === user.id)
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setStats({
        balance,
        monthlyIncome,
        monthlyExpenses,
        userShare: userExpenses
      });
    };

    fetchData();
  }, [user]);

  const statsDisplay = [
    {
      name: "Solde du Compte",
      value: `${stats.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      trend: stats.balance >= 0 ? "up" : "down",
    },
    {
      name: "Revenus du Mois",
      value: `${stats.monthlyIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      trend: "up",
    },
    {
      name: "Dépenses du Mois",
      value: `${stats.monthlyExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      trend: "down",
    },
    {
      name: "Mes Dépenses",
      value: `${stats.userShare.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      trend: "neutral",
    },
  ];

  return (
    <div className="w-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Tableau de Bord SpendWise</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat) => (
            <div key={stat.name} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                {stat.trend === "up" && (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                )}
                {stat.trend === "down" && (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                {stat.trend === "neutral" && (
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ExpenseChart
            transactions={transactions}
            type="expense"
            title="Dépenses par Catégorie"
          />
          <ExpenseChart
            transactions={transactions}
            type="income"
            title="Revenus par Catégorie"
          />
        </div>

        <ExpenseList transactions={transactions} members={profiles} />
      </div>
    </div>
  );
}
