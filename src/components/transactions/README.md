# Composants de Gestion des Transactions

Ce dossier contient les composants React nécessaires à la gestion des transactions dans l'application de suivi budgétaire.

## Structure des Données

### Transaction

Une transaction est définie avec les champs suivants :

```typescript
{
  id: string;                    // Identifiant unique UUID
  amount: number;               // Montant de la transaction
  type: 'expense' | 'income' | 'transfer';  // Type de transaction
  description: string;          // Description de la transaction
  date: string;                // Date au format YYYY-MM-DD
  category_id?: string;        // ID de la catégorie (optionnel)
  merchant?: string;           // Nom du marchand (optionnel)
  location?: Location;         // Informations de localisation (optionnel)
  created_by: string;          // ID de l'utilisateur créateur
  created_at: string;          // Date de création
  updated_at: string;          // Date de dernière modification
}
```

### Localisation

```typescript
{
  address?: string;            // Adresse complète
  city?: string;              // Ville
  country?: string;           // Pays
  coordinates?: {             // Coordonnées géographiques
    latitude: number;
    longitude: number;
  };
}
```

## Composants

### TransactionForm

Composant de formulaire pour la création et la modification des transactions.

**Props:**
- `transaction?: Transaction` - Transaction existante à modifier
- `categories: TransactionCategory[]` - Liste des catégories disponibles
- `onSuccess: () => void` - Callback appelé après une sauvegarde réussie

**Fonctionnalités:**
- Validation des champs avec Zod
- Support pour les montants positifs
- Sélection de date avec calendrier
- Sélection de catégorie
- Gestion des types de transaction (dépense/revenu/transfert)

### TransactionFilters

Composant de filtrage avancé pour la liste des transactions.

**Props:**
- `categories: TransactionCategory[]` - Liste des catégories disponibles
- `onFiltersChange: (filters: TransactionFilters) => void` - Callback appelé lors du changement des filtres

**Filtres disponibles:**
- Période (date de début/fin)
- Montant (min/max)
- Type de transaction
- Catégorie
- Recherche textuelle (description/marchand)

## Services

Le service `transaction.service.ts` fournit les fonctions suivantes :

```typescript
// Récupération des transactions
getTransactions(userId: string): Promise<Transaction[]>
getTransactionsByFilters(userId: string, filters: TransactionFilters): Promise<Transaction[]>

// CRUD Transactions
createTransaction(transaction: TransactionInput): Promise<Transaction>
updateTransaction(id: string, updates: Partial<Transaction>, userId: string): Promise<Transaction>
deleteTransaction(id: string, userId: string): Promise<void>

// Gestion des catégories
getCategories(userId: string): Promise<TransactionCategory[]>
createCategory(category: Omit<TransactionCategory, "id">): Promise<TransactionCategory>
updateCategory(id: string, updates: Partial<TransactionCategory>, userId: string): Promise<TransactionCategory>
deleteCategory(id: string, userId: string): Promise<void>
```

## Sécurité

- Toutes les opérations sont protégées par Row Level Security (RLS) dans Supabase
- Les utilisateurs ne peuvent voir et modifier que leurs propres transactions
- La validation des données est effectuée côté client (Zod) et côté serveur (contraintes PostgreSQL)

## Utilisation

```tsx
import { TransactionForm } from './TransactionForm';
import { TransactionFilters } from './TransactionFilters';

// Exemple d'utilisation du formulaire
function MyComponent() {
  const handleSuccess = () => {
    // Rafraîchir la liste des transactions
  };

  return (
    <TransactionForm
      categories={categories}
      onSuccess={handleSuccess}
    />
  );
}

// Exemple d'utilisation des filtres
function MyListComponent() {
  const handleFiltersChange = (filters: TransactionFilters) => {
    // Appliquer les filtres à la liste
  };

  return (
    <TransactionFilters
      categories={categories}
      onFiltersChange={handleFiltersChange}
    />
  );
}
```
