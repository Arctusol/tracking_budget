import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { getReceiptsByUser } from "@/lib/services/receipt.service";
import { ReceiptData } from "@/lib/services/receipt.service";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export function ReceiptHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async (showRefreshing = false) => {
    if (!user) return;

    if (showRefreshing) {
      setRefreshing(true);
    }

    try {
      const receipts = await getReceiptsByUser(user.id);
      setHistory(receipts);
      setError("");
    } catch (error) {
      console.error("Error loading receipt history:", error);
      setError("Failed to load receipt history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Receipt History</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadHistory(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Receipts</AlertTitle>
          <AlertDescription>
            You haven't uploaded any receipts yet.
          </AlertDescription>
        </Alert>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell>
                  {format(new Date(receipt.date), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>{receipt.merchantName || "Unknown"}</TableCell>
                <TableCell>{receipt.total.toFixed(2)} €</TableCell>
                <TableCell>{receipt.category}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      receipt.status === "processed"
                        ? "secondary"
                        : receipt.status === "error"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {receipt.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {receipt.imageUrl && (
                    <a
                      href={receipt.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary hover:underline"
                    >
                      View Receipt
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
