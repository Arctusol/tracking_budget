# Pages

Ce dossier contient les composants de niveau page de l'application.

## Structure

Chaque page est un composant React qui représente une route unique dans l'application.

### Pages Principales

- **Dashboard/** : Page d'accueil et tableau de bord principal
- **Transactions/** : Gestion des transactions
- **Budget/** : Configuration et suivi du budget
- **Reports/** : Rapports et analyses
- **Settings/** : Paramètres utilisateur

## Architecture

- Chaque page est un conteneur qui gère son propre état
- Utilisation des composants réutilisables du dossier `components`
- Intégration avec les services du dossier `lib`

## Bonnes Pratiques

1. Garder la logique métier dans des hooks personnalisés
2. Séparer la logique de récupération des données de la présentation
3. Implémenter le chargement progressif pour les grandes pages
4. Gérer correctement les états de chargement et d'erreur
