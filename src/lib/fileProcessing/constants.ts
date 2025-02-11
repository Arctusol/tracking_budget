// Mapping des catégories avec leurs IDs
export const CATEGORY_IDS = {
  // Catégories principales
  FOOD: '3a976285-a1c4-4e3e-a2c9-4673fdb7994e',
  TRANSPORT: 'e669e0f3-1158-4d7c-a32b-20e4414ccf2e',
  HOUSING: '06cbb4f4-62c2-40f0-9192-1040f961e23e',
  LEISURE: '3f59d0af-57c6-4973-bd4a-68b4294b818a',
  HEALTH: '5eb9d6eb-14a7-4ab4-9c09-2bba0b5e0c3a',
  SHOPPING: '2636f7ba-b737-434e-b282-7ec1ae6ae3e9',
  SERVICES: 'd0e00ea2-6362-4579-89c3-d27516fb0476',
  EDUCATION: 'f4b0c5d1-2345-4b67-89c0-1a2b3c4d5e6f',
  GIFTS: 'a1b2c3d4-5e6f-4a8b-9c0d-e1f2a3b4c5d6',
  VETERINARY: 'c1d2e3f4-5678-4a8b-9c0d-e1f2a3b4c5d6',
  INCOME: 'a61699b7-5f84-410f-af85-b6e17d342b4b',
  TRANSFERS: 'b2c3d4e5-f012-3456-7890-123456789012',
  OTHER: 'e5f6a7b8-9c0d-1234-5678-90abcdef1234',

  // Sous-catégories Santé
  MEDICAL: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
  PHARMACY: 'af520d67-24e6-4aa1-9902-2c37b44c03e4',
  INSURANCE: 'e64774db-a84c-4400-b0c4-99b41fec5518',
  PILL: '9138e5b7-676b-47de-9258-6b179be679d5',
  SUPPLEMENTS: '07d399fd-fddd-472d-bc5c-c5934e0f8b2c',

  // Sous-catégories Shopping
  CLOTHING: '283a4e6d-0e15-483b-a903-e01fa29e0aa8',
  ELECTRONICS: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
  HOME: 'f1e2d3c4-b5a6-9786-8d9e-0f1a2b3c4d5e',
  BEAUTY: 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d',
  JEWELRY: '9e0f1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',

  // Autres sous-catégories
  GROCERIES: '5dcaa933-378f-42e6-8fdb-707a1bcef007',
  RESTAURANT: '7f8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e',
  BAR: '3e4f5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
  PUBLIC_TRANSPORT: '65f65f34-e38a-4af4-a055-f95ed4306171',
  TAXI: '68d08f0c-8d49-4fd6-aece-ef13d4d1fdcd',
  FUEL: '4abbda8f-9630-44a6-b00a-84a51c44c519',
  RENT: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
  UTILITIES: '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d',
  INTERNET: 'a7b8d31e-2873-452f-98a9-66b2bd3de8f7',
  HOTEL: '5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d',
  ENTERTAINMENT: 'b5c6d7e8-9f0a-1b2c-3d4e-5f6a7b8c9d0e',
  SPORT: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
  BOOKS: '3aa03561-32a3-4cfa-bb65-a741d13687d2',
  SUBSCRIPTIONS: '72ddac59-ef59-400c-89f8-9a8424426752',
  SALARY: '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f',
  FREELANCE: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  REIMBURSEMENTS: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b',
  TRANSFER_ANTONIN: '3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a',
  TRANSFER_AMANDINE: '9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d'
} as const;

// Mapping inverse pour obtenir le nom de la catégorie à partir de son ID
export const CATEGORY_NAMES: { [key: string]: string } = {
  [CATEGORY_IDS.FOOD]: 'Alimentation',
  [CATEGORY_IDS.TRANSPORT]: 'Transport',
  [CATEGORY_IDS.HOUSING]: 'Logement',
  [CATEGORY_IDS.LEISURE]: 'Loisirs',
  [CATEGORY_IDS.HEALTH]: 'Santé',
  [CATEGORY_IDS.SHOPPING]: 'Shopping',
  [CATEGORY_IDS.SERVICES]: 'Services',
  [CATEGORY_IDS.EDUCATION]: 'Éducation',
  [CATEGORY_IDS.GIFTS]: 'Cadeaux',
  [CATEGORY_IDS.VETERINARY]: 'Vétérinaire',
  [CATEGORY_IDS.INCOME]: 'Revenus',
  [CATEGORY_IDS.TRANSFERS]: 'Virements',
  [CATEGORY_IDS.OTHER]: 'Autre',
  [CATEGORY_IDS.MEDICAL]: 'Médical',
  [CATEGORY_IDS.PHARMACY]: 'Pharmacie',
  [CATEGORY_IDS.INSURANCE]: 'Assurance',
  [CATEGORY_IDS.PILL]: 'Pilule',
  [CATEGORY_IDS.SUPPLEMENTS]: 'Compléments',
  [CATEGORY_IDS.CLOTHING]: 'Vêtements',
  [CATEGORY_IDS.ELECTRONICS]: 'Électronique',
  [CATEGORY_IDS.HOME]: 'Maison',
  [CATEGORY_IDS.BEAUTY]: 'Beauté',
  [CATEGORY_IDS.JEWELRY]: 'Bijoux',
  [CATEGORY_IDS.GROCERIES]: 'Courses',
  [CATEGORY_IDS.RESTAURANT]: 'Restaurant',
  [CATEGORY_IDS.BAR]: 'Bar',
  [CATEGORY_IDS.PUBLIC_TRANSPORT]: 'Transport en commun',
  [CATEGORY_IDS.TAXI]: 'Taxi',
  [CATEGORY_IDS.FUEL]: 'Carburant',
  [CATEGORY_IDS.RENT]: 'Loyer',
  [CATEGORY_IDS.UTILITIES]: 'Charges',
  [CATEGORY_IDS.INTERNET]: 'Internet',
  [CATEGORY_IDS.HOTEL]: 'Hôtel',
  [CATEGORY_IDS.ENTERTAINMENT]: 'Divertissement',
  [CATEGORY_IDS.SPORT]: 'Sport',
  [CATEGORY_IDS.BOOKS]: 'Livres',
  [CATEGORY_IDS.SUBSCRIPTIONS]: 'Abonnements',
  [CATEGORY_IDS.SALARY]: 'Salaire',
  [CATEGORY_IDS.FREELANCE]: 'Freelance',
  [CATEGORY_IDS.REIMBURSEMENTS]: 'Remboursements',
  [CATEGORY_IDS.TRANSFER_ANTONIN]: 'Virement Antonin',
  [CATEGORY_IDS.TRANSFER_AMANDINE]: 'Virement Amandine'
};

// Structure hiérarchique des catégories
export const CATEGORY_HIERARCHY: { [key: string]: string[] } = {
  [CATEGORY_IDS.FOOD]: [CATEGORY_IDS.GROCERIES, CATEGORY_IDS.RESTAURANT, CATEGORY_IDS.BAR],
  [CATEGORY_IDS.TRANSPORT]: [CATEGORY_IDS.PUBLIC_TRANSPORT, CATEGORY_IDS.TAXI, CATEGORY_IDS.FUEL],
  [CATEGORY_IDS.HOUSING]: [CATEGORY_IDS.RENT, CATEGORY_IDS.UTILITIES, CATEGORY_IDS.INTERNET],
  [CATEGORY_IDS.HEALTH]: [CATEGORY_IDS.MEDICAL, CATEGORY_IDS.PHARMACY, CATEGORY_IDS.INSURANCE, CATEGORY_IDS.PILL, CATEGORY_IDS.SUPPLEMENTS],
  [CATEGORY_IDS.SHOPPING]: [CATEGORY_IDS.CLOTHING, CATEGORY_IDS.ELECTRONICS, CATEGORY_IDS.HOME, CATEGORY_IDS.BEAUTY, CATEGORY_IDS.JEWELRY],
  [CATEGORY_IDS.LEISURE]: [CATEGORY_IDS.ENTERTAINMENT, CATEGORY_IDS.SPORT, CATEGORY_IDS.BOOKS, CATEGORY_IDS.HOTEL],
  [CATEGORY_IDS.INCOME]: [CATEGORY_IDS.SALARY, CATEGORY_IDS.FREELANCE, CATEGORY_IDS.REIMBURSEMENTS],
  [CATEGORY_IDS.TRANSFERS]: [CATEGORY_IDS.TRANSFER_ANTONIN, CATEGORY_IDS.TRANSFER_AMANDINE]
};

// Fonction utilitaire pour obtenir la catégorie parente
export function getParentCategory(categoryId: string | null | undefined): string | null {
  if (!categoryId) return null;
  
  for (const [parentId, children] of Object.entries(CATEGORY_HIERARCHY)) {
    if (children.includes(categoryId)) {
      return parentId;
    }
  }
  return null;
}

export function getCategoryName(categoryId: string | null | undefined): string {
  if (!categoryId) return 'Non catégorisé';
  return CATEGORY_NAMES[categoryId] || 'Catégorie inconnue';
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentation': '#0088FE',
  'Transport': '#00C49F',
  'Logement': '#FFBB28',
  'Loisirs': '#FF8042',
  'Santé': '#8884D8',
  'Shopping': '#82CA9D',
  'Services': '#FFC658',
  'Éducation': '#FF6B6B',
  'Cadeaux': '#B4A7D6',
  'Vétérinaire': '#A4C2F4',
  'Revenus': '#38A169',
  'Virements': '#805AD5',
  'Autre': '#718096',
  'Médical': '#9F7AEA',
  'Pharmacie': '#667EEA',
  'Assurance': '#4FD1C5',
  'Pilule': '#F687B3',
  'Compléments': '#FC8181',
  'Vêtements': '#F6AD55',
  'Électronique': '#4299E1',
  'Maison': '#48BB78',
  'Beauté': '#ED64A6',
  'Bijoux': '#ECC94B',
  'Courses': '#4A5568',
  'Restaurant': '#ED8936',
  'Bar': '#9B2C2C',
  'Transport en commun': '#2B6CB0',
  'Taxi': '#2C5282',
  'Carburant': '#2D3748',
  'Loyer': '#C53030',
  'Charges': '#DD6B20',
  'Internet': '#805AD5',
  'Hôtel': '#6B46C1',
  'Divertissement': '#B83280',
  'Sport': '#2B6CB0',
  'Livres': '#2C7A7B',
  'Abonnements': '#285E61',
  'Salaire': '#276749',
  'Freelance': '#2F855A',
  'Remboursements': '#38A169',
  'Virement Antonin': '#553C9A',
  'Virement Amandine': '#6B46C1'
};
