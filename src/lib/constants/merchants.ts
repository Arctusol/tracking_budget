// Types de marchands
export const MERCHANT_TYPES = {
  SUPERMARKET: 'supermarket',
  ORGANIC: 'organic',
  BAKERY: 'bakery',
  RESTAURANT: 'restaurant',
  CLOTHING: 'clothing',
  ELECTRONICS: 'electronics',
  HOME: 'home',
  BEAUTY: 'beauty',
} as const;

export const MERCHANT_IDS = {
  // Supermarchés
  INTERMARCHE: '78901234-5678-4901-2345-678901234567',
  CARREFOUR: '89012345-6789-4012-3456-789012345678',
  LECLERC: '90123456-7890-4123-4567-890123456789',
  AUCHAN: 'a0123456-7890-4123-4567-890123456789',
  LIDL: 'f0123456-7890-4123-4567-890123456789',
  ALDI: 'f1234567-8901-4234-5678-901234567890',
  MONOPRIX: 'f2345678-9012-4345-6789-012345678901',

  // Magasins Bio
  BIOCOOP: 'b0123456-7890-4123-4567-890123456789',

  // Boulangeries
  BOULANGERIE: 'c0123456-7890-4123-4567-890123456789',

  // Restaurants
  MCDONALDS: 'd0123456-7890-4123-4567-890123456789',
  BURGER_KING: 'e0123456-7890-4123-4567-890123456789',

  // Vêtements
  HM: 'f3456789-0123-4456-7890-123456789012',
  ZARA: 'f4567890-1234-4567-8901-234567890123',
  UNIQLO: 'f5678901-2345-4678-9012-345678901234',

  // Électronique
  FNAC: 'f6789012-3456-4789-0123-456789012345',
  DARTY: 'f7890123-4567-4890-1234-567890123456',
  BOULANGER: 'f8901234-5678-4901-2345-678901234567',

  // Maison
  IKEA: 'f9012345-6789-4012-3456-789012345678',
  MAISONS_DU_MONDE: 'fa123456-7890-4123-4567-890123456789',
  LEROY_MERLIN: 'fb234567-8901-4234-5678-901234567890',

  // Beauté
  SEPHORA: 'fc345678-9012-4345-6789-012345678901',
  YVES_ROCHER: 'fd456789-0123-4456-7890-123456789012',
  MARIONNAUD: 'fe567890-1234-4567-8901-234567890123',
} as const;

export const MERCHANT_NAMES = {
  [MERCHANT_IDS.INTERMARCHE]: 'Intermarché',
  [MERCHANT_IDS.CARREFOUR]: 'Carrefour',
  [MERCHANT_IDS.LECLERC]: 'Leclerc',
  [MERCHANT_IDS.AUCHAN]: 'Auchan',
  [MERCHANT_IDS.LIDL]: 'Lidl',
  [MERCHANT_IDS.ALDI]: 'Aldi',
  [MERCHANT_IDS.MONOPRIX]: 'Monoprix',
  [MERCHANT_IDS.BIOCOOP]: 'Biocoop',
  [MERCHANT_IDS.BOULANGERIE]: 'Boulangerie',
  [MERCHANT_IDS.MCDONALDS]: "McDonald's",
  [MERCHANT_IDS.BURGER_KING]: 'Burger King',
  [MERCHANT_IDS.HM]: 'H&M',
  [MERCHANT_IDS.ZARA]: 'Zara',
  [MERCHANT_IDS.UNIQLO]: 'Uniqlo',
  [MERCHANT_IDS.FNAC]: 'Fnac',
  [MERCHANT_IDS.DARTY]: 'Darty',
  [MERCHANT_IDS.BOULANGER]: 'Boulanger',
  [MERCHANT_IDS.IKEA]: 'IKEA',
  [MERCHANT_IDS.MAISONS_DU_MONDE]: 'Maisons du Monde',
  [MERCHANT_IDS.LEROY_MERLIN]: 'Leroy Merlin',
  [MERCHANT_IDS.SEPHORA]: 'Sephora',
  [MERCHANT_IDS.YVES_ROCHER]: 'Yves Rocher',
  [MERCHANT_IDS.MARIONNAUD]: 'Marionnaud',
} as const;

export const MERCHANT_METADATA = {
  [MERCHANT_IDS.INTERMARCHE]: { type: MERCHANT_TYPES.SUPERMARKET },
  [MERCHANT_IDS.CARREFOUR]: { type: MERCHANT_TYPES.SUPERMARKET },
  [MERCHANT_IDS.LECLERC]: { type: MERCHANT_TYPES.SUPERMARKET },
  [MERCHANT_IDS.AUCHAN]: { type: MERCHANT_TYPES.SUPERMARKET },
  [MERCHANT_IDS.LIDL]: { type: MERCHANT_TYPES.SUPERMARKET },
  [MERCHANT_IDS.ALDI]: { type: MERCHANT_TYPES.SUPERMARKET },
  [MERCHANT_IDS.MONOPRIX]: { type: MERCHANT_TYPES.SUPERMARKET },
  [MERCHANT_IDS.BIOCOOP]: { type: MERCHANT_TYPES.ORGANIC },
  [MERCHANT_IDS.BOULANGERIE]: { type: MERCHANT_TYPES.BAKERY },
  [MERCHANT_IDS.MCDONALDS]: { type: MERCHANT_TYPES.RESTAURANT },
  [MERCHANT_IDS.BURGER_KING]: { type: MERCHANT_TYPES.RESTAURANT },
  [MERCHANT_IDS.HM]: { type: MERCHANT_TYPES.CLOTHING },
  [MERCHANT_IDS.ZARA]: { type: MERCHANT_TYPES.CLOTHING },
  [MERCHANT_IDS.UNIQLO]: { type: MERCHANT_TYPES.CLOTHING },
  [MERCHANT_IDS.FNAC]: { type: MERCHANT_TYPES.ELECTRONICS },
  [MERCHANT_IDS.DARTY]: { type: MERCHANT_TYPES.ELECTRONICS },
  [MERCHANT_IDS.BOULANGER]: { type: MERCHANT_TYPES.ELECTRONICS },
  [MERCHANT_IDS.IKEA]: { type: MERCHANT_TYPES.HOME },
  [MERCHANT_IDS.MAISONS_DU_MONDE]: { type: MERCHANT_TYPES.HOME },
  [MERCHANT_IDS.LEROY_MERLIN]: { type: MERCHANT_TYPES.HOME },
  [MERCHANT_IDS.SEPHORA]: { type: MERCHANT_TYPES.BEAUTY },
  [MERCHANT_IDS.YVES_ROCHER]: { type: MERCHANT_TYPES.BEAUTY },
  [MERCHANT_IDS.MARIONNAUD]: { type: MERCHANT_TYPES.BEAUTY },
} as const;

export const MERCHANT_ALIASES = {
  [MERCHANT_IDS.INTERMARCHE]: ['intermarche', 'intermarché', 'itm'],
  [MERCHANT_IDS.CARREFOUR]: ['carrefour', 'carrefour market', 'carrefour city'],
  [MERCHANT_IDS.LECLERC]: ['leclerc', 'e.leclerc'],
  [MERCHANT_IDS.AUCHAN]: ['auchan', 'auchan supermarche'],
  [MERCHANT_IDS.LIDL]: ['lidl'],
  [MERCHANT_IDS.ALDI]: ['aldi'],
  [MERCHANT_IDS.MONOPRIX]: ['monoprix', 'monop', 'daily monop'],
  [MERCHANT_IDS.BIOCOOP]: ['biocoop'],
  [MERCHANT_IDS.BOULANGERIE]: ['boulangerie', 'boulanger', 'patisserie'],
  [MERCHANT_IDS.MCDONALDS]: ['mcdonalds', 'mc donalds', 'mc do'],
  [MERCHANT_IDS.BURGER_KING]: ['burger king', 'bk'],
  [MERCHANT_IDS.HM]: ['h&m', 'h et m', 'hm'],
  [MERCHANT_IDS.ZARA]: ['zara'],
  [MERCHANT_IDS.UNIQLO]: ['uniqlo'],
  [MERCHANT_IDS.FNAC]: ['fnac', 'fnac darty'],
  [MERCHANT_IDS.DARTY]: ['darty'],
  [MERCHANT_IDS.BOULANGER]: ['boulanger'],
  [MERCHANT_IDS.IKEA]: ['ikea'],
  [MERCHANT_IDS.MAISONS_DU_MONDE]: ['maisons du monde', 'mdm'],
  [MERCHANT_IDS.LEROY_MERLIN]: ['leroy merlin', 'lm'],
  [MERCHANT_IDS.SEPHORA]: ['sephora'],
  [MERCHANT_IDS.YVES_ROCHER]: ['yves rocher'],
  [MERCHANT_IDS.MARIONNAUD]: ['marionnaud'],
} as const;

export function findMerchantIdByName(name: string): string | null {
  const normalizedName = name.toLowerCase().trim();
  
  // Recherche directe par ID
  for (const [id, merchantName] of Object.entries(MERCHANT_NAMES)) {
    if (merchantName.toLowerCase() === normalizedName) {
      return id;
    }
  }

  // Recherche dans les alias
  for (const [id, aliases] of Object.entries(MERCHANT_ALIASES)) {
    if (aliases.some(alias => normalizedName.includes(alias))) {
      return id;
    }
  }

  return null;
}

export function getMerchantType(id: string): string | null {
  return MERCHANT_METADATA[id as keyof typeof MERCHANT_METADATA]?.type || null;
}
