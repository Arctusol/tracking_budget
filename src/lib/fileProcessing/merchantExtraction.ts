export function extractMerchantFromDescription(description: string): string {
  // Nettoyer la description
  const cleanDesc = description.trim().toLowerCase();
  
  // Liste des mots à ignorer
  const ignoreWords = [
    'paiement', 'par', 'carte', 'virement', 'vers', 'de', 'prelevement', 'retrait',
    'vir', 'inst', 'sepa', 'avec', 'depuis', 'interne', 'eu', 'sarl', '*'
  ];
  
  // Diviser la description en mots
  const words = cleanDesc.split(/\s+/);
  
  // Filtrer les mots à ignorer et prendre le premier mot restant
  const merchantWords = words.filter(word => !ignoreWords.includes(word));
  
  if (merchantWords.length > 0) {
    // Capitaliser le premier mot
    return merchantWords[0].charAt(0).toUpperCase() + merchantWords[0].slice(1);
  }
  
  return '';
}
