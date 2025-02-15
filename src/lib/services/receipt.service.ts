import { supabase } from "@/lib/supabase";
import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import { getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";
import { 
  DocumentAnalysisError,
  ConfigurationError,
  ExtractError,
  DocumentProcessingError,
} from "../errors/documentProcessingErrors";
import { detectCategory } from "../fileProcessing/categoryDetection";

export interface ReceiptData {
  id?: string;
  userId: string;
  merchantName?: string;
  total: number;
  date: string;
  items: ReceiptItem[];
  category: string;
  imageUrl?: string;
  status: 'pending' | 'processed' | 'error';
  error?: string;
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface PolygonBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function isWithinPolygon(bounds: PolygonBounds, x: number, y: number): boolean {
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

function extractNumberFromString(str: string): number {
  const match = str.match(/(\d+[.,]\d+)/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  const intMatch = str.match(/(\d+)/);
  if (intMatch) {
    return parseInt(intMatch[1], 10);
  }
  return 0;
}

export async function analyzeReceipt(imageUrl: string): Promise<ReceiptData | null> {
  try {
    // Get image data as base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    // Remove data URL prefix
    const base64Content = base64Data.split(',')[1];

    const endpoint = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      throw new ConfigurationError("Azure Document Intelligence credentials not configured");
    }

    const client = DocumentIntelligence(endpoint, { key });

    const initialResponse = await client
      .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
      .post({
        contentType: "application/json",
        body: {
          base64Source: base64Content
        }
      });

    if (isUnexpected(initialResponse)) {
      throw initialResponse.body.error;
    }

    const poller = getLongRunningPoller(client, initialResponse);
    console.log("Waiting for Azure receipt analysis to complete...");
    const result = await poller.pollUntilDone();
    console.log("Azure receipt analysis completed", result);

    if (!result.body || typeof result.body !== 'object' || !('analyzeResult' in result.body)) {
      console.error("Invalid response format:", result.body);
      throw new ExtractError("Invalid response format from Azure");
    }

    const analyzeResult = result.body.analyzeResult as any;
    
    // Define the polygon region of interest
    const receiptRegion: PolygonBounds = {
      minX: 227,
      maxX: 837,
      minY: 634,
      maxY: 1135
    };

    // Extract merchant name from the first line (title)
    let merchantName = "Unknown Merchant";
    const firstLine = analyzeResult.pages?.[0]?.lines?.[0];
    if (firstLine?.content) {
      merchantName = firstLine.content.trim();
    }

    // Extract items and total from the specified polygon region
    const items: ReceiptItem[] = [];
    let total = 0;

    // Process lines within the polygon region
    for (const page of analyzeResult.pages || []) {
      for (const line of page.lines || []) {
        // Check if line's bounding box is within our region of interest
        const [x1, y1] = line.polygon.slice(0, 2);
        if (isWithinPolygon(receiptRegion, x1, y1)) {
          const content = line.content;
          
          // Check if line contains price (ends with EUR)
          if (content.includes('EUR')) {
            const parts = content.split(' ');
            const priceStr = parts.find(p => p.match(/\d+[.,]\d+/));
            if (priceStr) {
              const price = extractNumberFromString(priceStr);
              
              // If this is the total line
              if (content.includes('MONTANT DU')) {
                total = price;
              } else {
                // This is an item line
                const description = parts.slice(0, -2).join(' ');
                items.push({
                  description,
                  quantity: 1, // Default quantity if not specified
                  price,
                  total: price
                });
              }
            }
          }
        }
      }
    }

    // Detect category based on merchant name and total amount
    const suggestedCategory = await detectCategory(merchantName, total);

    return {
      merchantName,
      total,
      date: new Date().toISOString(), // Use current date if not found in receipt
      items,
      category: suggestedCategory,
      status: "processed",
      userId: "", // This will be set by the caller
    };
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    if (error instanceof DocumentProcessingError) {
      throw error;
    }
    throw new DocumentAnalysisError("Failed to analyze receipt", error as Error);
  }
}

export async function storeReceipt(receiptData: ReceiptData) {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .insert([receiptData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error storing receipt:", error);
    throw error;
  }
}

export async function getReceiptsByUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("userId", userId)
      .order("date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching receipts:", error);
    throw error;
  }
}
