import { CATEGORY_IDS } from './constants';

export function detectCategory(description: string, amount: number): string | undefined {
  // Convertir en minuscules et nettoyer la description
  const cleanDesc = description.toLowerCase().trim();
  const words = cleanDesc.split(/[\s,.-]+/);
  
  // Fonction helper pour vérifier si un mot commence par un des mots-clés
  const startsWithKeyword = (word: string, keywords: string[]): boolean => {
    return keywords.some(keyword => word.startsWith(keyword.toLowerCase()));
  };

  // Fonction helper pour vérifier si la description contient exactement un des mots-clés
  const hasExactKeyword = (keywords: string[]): boolean => {
    return keywords.some(keyword => 
      words.some(word => word === keyword.toLowerCase() || 
                        word === keyword.toLowerCase() + 's')); // Gestion du pluriel simple
  };

  // Détection des virements spécifiques (basé sur le préfixe VIR et le destinataire)
  if (cleanDesc.startsWith('vir') || cleanDesc.includes('virement')) {
    if (words.some(word => ['antonin', 'ant', 'ab', 'anto'].includes(word))) {
      return CATEGORY_IDS.TRANSFER_ANTONIN;
    }
    if (words.some(word => ['amandine', 'ar'].includes(word))) {
      return CATEGORY_IDS.TRANSFER_AMANDINE;
    }
    if (amount > 0) return CATEGORY_IDS.INCOME;
    return CATEGORY_IDS.TRANSFERS;
  }

  // Définir les règles de catégorisation
  const rules = [
    // Alimentation
    { 
      keywords: ['carrefour', 'leclerc', 'auchan', 'lidl', 'aldi', 'intermarche', 'franprix', 'monoprix', 'casino', 'picard', 'bio', 'petit marche', 'super u', 'market'],
      exactMatch: true,
      category: CATEGORY_IDS.GROCERIES 
    },
    { 
      keywords: ['restaurant', 'resto', 'mcdo', 'mcdonald', 'burger', 'pizza', 'sushi', 'kebab', 'syd', 'gallion', 'copains', 'bistrot', 'traiteur'],
      exactMatch: true,
      category: CATEGORY_IDS.RESTAURANT 
    },
    { 
      keywords: ['bar', 'pub', 'café', 'cafe', 'brasserie', 'dog', 'duck', 'biere', 'bière'],
      exactMatch: true,
      category: CATEGORY_IDS.BAR 
    },
    
    // Transport
    { 
      keywords: ['uber', 'taxi', 'vtc', 'bolt', 'heetch', 'chauffeur'],
      exactMatch: false, // Pour matcher "uber.com" par exemple
      category: CATEGORY_IDS.TAXI 
    },
    { 
      keywords: ['sncf', 'ratp', 'navigo', 'metro', 'bus', 'train', 'tram', 'transilien', 'transport'],
      exactMatch: true,
      category: CATEGORY_IDS.PUBLIC_TRANSPORT 
    },
    { 
      keywords: ['essence', 'carburant', 'total', 'shell', 'bp', 'esso', 'station'],
      exactMatch: true,
      category: CATEGORY_IDS.FUEL 
    },
    
    // Logement
    { 
      keywords: ['loyer', 'rent', 'appartement', 'immo', 'location'],
      exactMatch: true,
      category: CATEGORY_IDS.RENT 
    },
    { 
      keywords: ['edf', 'engie', 'electricite', 'gaz', 'veolia', 'suez', 'eau'],
      exactMatch: true, // Changé en true pour éviter les faux positifs
      priority: true, // Ajout d'une priorité pour cette règle
      category: CATEGORY_IDS.UTILITIES 
    },
    { 
      keywords: ['free', 'orange', 'sfr', 'bouygues', 'sosh', 'internet', 'mobile'],
      exactMatch: false,
      category: CATEGORY_IDS.INTERNET 
    },
    { 
      keywords: ['hotel', 'airbnb', 'booking', 'abritel', 'gite', 'chambre', 'logement'],
      exactMatch: false,
      category: CATEGORY_IDS.HOTEL 
    },
    
    // Loisirs
    { 
      keywords: ['cinema', 'theatre', 'concert', 'spectacle', 'musee', 'ugc', 'pathe', 'gaumont', 'mk2', 'exposition'],
      exactMatch: false,
      category: CATEGORY_IDS.ENTERTAINMENT 
    },
    { 
      keywords: ['sport', 'fitness', 'gym', 'piscine', 'basic', 'neoness', 'club', 'salle'],
      exactMatch: false,
      category: CATEGORY_IDS.SPORT 
    },
    { 
      keywords: ['livre', 'fnac', 'cultura', 'gibert', 'librairie', 'book'],
      exactMatch: false,
      category: CATEGORY_IDS.BOOKS 
    },
    { 
      keywords: ['spotify', 'netflix', 'prime', 'disney', 'canal', 'deezer', 'apple', 'abonnement', 'subscription'],
      exactMatch: false,
      category: CATEGORY_IDS.SUBSCRIPTIONS 
    },
    
    // Santé
    { 
      keywords: ['pharmacie', 'medecin', 'docteur', 'hopital', 'dentiste', 'ophtalmo', 'ordonnance', 'consultation'],
      exactMatch: false,
      category: CATEGORY_IDS.HEALTH 
    },
    { 
      keywords: ['mutuelle', 'assurance sante', 'cpam', 'lemonade', 'axa', 'maif', 'matmut'],
      exactMatch: false,
      category: CATEGORY_IDS.INSURANCE 
    },
    { 
      keywords: ['pilule', 'contraception'],
      exactMatch: true,
      category: CATEGORY_IDS.PILL 
    },
    { 
      keywords: ['complement', 'vitamine', 'proteine', 'omega', 'nutrition'],
      exactMatch: true,
      category: CATEGORY_IDS.SUPPLEMENTS 
    },
    
    // Shopping
    { 
      keywords: ['zara', 'uniqlo', 'hm', 'celio', 'jules', 'pull', 'kiabi', 'vetement', 'mode'],
      exactMatch: false,
      category: CATEGORY_IDS.CLOTHING 
    },
    { 
      keywords: ['fnac', 'darty', 'apple', 'samsung', 'boulanger', 'ldlc', 'amazon', 'tech', 'informatique', 'telephone'],
      exactMatch: false,
      category: CATEGORY_IDS.ELECTRONICS 
    },
    { 
      keywords: ['ikea', 'but', 'conforama', 'maisons', 'leroy', 'castorama', 'meuble', 'deco', 'bricolage'],
      exactMatch: false,
      category: CATEGORY_IDS.HOME 
    },
    { 
      keywords: ['sephora', 'marionnaud', 'yves', 'nocibe', 'parfum', 'beaute', 'cosmetique'],
      exactMatch: false,
      category: CATEGORY_IDS.BEAUTY 
    },
    { 
      keywords: ['bijou', 'bijoux', 'swarovski', 'pandora', 'accessoire', 'montre', 'bracelet'],
      exactMatch: false,
      category: CATEGORY_IDS.JEWELRY 
    },
    
    // Vétérinaire
    { 
      keywords: ['veterinaire', 'veto', 'clinique vet', 'animaux', 'animalerie', 'pet'],
      exactMatch: false,
      category: CATEGORY_IDS.VETERINARY 
    },
    
    // Services (déplacé plus bas dans la liste)
    { 
      keywords: ['assurance', 'banque', 'impots', 'poste', 'notaire', 'avocat', 'administration'],
      exactMatch: true, // Changé en true pour éviter les faux positifs avec "service" dans le texte
      category: CATEGORY_IDS.SERVICES 
    }
  ];

  // Appliquer les règles
  // D'abord vérifier les règles prioritaires
  for (const rule of rules) {
    if (rule.priority) {
      if (hasExactKeyword(rule.keywords)) {
        return rule.category;
      }
    }
  }

  // Ensuite appliquer les autres règles
  for (const rule of rules) {
    if (!rule.priority) {
      if (rule.exactMatch) {
        if (hasExactKeyword(rule.keywords)) {
          return rule.category;
        }
      } else {
        if (rule.keywords.some(keyword => cleanDesc.includes(keyword.toLowerCase()))) {
          return rule.category;
        }
      }
    }
  }

  // Catégorisation basée sur le montant
  if (amount > 0) {
    if (hasExactKeyword(['salaire'])) return CATEGORY_IDS.SALARY;
    if (hasExactKeyword(['freelance'])) return CATEGORY_IDS.FREELANCE;
    if (hasExactKeyword(['remboursement'])) return CATEGORY_IDS.REIMBURSEMENTS;
    return CATEGORY_IDS.INCOME;
  }

  // Si aucune catégorie n'a été trouvée
  return CATEGORY_IDS.OTHER;
}
