import { ProcessedTransaction } from "./fileProcessing/types";

type CategoryRule = {
  category: string;
  keywords: string[];
  patterns?: RegExp[];
};

const categoryRules: CategoryRule[] = [
  {
    category: "food",
    keywords: [
      "carrefour",
      "auchan",
      "leclerc",
      "lidl",
      "aldi",
      "casino",
      "monoprix",
      "franprix",
      "intermarché",
      "super u",
      "restaurant",
      "mcdonalds",
      "burger",
      "sushi",
      "pizza",
      "boulangerie",
      "boucherie",
      "market",
      "supermarché",
      "épicerie",
    ],
    patterns: [/(?:super)?march[ée]/i, /rest(?:aurant|o)/i],
  },
  {
    category: "transport",
    keywords: [
      "sncf",
      "ratp",
      "uber",
      "taxi",
      "bolt",
      "navigo",
      "transdev",
      "autoroute",
      "péage",
      "parking",
      "station",
      "essence",
      "total",
      "shell",
      "esso",
      "bp",
      "metro",
      "bus",
      "train",
    ],
    patterns: [/(?:auto|moto|vélo|velo)lib/i, /(?:parking|garage)/i],
  },
  {
    category: "shopping",
    keywords: [
      "zara",
      "h&m",
      "uniqlo",
      "fnac",
      "darty",
      "amazon",
      "cdiscount",
      "decathlon",
      "ikea",
      "leroy merlin",
      "castorama",
      "bricorama",
      "galeries lafayette",
      "printemps",
    ],
  },
  {
    category: "leisure",
    keywords: [
      "cinema",
      "théâtre",
      "theatre",
      "concert",
      "spotify",
      "netflix",
      "disney",
      "prime video",
      "canal+",
      "parc",
      "musée",
      "museum",
      "bowling",
      "escape game",
      "sport",
    ],
  },
  {
    category: "health",
    keywords: [
      "pharmacie",
      "médecin",
      "medecin",
      "docteur",
      "hopital",
      "hôpital",
      "dentiste",
      "optique",
      "opticien",
      "mutuelle",
      "laboratoire",
      "clinique",
      "santé",
    ],
    patterns: [/(?:dr|docteur)\s+[a-z]+/i],
  },
  {
    category: "housing",
    keywords: [
      "loyer",
      "edf",
      "engie",
      "eau",
      "electricité",
      "gaz",
      "internet",
      "free",
      "orange",
      "sfr",
      "bouygues",
      "assurance habitation",
      "charges",
      "copropriété",
    ],
    patterns: [/(?:edf|engie|veolia)\s+energie/i],
  },
  {
    category: "salary",
    keywords: [
      "salaire",
      "paie",
      "paye",
      "remuneration",
      "rémunération",
      "traitement",
      "virement employeur",
    ],
    patterns: [/sal(?:aire)?\s+(?:net|brut)/i],
  },
];

export function categorizeTransaction(
  transaction: ProcessedTransaction,
): string {
  const description = transaction.description.toLowerCase();

  // First check for exact keyword matches
  for (const rule of categoryRules) {
    if (
      rule.keywords.some((keyword) =>
        description.includes(keyword.toLowerCase()),
      )
    ) {
      return rule.category;
    }
  }

  // Then check for pattern matches
  for (const rule of categoryRules) {
    if (rule.patterns?.some((pattern) => pattern.test(description))) {
      return rule.category;
    }
  }

  // Use amount-based heuristics as a fallback
  if (transaction.amount > 0) {
    if (transaction.amount > 1000) return "salary";
  } else {
    const amount = Math.abs(transaction.amount);
    if (amount < 30) return "food";
    if (amount > 500) return "housing";
  }

  return "other";
}

export function categorizeBatch(
  transactions: ProcessedTransaction[],
): ProcessedTransaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    category_id: transaction.category_id || categorizeTransaction(transaction),
  }));
}

export function getCategoryConfidence(
  transaction: ProcessedTransaction,
): number {
  const description = transaction.description.toLowerCase();
  let confidence = 0;

  // Check for keyword matches
  const rule = categoryRules.find(
    (r) =>
      r.keywords.some((k) => description.includes(k.toLowerCase())) ||
      r.patterns?.some((p) => p.test(description)),
  );

  if (rule) {
    confidence = 0.8; // Base confidence for keyword/pattern match

    // Increase confidence for multiple keyword matches
    const matchCount = rule.keywords.filter((k) =>
      description.includes(k.toLowerCase()),
    ).length;

    if (matchCount > 1) confidence = 0.9;
    if (matchCount > 2) confidence = 0.95;
  } else {
    confidence = 0.3; // Low confidence for amount-based categorization
  }

  return confidence;
}
