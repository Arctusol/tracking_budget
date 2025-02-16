export function extractMerchantFromDescription(description: string): string {
  // Nettoyer la description
  const cleanDesc = description.trim();
  
  // Si c'est une transaction par carte avec date
  if (cleanDesc.toUpperCase().startsWith('CARTE')) {
    // Chercher le pattern "DD/MM" et prendre tout ce qui suit
    const match = cleanDesc.match(/CARTE\s+\d{2}\/\d{2}\s+(.*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Pour les autres types de transactions, garder la logique existante
  const ignoreWords = [
    'paiement', 'par', 'carte', 'virement', 'vers', 'de', 'prelevement', 'retrait',
    'vir', 'inst', 'sepa', 'avec', 'depuis', 'interne', 'eu', 'sarl', '*'
  ];
  
  // Diviser la description en mots
  const words = cleanDesc.toLowerCase().split(/\s+/);
  
  // Filtrer les mots à ignorer et prendre le premier mot restant
  const merchantWords = words.filter(word => !ignoreWords.includes(word));
  
  if (merchantWords.length > 0) {
    // Capitaliser le premier mot
    return merchantWords[0].charAt(0).toUpperCase() + merchantWords[0].slice(1);
  }
  
  return "";
}
