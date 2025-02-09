# Import System Documentation

## Overview
Le système d'import est une fonctionnalité complète permettant d'importer des transactions financières à partir de différents formats de fichiers (CSV, PDF, et images). Il inclut le traitement des fichiers, la validation des données, et le suivi de l'historique des imports.

## Architecture

### Structure des fichiers
```
src/
├── components/import/
│   ├── ImportContainer.tsx    # Conteneur principal de l'import
│   ├── ImportHistory.tsx      # Affichage de l'historique des imports
│   └── ProcessingPreview.tsx  # Prévisualisation du traitement
├── lib/
│   ├── fileProcessing.ts      # Logique de traitement des fichiers
│   ├── pdfProcessing.ts       # Traitement spécifique des PDF
│   └── services/
│       └── import.service.ts  # Services d'interaction avec la base de données
├── pages/
│   └── import.tsx             # Page d'import
└── types/
    └── import.ts              # Types et interfaces
```

## Fonctionnalités principales

### 1. Traitement des fichiers
- Support multi-format :
  - CSV : Analyse avec Papa Parse
  - PDF : Extraction structurée des relevés bancaires
  - Images : OCR via Tesseract.js
- Validation et nettoyage automatique des données
- Génération d'IDs uniques pour chaque transaction

### 2. Gestion des imports
- Suivi de l'état des imports (pending, completed, failed)
- Historique complet des imports par utilisateur
- Interface de suivi en temps réel avec barre de progression

### 3. Stockage des données
- Utilisation de Supabase pour la persistance
- Table `import_history` pour le suivi des imports
- Stockage sécurisé avec association utilisateur

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
2. `ImportContainer` gère le processus d'import :
   - Initialise le traitement
   - Met à jour la progression
   - Gère les erreurs
3. `fileProcessing.ts` traite le fichier selon son type
4. Les transactions sont validées et nettoyées
5. L'import est enregistré dans l'historique
6. L'utilisateur peut suivre l'état dans `ImportHistory`

## Gestion des erreurs
- Validation des formats de fichiers
- Vérification des données obligatoires
- Messages d'erreur utilisateur explicites
- Journalisation des erreurs pour le débogage

## Interface utilisateur
- Zone de dépôt de fichiers intuitive
- Barre de progression en temps réel
- Notifications toast pour les événements importants
- Vue tabulaire de l'historique des imports
