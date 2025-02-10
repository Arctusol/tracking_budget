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
import { getImportHistory } from "@/lib/services/import.service";
import { ImportRecord } from "@/types/import";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export function ImportHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async (showRefreshing = false) => {
    if (!user) return;

    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const records = await getImportHistory(user.id);
      setHistory(records);
    } catch (error) {
      console.error("Error loading import history:", error);
      setError("Failed to load import history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load history only on mount and when user changes
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!user || !isMounted) return;
      await loadHistory();
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle visibility changes
  useEffect(() => {
    // Only reload data if the page has been hidden for more than 5 minutes
    let lastHiddenTime: number | null = null;
    const RELOAD_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastHiddenTime = Date.now();
      } else if (lastHiddenTime) {
        const hiddenDuration = Date.now() - lastHiddenTime;
        if (hiddenDuration > RELOAD_THRESHOLD) {
          loadHistory();
        }
        lastHiddenTime = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      pending: "default",
      completed: "secondary",
      failed: "destructive",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Import History</h2>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Import History</h2>
        <Button
          variant="ghost"
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transactions</TableHead>
              <TableHead>File Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(record.created_at), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell
                  className="max-w-xs truncate"
                  title={record.file_name}
                >
                  {record.file_name}
                </TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
                <TableCell>{record.transaction_count}</TableCell>
                <TableCell>{record.file_type}</TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  No import history found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
