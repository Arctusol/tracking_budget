# Import System Documentation

## Overview
Le système d'import est une fonctionnalité complète permettant d'importer des transactions financières à partir de différents formats de fichiers (CSV, PDF, et images). Il inclut le traitement des fichiers, la validation des données, la détection automatique des catégories et le suivi de l'historique des imports.

## Architecture

### Structure des fichiers
```
src/
├── components/import/
│   ├── ImportContainer.tsx      # Conteneur principal de l'import
│   ├── ImportHistory.tsx        # Affichage de l'historique des imports
│   ├── ProcessingPreview.tsx    # Prévisualisation du traitement
│   ├── CategoryMappingTable.tsx # Table de mapping des catégories
│   └── FileUploadZone.tsx       # Zone de dépôt des fichiers
├── lib/
│   ├── fileProcessing/
│   │   ├── index.ts            # Point d'entrée du traitement
│   │   ├── pdfProcessor.ts     # Traitement des PDF avec Azure AI
│   │   ├── csvProcessor.ts     # Traitement des fichiers CSV
│   │   ├── imageProcessor.ts   # Traitement OCR des images
│   │   ├── categoryDetection.ts # Détection automatique des catégories
│   │   └── merchantExtraction.ts # Extraction des commerçants
│   └── services/
│       └── import.service.ts    # Services d'interaction avec la base de données
├── pages/
│   └── import.tsx              # Page d'import
└── types/
    └── import.ts               # Types et interfaces
```

## Fonctionnalités principales

### 1. Traitement des fichiers
- Support multi-format :
  - CSV : Analyse avec Papa Parse
  - PDF : Extraction structurée avec Azure AI Document Intelligence
  - Images : OCR via Tesseract.js
- Validation et nettoyage automatique des données
- Génération d'IDs uniques pour chaque transaction
- Extraction intelligente des métadonnées (dates, numéros de relevé, titulaire)

### 2. Détection automatique des catégories
- Système de règles basé sur des mots-clés pour plus de 20 catégories
- Gestion des cas spéciaux :
  - Virements entre comptes
  - Revenus (salaire, freelance)
  - Dépenses récurrentes (loyer, abonnements)
- Support des variations orthographiques et des pluriels
- Priorités configurables pour éviter les faux positifs

### 3. Gestion des imports
- Suivi de l'état des imports (pending, completed, failed)
- Historique complet des imports par utilisateur
- Interface de suivi en temps réel avec barre de progression
- Prévisualisation des transactions avant import
- Table de mapping pour ajuster les catégories

### 4. Stockage des données
- Utilisation de Supabase pour la persistance
- Table `import_history` pour le suivi des imports
- Stockage sécurisé avec association utilisateur
- Support des métadonnées enrichies

## Types de données

### ImportRecord
```typescript
interface ImportRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  status: "pending" | "completed" | "failed";
  transaction_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
```

### ProcessedTransaction
```typescript
interface ProcessedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  merchant?: string;
  location?: {
    lat: number;
    lng: number;
  };
  metadata?: {
    date_valeur: string;
    numero_releve: string;
    titulaire: string;
  };
}
```

## Flux d'import

1. L'utilisateur dépose un fichier dans le `FileUploadZone`
2. Le système détecte automatiquement le type de fichier
3. Le processeur approprié (PDF, CSV, Image) est utilisé pour l'extraction
4. Les transactions sont enrichies avec :
   - Détection automatique des catégories
   - Extraction des commerçants
   - Métadonnées du relevé
5. L'utilisateur peut prévisualiser et ajuster les catégories
6. Les transactions sont enregistrées en base de données
7. L'historique d'import est mis à jour

## Gestion des erreurs
- Validation des formats de fichiers
- Vérification des données obligatoires
- Messages d'erreur utilisateur explicites
- Journalisation des erreurs pour le débogage
- Gestion des timeouts pour les gros fichiers

## Bonnes pratiques
- Utilisation de TypeScript pour la sécurité des types
- Architecture modulaire pour faciliter les évolutions
- Tests unitaires pour les fonctions critiques
- Documentation des APIs et des composants
- Gestion des performances pour les gros fichiers
