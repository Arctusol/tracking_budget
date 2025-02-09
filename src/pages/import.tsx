import ImportContainer from "@/components/import/ImportContainer";
import { ImportHistory } from "@/components/import/ImportHistory";

export default function ImportPage() {
    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-2xl font-bold mb-4">Import de transactions</h1>
            <ImportContainer />
            <ImportHistory />
        </div>
    );
}