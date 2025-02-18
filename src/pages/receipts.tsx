import { ReceiptUpload } from "@/components/receipts/ReceiptUpload";
import { ReceiptHistory } from "@/components/receipts/ReceiptHistory";

export default function ReceiptsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analyse des tickets de caisse</h1>
      <ReceiptUpload />
      <ReceiptHistory />
    </div>
  );
}
