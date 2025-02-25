import { CATEGORY_IDS } from './constants';

// IDs des catégories de produits
export const PRODUCT_CATEGORY_IDS = {
  // Alimentation
  VEGETABLES: '87e6d5cc-4b3a-481d-98b7-7a6f5c4d3e2f',
  FRUITS: 'a1b2c3d4-5e6f-4789-8901-2345a6b7c8d9',
  DAIRY: 'b2c3d4e5-6f7a-4567-89ab-cdef0123a4b5',
  MEAT: 'c3d4e5f6-7890-4abc-def0-123456789abc',
  FISH: 'd4e5f6a7-89ab-4cde-f012-3456789abcde',
  ALCOHOL: 'e5f6a7b8-9012-4345-6789-abcdef012345',
  SOFT_DRINKS: 'f6789012-3456-4789-abcd-ef0123456789',
  SNACKS: '01234567-89ab-4cde-f012-3456789abcde',
  PREPARED_MEALS: '89abcdef-0123-4456-7890-abcdef012345',
  BAKERY: 'abcdef12-3456-4789-abcd-ef0123456789',
  CEREALS_PASTA: 'bcdef123-4567-4890-bcde-f0123456789a',
  
  // Hygiène et Beauté
  HYGIENE: '12345678-90ab-4cde-f012-3456789abcde',
  BEAUTY_PRODUCTS: '23456789-0abc-4def-0123-456789abcdef',
  
  // Vêtements
  CLOTHING_ITEMS: '34567890-abcd-4ef0-1234-56789abcdef0',
  
  // Électronique
  ELECTRONICS_ACC: '45678901-bcde-4f01-2345-6789abcdef01',
  
  // Maison
  HOME_SUPPLIES: '56789012-cdef-4012-3456-789abcdef012',
  HOME_DECORATION: '6789abcd-ef01-4234-5678-9abcdef01234',

  // Autre
  OTHER: '789abcde-f012-4345-6789-abcdef012345',

  BREAKFAST: 'cdef1234-5678-4901-cdef-012345678901',
  CONDIMENTS: 'def12345-6789-4012-def0-123456789012',
  CANNED_FOOD: 'ef123456-7890-4123-ef01-234567890123',
  BABY: 'f1234567-8901-4234-f012-345678901234',
  PET_SUPPLIES: '12345678-9012-4345-1234-567890123456'
} as const;

// Types d'items pour une meilleure autocomplétion
export type ItemCategory = {
  keywords: string[];
  categoryId: string;
  subType?: string;
  frenchName: string;
  id: string;
};

export type ItemCategoryMap = {
  [key: string]: ItemCategory;
};

// Définition des catégories d'items
export const ITEM_CATEGORIES: ItemCategoryMap = {
  // Alimentation - Fruits et Légumes
  VEGETABLES: {
    keywords: ['tomate','patates', 'poivrons','carotte', 'salade', 'oignon', 'pomme de terre', 'courgette', 'aubergine', 'poireau', 'chou', 'radis', 'haricot'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'vegetables',
    frenchName: 'Légumes',
    id: PRODUCT_CATEGORY_IDS.VEGETABLES
  },
  FRUITS: {
    keywords: ['pomme', 'poire', 'banane', 'orange', 'citron', 'fraise', 'framboise', 'raisin', 'kiwi', 'mangue', 'ananas', 'pressade'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'fruits',
    frenchName: 'Fruits',
    id: PRODUCT_CATEGORY_IDS.FRUITS
  },

  // Alimentation - Produits Laitiers
  DAIRY: {
    keywords: ['lait', 'creme','fromage', 'yaourt', 'beurre', 'crème', 'camembert', 'emmental', 'comté', 'saint moret', 'chamonix'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'dairy',
    frenchName: 'Produits Laitiers',
    id: PRODUCT_CATEGORY_IDS.DAIRY
  },

  // Alimentation - Viandes et Poissons
  MEAT: {
    keywords: ['poulet', 'roti','knacks','chair','oeuf','campagne', 'mortadella','jbon','charcutier', 'hache', 'boeuf', 'porc', 'jambon', 'saucisse', 'steak', 'viande', 'bacon', 'saucisson', 'chorizo', 'filet mignon', 'lardons', 'escalope', 'côtelette', 'chipolatas', 'andouillette', 'merguez', 'rôti', 'entrecôte', 'dinde', 'foie gras', 'veau', 'agneau', 'charcuterie', 'boudin', 'pâté'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'meat',
    frenchName: 'Viandes',
    id: PRODUCT_CATEGORY_IDS.MEAT
  },
  FISH: {
    keywords: ['poisson', 'saumon', 'thon', 'sardine', 'truite', 'cabillaud', 'crevette'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'fish',
    frenchName: 'Poissons',
    id: PRODUCT_CATEGORY_IDS.FISH
  },

  // Alimentation - Boissons
  ALCOHOL: {
    keywords: ['vin', 'biere', 'whisky', 'rhum', 'vodka', 'ricard', 'goudale', 'champagne'],
    categoryId: CATEGORY_IDS.BAR,
    subType: 'alcohol',
    frenchName: 'Alcools',
    id: PRODUCT_CATEGORY_IDS.ALCOHOL
  },
  SOFT_DRINKS: {
    keywords: ['coca', 'fanta', 'sprite', 'jus', 'eau', 'san pel', 'evian', 'vittel', 'perrier', 'thé', 'café', 'sirop', 'boisson énergétique', 'ice tea', 'capri-sun', 'pims', 'pims lu'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'beverages',
    frenchName: 'Boissons',
    id: PRODUCT_CATEGORY_IDS.SOFT_DRINKS
  },

  // Alimentation - Snacks et Confiseries
  SNACKS: {
    keywords: ['chips', 'cacahuète', 'biscuit', 'gâteau', 'chocolat', 'bonbon', 'friandise', 'gaufre', 'barre céréale', 'pop corn', 'fruits secs', 'crackers', 'tuiles', 'chamonix', 'gap extra', 'lustucru'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'snacks',
    frenchName: 'Snacks',
    id: PRODUCT_CATEGORY_IDS.SNACKS
  },

  // Alimentation - Plats préparés
  PREPARED_MEALS: {
    keywords: ['plat cuisiné', 'plat préparé', 'surgelé', 'lasagne', 'pizza', 'ravioli', 'hachis', 'parmentier', 'gratin', 'quiche', 'nuggets', 'cordon bleu', 'girasoli', 'gnocchi', 'batonnet coraya'],
    categoryId: CATEGORY_IDS.GROCERIES,
    frenchName: 'Plats préparés',
    id: PRODUCT_CATEGORY_IDS.PREPARED_MEALS
  },

  // Produits d'Hygiène et Beauté
  HYGIENE: {
    keywords: ['savon', 'shampoing', 'dentifrice', 'brosse', 'deodorant', 'rasoir', 'coton', 'papier hygiénique', 'mouchoir', 'gel douche', 'serviette hygiénique', 'tampon', 'lingette'],
    categoryId: CATEGORY_IDS.BEAUTY,
    subType: 'hygiene',
    frenchName: 'Hygiène',
    id: PRODUCT_CATEGORY_IDS.HYGIENE
  },
  BEAUTY_PRODUCTS: {
    keywords: ['maquillage', 'crème', 'parfum', 'vernis', 'rouge à lèvres', 'mascara'],
    categoryId: CATEGORY_IDS.BEAUTY,
    subType: 'cosmetics',
    frenchName: 'Beauté',
    id: PRODUCT_CATEGORY_IDS.BEAUTY_PRODUCTS
  },

  // Vêtements
  CLOTHING_ITEMS: {
    keywords: ['pantalon', 'chemise', 't-shirt', 'robe', 'jupe', 'chaussure', 'manteau', 'pull', 'chaussette'],
    categoryId: CATEGORY_IDS.CLOTHING,
    subType: 'clothing',
    frenchName: 'Vêtements',
    id: PRODUCT_CATEGORY_IDS.CLOTHING_ITEMS
  },

  // Électronique
  ELECTRONICS_ACC: {
    keywords: ['téléphone', 'chargeur', 'câble', 'écouteur', 'pile', 'ampoule', 'batterie'],
    categoryId: CATEGORY_IDS.ELECTRONICS,
    subType: 'accessories',
    frenchName: 'Électronique',
    id: PRODUCT_CATEGORY_IDS.ELECTRONICS_ACC
  },

  // Maison
  HOME_SUPPLIES: {
    keywords: ['serviette','wc', 'gel', 'cajoline','papier toilette', 'éponge', 'sac poubelle', 'lessive', 'nettoyant', 'balai'],
    categoryId: CATEGORY_IDS.HOME,
    subType: 'supplies',
    frenchName: 'Fournitures pour la maison',
    id: PRODUCT_CATEGORY_IDS.HOME_SUPPLIES
  },
  HOME_DECORATION: {
    keywords: ['cadre', 'vase', 'coussin', 'tapis', 'rideau', 'lampe', 'décoration'],
    categoryId: CATEGORY_IDS.HOME,
    subType: 'decor',
    frenchName: 'Décoration',
    id: PRODUCT_CATEGORY_IDS.HOME_DECORATION
  },

  // Autre
  OTHER: {
    keywords: [],
    categoryId: CATEGORY_IDS.OTHER,
    frenchName: 'Autre',
    id: PRODUCT_CATEGORY_IDS.OTHER
  },

  BAKERY: {
    keywords: ['pain','feuill','toast', 'baguette', 'croissant', 'brioche', 'pain de mie', 'viennoiserie', 'pain au chocolat'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'bakery',
    frenchName: 'Boulangerie',
    id: PRODUCT_CATEGORY_IDS.BAKERY
  },
  
  CEREALS_PASTA: {
    keywords: ['farine', 'graine','pates','pâtes', 'riz', 'céréales', 'semoule', 'couscous', 'quinoa', 'boulgour', 'muesli', 'coquillettes', 'nouilles', 'flocons d\'avoine', 'chia', 'tanoshi ramen', 'blé complet', 'fusilli', 'torsades', 'penne', 'macaroni', 'spaghetti', 'tagliatelle', 'farfalle', 'linguine', 'lasagnes', 'ravioli', 'tortellini', 'vermicelles', 'orzo', 'risoni', 'conchiglie', 'cannelloni', 'bucatini', 'rigatoni', 'papardelle'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'cereals',
    frenchName: 'Céréales et Pâtes',
    id: PRODUCT_CATEGORY_IDS.CEREALS_PASTA
  },

  // Nouvelles catégories
  BREAKFAST: {
    keywords: ['confiture', 'miel', 'nutella', 'pâte à tartiner', 'sirop d\'érable', 'céréales petit-déjeuner', 'corn flakes', 'compote', 'chocolat en poudre', 'cacao', 'nesquik'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'breakfast',
    frenchName: 'Petit-déjeuner',
    id: PRODUCT_CATEGORY_IDS.BREAKFAST
  },

  CONDIMENTS: {
    keywords: ['ketchup', 'mayonnaise', 'moutarde', 'sauce', 'huile', 'vinaigre', 'sel', 'poivre', 'épice', 'herbe', 'curry', 'paprika', 'basilic', 'sauce soja', 'tabasco'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'condiments',
    frenchName: 'Condiments',
    id: PRODUCT_CATEGORY_IDS.CONDIMENTS
  },

  CANNED_FOOD: {
    keywords: ['conserve', 'thon en boîte', 'maïs', 'petit pois', 'haricot vert', 'cassoulet', 'ravioli en boîte', 'sauce tomate', 'concentré de tomate', 'sardine en boîte', 'macédoine', 'tomate pelée', 'd\'aucy'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'canned',
    frenchName: 'Conserves',
    id: PRODUCT_CATEGORY_IDS.CANNED_FOOD
  },

  BABY: {
    keywords: ['couche', 'lingette bébé', 'lait infantile', 'petit pot', 'biberon', 'puériculture', 'babyphone', 'tétine', 'petits suisses bébé', 'eau bébé'],
    categoryId: CATEGORY_IDS.GROCERIES,
    subType: 'baby',
    frenchName: 'Bébé',
    id: PRODUCT_CATEGORY_IDS.BABY
  },

  PET_SUPPLIES: {
    keywords: ['croquette', 'pâtée', 'litière', 'jouet animal', 'accessoire animal', 'laisse', 'collier', 'gamelle', 'arbre à chat', 'os à mâcher'],
    categoryId: CATEGORY_IDS.HOME,
    subType: 'pets',
    frenchName: 'Animalerie',
    id: PRODUCT_CATEGORY_IDS.PET_SUPPLIES
  }
};

// Fonction pour détecter la catégorie d'un produit
export function detectItemCategory(description: string): string {
  // Convertir en minuscules et nettoyer la description
  const cleanDesc = description.toLowerCase().trim();
  const words = cleanDesc.split(/[\s,.-]+/);

  // Fonction helper pour vérifier si un mot correspond à un des mots-clés
  const matchesKeyword = (word: string, keywords: string[]): boolean => {
    return keywords.some(keyword => {
      const cleanKeyword = keyword.toLowerCase().trim();
      return word === cleanKeyword || 
             word.startsWith(cleanKeyword) || 
             word.endsWith(cleanKeyword) ||
             cleanKeyword.includes(word);
    });
  };

  // Parcourir chaque mot de la description
  for (const word of words) {
    // Parcourir chaque catégorie et ses mots-clés
    for (const [categoryKey, category] of Object.entries(ITEM_CATEGORIES)) {
      if (category.keywords.length > 0 && 
          category.keywords.some(keyword => matchesKeyword(word, [keyword]))) {
        return category.id;
      }
    }
  }

  // Si aucune correspondance n'est trouvée, retourner la catégorie "Autre"
  return PRODUCT_CATEGORY_IDS.OTHER;
}

// Fonction utilitaire pour trouver la catégorie d'un item
export function findItemCategory(itemDescription: string): ItemCategory | null {
  const normalizedDescription = itemDescription.toLowerCase();
  
  for (const [key, category] of Object.entries(ITEM_CATEGORIES)) {
    if (category.keywords.some(keyword => normalizedDescription.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  
  return null;
}

// Fonction pour obtenir la catégorie principale d'un item
export function getItemMainCategory(itemDescription: string): string {
  const category = findItemCategory(itemDescription);
  return category?.categoryId || CATEGORY_IDS.OTHER;
}
