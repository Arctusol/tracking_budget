import { BankProcessor, AzureAnalyzeResult } from "./types";
import { DocumentProcessingError } from "../errors/documentProcessingErrors";

class BankProcessorFactory {
  private processors: BankProcessor[] = [];

  registerProcessor(processor: BankProcessor) {
    this.processors.push(processor);
  }

  async getProcessor(analyzeResult: AzureAnalyzeResult): Promise<BankProcessor> {
    for (const processor of this.processors) {
      if (processor.isSupportedBank(analyzeResult)) {
        return processor;
      }
    }
    throw new DocumentProcessingError("Format de relevé bancaire non reconnu");
  }
}

// Singleton instance
const bankProcessorFactory = new BankProcessorFactory();
export default bankProcessorFactory; 