import { ProcessedTransaction } from "./types";
import { processCSV } from "./csvProcessor";
import { processPDF } from "./pdfProcessor";
import { processImage } from "./imageProcessor";

export async function processFile(file: File): Promise<ProcessedTransaction[]> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    console.log("Processing file:", file.name, "type:", file.type);
    
    if (fileType === "text/csv" || fileName.endsWith(".csv")) {
      return await processCSV(file);
    } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await processPDF(file);
    } else if (
      fileType.startsWith("image/") ||
      /\.(jpg|jpeg|png)$/.test(fileName)
    ) {
      return await processImage(file);
    } else {
      throw new Error("Format de fichier non supporté");
    }
  } catch (error) {
    console.error("Erreur lors du traitement du fichier:", error);
    throw new Error("Erreur lors du traitement du fichier");
  }
}

export * from "./types";
export * from "../constants/constants";
