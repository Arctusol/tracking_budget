import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ExpenseList } from "./ExpenseList";
import { ExpenseChart } from "./ExpenseChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Transaction, Group, Profile } from '@/types/database';

interface GroupStats {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  memberShares: Record<string, number>;
}

export function GroupDashboard() {
  const { groupId } = useParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<GroupStats>({
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    memberShares: {},
  });

  useEffect(() => {
    if (!groupId) return;
    loadGroupData();
  }, [groupId]);

  async function loadGroupData() {
    try {
      // Charger les informations du groupe
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(
            profiles(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);
      
      // Extraire les membres
      const memberProfiles = groupData.members
        .map((m: any) => m.profiles)
        .filter(Boolean);
      setMembers(memberProfiles);

      // Charger les transactions du groupe
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData);

      // Calculer les statistiques
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthlyTransactions = transactionsData.filter(
        (t: Transaction) => new Date(t.date) >= firstDayOfMonth
      );

      const monthlyIncome = monthlyTransactions
        .filter((t: Transaction) => t.type === 'income')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const monthlyExpenses = monthlyTransactions
        .filter((t: Transaction) => t.type === 'expense')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const balance = monthlyIncome - monthlyExpenses;

      // Calculer la part de chaque membre
      const memberShares: Record<string, number> = {};
      memberProfiles.forEach((member: Profile) => {
        const memberExpenses = monthlyTransactions
          .filter((t: Transaction) => t.type === 'expense' && t.created_by === member.id)
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        memberShares[member.id] = memberExpenses;
      });

      setStats({
        balance,
        monthlyIncome,
        monthlyExpenses,
        memberShares,
      });

    } catch (error) {
      console.error('Error loading group data:', error);
    }
  }

  if (!group) return null;

  const statsDisplay = [
    {
      name: "Solde du Groupe",
      value: stats.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      trend: stats.balance >= 0 ? "up" : "down",
    },
    {
      name: "Revenus du Mois",
      value: stats.monthlyIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      trend: "up",
    },
    {
      name: "Dépenses du Mois",
      value: stats.monthlyExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      trend: "down",
    },
  ];

  return (
    <div className="w-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">{group.description}</p>
          </div>
          <div className="flex -space-x-2">
            {members.map((member) => (
              <Avatar key={member.id} className="border-2 border-background">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback>
                  {member.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
              </div>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {members.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback>
                    {member.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{member.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Dépenses du mois: {stats.memberShares[member.id]?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            </Card>
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

        <ExpenseList transactions={transactions} members={members} />
      </div>
    </div>
  );
}
