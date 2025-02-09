# Supabase

Ce dossier contient la configuration et les migrations Supabase pour la base de données.

## Structure

- **migrations/** : Scripts de migration de la base de données
  - `20250208_initial_schema.sql` : Schéma initial
  - `20250208_fix_auth.sql` : Corrections pour l'authentification
  - `20250208_categories_and_groups.sql` : Support des groupes et types de catégories
- **seed/** : Données de test et d'initialisation

## Schéma de Base de Données

### Tables Principales

#### Authentification et Profils
- **profiles**
  - Informations des utilisateurs
  - Lié à `auth.users`
  - Champs : id, email, full_name, avatar_url

#### Transactions et Catégories
- **transactions**
  - Transactions financières
  - Types : expense, income, transfer
  - Champs : amount, description, date, category_id, group_id
- **categories**
  - Catégories de transactions
  - Types : expense, income
  - Support des catégories par défaut
  - Hiérarchie possible (parent_id)

#### Groupes et Partage
- **groups**
  - Groupes de partage de dépenses
  - Champs : name, description
- **group_members**
  - Membres des groupes
  - Rôles : admin, member
- **transaction_shares**
  - Partage des transactions
  - Types de partage : equal, percentage, amount

#### Autres Tables
- **budgets** : Configuration des budgets
- **recurring_transactions** : Transactions récurrentes
- **savings_goals** : Objectifs d'épargne

## Sécurité

### Row Level Security (RLS)

#### Profils
- Lecture : Uniquement son propre profil
- Modification : Uniquement son propre profil

#### Transactions
- Lecture : Transactions personnelles et du groupe
- Modification : Uniquement ses propres transactions

#### Groupes
- Lecture : Membres du groupe
- Modification : Admin et créateur
- Suppression : Admin et créateur

#### Catégories
- Lecture : Catégories par défaut et personnelles
- Modification : Uniquement catégories personnelles

## Migrations

1. Créer une nouvelle migration :
```bash
supabase migration new nom_migration
```

2. Appliquer les migrations :
```bash
supabase db reset
```

3. Vérifier le statut :
```bash
supabase db status
```

## Types de Données

### Enums
- `transaction_type` : expense, income, transfer
- `period_type` : daily, weekly, monthly, yearly
- `split_type` : equal, percentage, amount

### Contraintes
- Clés étrangères avec suppression en cascade où approprié
- Contraintes d'unicité sur les relations
- Validation des montants et pourcentages

## Bonnes Pratiques

1. Versionner toutes les modifications de schéma
2. Tester les migrations avant le déploiement
3. Maintenir la documentation du schéma à jour
4. Suivre les conventions de nommage SQL
5. Utiliser les transactions pour les migrations complexes
6. Toujours définir des politiques RLS appropriées
