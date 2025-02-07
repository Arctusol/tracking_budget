import { Transaction, AccountMember } from "@/types/expense";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TransactionListProps {
  transactions?: Transaction[];
  members?: AccountMember[];
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
            <TableHead>Partagé avec</TableHead>
            <TableHead className="text-right">Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    transaction.type === "expense" ? "destructive" : "default"
                  }
                >
                  {transaction.category}
                </Badge>
              </TableCell>
              <TableCell>
                {members.find((m) => m.id === transaction.createdBy)?.name ||
                  "Inconnu"}
              </TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                  {transaction.sharedWith.map((userId) => {
                    const member = members.find((m) => m.id === userId);
                    return (
                      <Avatar
                        key={userId}
                        className="h-6 w-6 border-2 border-white"
                      >
                        <AvatarImage src={member?.avatarUrl} />
                        <AvatarFallback>{member?.name?.[0]}</AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
              </TableCell>
              <TableCell
                className={`text-right ${transaction.type === "expense" ? "text-red-500" : "text-green-500"}`}
              >
                {transaction.type === "expense" ? "-" : "+"}
                {transaction.amount.toFixed(2)} €
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
