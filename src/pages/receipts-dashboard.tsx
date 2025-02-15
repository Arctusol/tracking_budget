import { ReceiptAnalysisDashboard } from "@/components/receipts/ReceiptAnalysisDashboard";

export default function ReceiptsDashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analyse des tickets de caisse</h1>
      <ReceiptAnalysisDashboard />
    </div>
  );
}
