import { Button } from "@/components/ui/button";
import Papa from "papaparse";

interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function ExportButton({ data, filename, variant = "outline", className }: ExportButtonProps) {
  const handleExport = () => {
    // Ajouter le BOM UTF-8 pour la prise en charge des caractères spéciaux
    const BOM = "\uFEFF";
    
    // Convert to CSV with proper encoding options
    const csv = Papa.unparse(data, {
      quotes: true, // Force quotes around all fields
      delimiter: ";", // Use semicolon as delimiter (better for Excel in French locale)
    });
    
    // Combine BOM with CSV data
    const csvContent = BOM + csv;
    
    // Create blob with proper encoding
    const blob = new Blob([csvContent], { 
      type: "text/csv;charset=utf-8" 
    });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // Set file name with .csv extension if not already present
    const finalFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    
    // Trigger download
    link.setAttribute("href", url);
    link.setAttribute("download", finalFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleExport} variant={variant} className={className}>
      Export to CSV
    </Button>
  );
}
