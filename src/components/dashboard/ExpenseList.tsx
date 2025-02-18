import { Transaction } from "@/types/expense";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCategoryName } from "@/lib/constants/constants";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface TransactionListProps {
  transactions?: Transaction[];
  members?: Profile[];
}

export function ExpenseList({
  transactions = [],
  members = [],
}: TransactionListProps) {
  return (
    <div className="w-full bg-white rounded-lg shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Créé par</TableHead>
            <TableHead className="text-right">Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {new Date(transaction.date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                <Badge
                  variant={transaction.type === "expense" ? "destructive" : "secondary"}
                  className={
                    transaction.type === "expense" 
                      ? "bg-red-100 hover:bg-red-200 text-red-700" 
                      : "bg-green-100 hover:bg-green-200 text-green-700"
                  }
                >
                  {getCategoryName(transaction.category_id)}
                </Badge>
              </TableCell>
              <TableCell>
                {members.find((m) => m.id === transaction.created_by)?.full_name ||
                  "Inconnu"}
              </TableCell>
              <TableCell className={`text-right ${
                transaction.type === "expense" 
                  ? "text-red-600" 
                  : "text-green-600"
              }`}>
                {transaction.type === "expense" ? "- " : "+ "}
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(transaction.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
