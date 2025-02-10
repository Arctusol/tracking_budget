import { createWorker } from "tesseract.js";
import { ProcessedTransaction } from "./types";
import { processText } from "./textProcessor";

export async function processImage(file: File): Promise<ProcessedTransaction[]> {
  const worker = await createWorker("fra");
  
  try {
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    
    return processText(text);
  } catch (error) {
    await worker.terminate();
    throw new Error("Failed to process image");
  }
}
