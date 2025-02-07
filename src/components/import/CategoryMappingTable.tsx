import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface CategoryMappingTableProps {
  transactions?: Transaction[];
  onCategoryChange?: (transactionId: string, category: string) => void;
}

const defaultTransactions: Transaction[] = [
  {
    id: "1",
    date: "2024-03-20",
    description: "Supermarket Purchase",
    amount: 85.5,
    category: "Groceries",
  },
  {
    id: "2",
    date: "2024-03-19",
    description: "Monthly Transport Pass",
    amount: 75.0,
    category: "Transport",
  },
  {
    id: "3",
    date: "2024-03-18",
    description: "Restaurant Payment",
    amount: 45.3,
    category: "Dining",
  },
];

const categories = [
  "Groceries",
  "Transport",
  "Dining",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Other",
];

const CategoryMappingTable = ({
  transactions = defaultTransactions,
  onCategoryChange = () => {},
}: CategoryMappingTableProps) => {
  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Input
                  type="date"
                  value={transaction.date}
                  readOnly
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={transaction.description}
                  readOnly
                  className="w-full"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={transaction.amount}
                  readOnly
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={transaction.category}
                  onValueChange={(value) =>
                    onCategoryChange(transaction.id, value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CategoryMappingTable;
