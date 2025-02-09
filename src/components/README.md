# Components

Ce dossier contient tous les composants réutilisables de l'application.

## Structure

Les composants sont organisés selon leur fonction et leur utilisation :

### 🎨 UI Components
- **ui/** : Composants d'interface utilisateur de base
  - Button, Input, Select, Dialog, etc.
  - Basés sur Radix UI pour l'accessibilité
  - Stylisés avec Tailwind CSS

### 📱 Layout Components
- **layout/**
  - `Layout.tsx` : Layout principal avec navigation
  - `Navigation.tsx` : Barre de navigation latérale
  - Responsive et adaptable

### 🔐 Authentication Components
- **auth/**
  - `AuthForm.tsx` : Formulaire d'authentification
  - `ProtectedRoute.tsx` : Protection des routes

### 📊 Dashboard Components
- **dashboard/**
  - `Dashboard.tsx` : Dashboard personnel
  - `GroupDashboard.tsx` : Dashboard de groupe
  - `ExpenseChart.tsx` : Graphiques de dépenses
  - `ExpenseList.tsx` : Liste des transactions

### 👥 Group Components
- **groups/**
  - `GroupList.tsx` : Liste des groupes
  - `CreateGroupDialog.tsx` : Création de groupe
  - Gestion des membres et partage

### 💰 Transaction Components
- **transactions/**
  - `TransactionForm.tsx` : Formulaire de transaction
  - Support des catégories et groupes
  - Validation avec Zod

## Hooks Personnalisés

### useAuth
```typescript
const { user, signIn, signUp, signOut } = useAuth();
```
- Gestion de l'authentification
- Contexte utilisateur
- Protection des routes

### useGroups
```typescript
const { groups, createGroup, addMember } = useGroups();
```
- Gestion des groupes
- CRUD des membres
- Partage de transactions

## État Global

### AuthContext
```typescript
interface AuthContext {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

## Bonnes Pratiques

1. **Architecture des Composants**
   - Composants fonctionnels avec hooks
   - Props typées avec TypeScript
   - Séparation des responsabilités

2. **Performance**
   - Utilisation de `useMemo` et `useCallback`
   - Lazy loading des composants lourds
   - Optimisation des re-rendus

3. **Accessibilité**
   - Composants Radix UI pour l'accessibilité
   - Labels et ARIA attributes
   - Support du clavier

4. **Tests**
   - Tests unitaires pour la logique
   - Tests d'intégration pour les workflows
   - Stories Storybook pour le développement

## Convention de Nommage

- **Fichiers**
  - PascalCase pour les composants : `GroupList.tsx`
  - camelCase pour les utilitaires : `useAuth.ts`
  - `.test.tsx` pour les tests
  - `.stories.tsx` pour Storybook

- **Composants**
  - Noms descriptifs : `CreateGroupDialog`
  - Props préfixées : `onGroupCreated`, `isLoading`

- **Styles**
  - Classes Tailwind organisées
  - Variables CSS pour les thèmes
  - Préfixes pour les variants

## Exemples d'Utilisation

### Création d'un Groupe
```tsx
<CreateGroupDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onGroupCreated={handleGroupCreated}
/>
```

### Protection d'une Route
```tsx
<ProtectedRoute>
  <GroupDashboard />
</ProtectedRoute>
```

### Formulaire de Transaction
```tsx
<TransactionForm
  onSubmit={handleSubmit}
  categories={categories}
  groups={groups}
/>
