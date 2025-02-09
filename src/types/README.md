# Types

Ce dossier contient les définitions de types TypeScript globales de l'application.

## Structure

- **models/** : Types pour les modèles de données
- **api/** : Types pour les réponses et requêtes API
- **utils/** : Types utilitaires partagés

## Types Principaux

### Modèles de Données
```typescript
interface Transaction {
  id: string;
  amount: number;
  date: Date;
  category: string;
  description?: string;
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
}
```

## Bonnes Pratiques

1. Utiliser des interfaces pour les objets
2. Préférer les types pour les unions et les utilitaires
3. Documenter les types complexes
4. Maintenir la cohérence des noms
5. Éviter la duplication des types
