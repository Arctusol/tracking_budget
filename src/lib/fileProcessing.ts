import * as Papa from "papaparse";
import { createWorker } from "tesseract.js";

export interface ProcessedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

export async function processFile(file: File): Promise<ProcessedTransaction[]> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
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

async function processCSV(file: File): Promise<ProcessedTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions = results.data
          .map((row: any) => {
            // Adapt these field names based on your CSV structure
            return {
              date: row.date || row.Date || "",
              description:
                row.description ||
                row.Description ||
                row.libelle ||
                row.Libellé ||
                "",
              amount:
                parseFloat(
                  row.amount || row.Amount || row.montant || row.Montant || "0",
                ) || 0,
              category: row.category || row.Category || "",
            };
          })
          .filter((t) => t.date && t.amount);
        resolve(transactions);
      },
      error: (error) => {
        reject(new Error("Erreur lors de la lecture du fichier CSV"));
      },
    });
  });
}

async function processPDF(file: File): Promise<ProcessedTransaction[]> {
  // For now, we'll just extract text and try to parse it
  // In a real implementation, you'd want to use a more sophisticated PDF parsing library
  const text = await file.text();

  // This is a very basic implementation - you'd want to improve this based on your PDF structure
  const lines = text.split("\n");
  const transactions: ProcessedTransaction[] = [];

  for (const line of lines) {
    const match = line.match(
      /([0-9]{2}[/-][0-9]{2}[/-][0-9]{4}).*?([0-9]+[.,][0-9]{2})/,
    );
    if (match) {
      transactions.push({
        date: match[1],
        description: line.replace(match[0], "").trim(),
        amount: parseFloat(match[2].replace(",", ".")),
        category: "",
      });
    }
  }

  return transactions;
}

async function processImage(file: File): Promise<ProcessedTransaction[]> {
  const worker = await createWorker("fra");

  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    await worker.terminate();

    // Similar to PDF processing, but with OCR text
    const lines = text.split("\n");
    const transactions: ProcessedTransaction[] = [];

    for (const line of lines) {
      const match = line.match(
        /([0-9]{2}[/-][0-9]{2}[/-][0-9]{4}).*?([0-9]+[.,][0-9]{2})/,
      );
      if (match) {
        transactions.push({
          date: match[1],
          description: line.replace(match[0], "").trim(),
          amount: parseFloat(match[2].replace(",", ".")),
          category: "",
        });
      }
    }

    return transactions;
  } catch (error) {
    console.error("Erreur lors de la lecture de l'image:", error);
    throw new Error("Erreur lors de la lecture de l'image");
  }
}
