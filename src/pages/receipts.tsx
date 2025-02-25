import { ReceiptUpload } from "@/components/receipts/ReceiptUpload";
import { ReceiptHistory } from "@/components/receipts/ReceiptHistory";

export default function ReceiptsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-screen-2xl min-h-screen overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-bold">Analyse des tickets de caisse</h1>
      <div className="max-w-[1800px] mx-auto relative">
        <ReceiptUpload />
        <ReceiptHistory />
      </div>
    </div>
  );
}
