graph TD
    %% File Processing Module
    A[index.ts] --> B[pdfProcessor.ts]
    A --> C[csvProcessor.ts]
    A --> D[imageProcessor.ts]
    A --> E[textProcessor.ts]
    
    B --> F[categoryDetection.ts]
    B --> G[merchantExtraction.ts]
    B --> H[types.ts]
    B --> I[constants.ts]
    
    F --> H
    G --> H
    
    %% Services
    subgraph "Services"
        S1[bank-statement.service.ts]
        S2[transaction.service.ts]
        S3[category.service.ts]
        S4[import.service.ts]
        S5[pattern.service.ts]
    end
    
    B --> S1
    B --> S2
    F --> S3
    A --> S4
    G --> S5
    
    %% Components
    subgraph "Components"
        C1[ProcessingPreview.tsx]
        C2[TransactionDetailsModal.tsx]
        C3[ImportForm.tsx]
    end
    
    S4 --> C1
    S4 --> C3
    B --> C1
    B --> C2
    
    %% Database
    subgraph "Database Tables"
        D1[bank_statements]
        D2[transactions]
        D3[categories]
        D4[patterns]
    end
    
    S1 --> D1
    S2 --> D2
    S3 --> D3
    S5 --> D4
    
    %% External Services
    subgraph "Services Externes"
        J[Azure Document Intelligence]
    end
    
    B --> J
    
    %% Types
    subgraph "Types"
        T1[database.ts]
        T2[transaction.ts]
    end
    
    H --> T1
    H --> T2
```

## Structure des fichiers

### Fichiers principaux

- `index.ts` : Point d'entrée du module, expose les fonctions publiques pour le traitement des fichiers
- `pdfProcessor.ts` : Traitement des relevés bancaires PDF via Azure Document Intelligence
- `csvProcessor.ts` : Traitement des fichiers CSV
- `imageProcessor.ts` : Traitement des images (OCR)
- `textProcessor.ts` : Traitement des fichiers texte

### Fichiers de support

- `types.ts` : Définitions TypeScript pour les transactions et les relevés bancaires
- `constants.ts` : Constantes utilisées dans le traitement des fichiers
- `categoryDetection.ts` : Logique de détection automatique des catégories
- `merchantExtraction.ts` : Extraction des commerçants depuis les descriptions

## Flux de traitement PDF

1. **Réception du fichier**
   - Le fichier PDF est reçu via `processPDF()` dans `pdfProcessor.ts`
   - Conversion en base64 pour l'envoi à Azure

2. **Analyse du document**
   - Utilisation d'Azure Document Intelligence pour extraire :
     - Tables de transactions
     - Informations du relevé (titulaire, numéros, dates)
     - Soldes et montants

3. **Extraction des données**
   - Extraction des métadonnées du relevé :
     - Nom du document
     - Numéro de relevé
     - Date d'arrêté
     - Titulaire du compte
     - Soldes (initial/final)
   - Extraction des transactions :
     - Date et date de valeur
     - Description
     - Montants (débit/crédit)

4. **Enrichissement des données**
   - Détection automatique des catégories via `categoryDetection.ts`
   - Extraction des commerçants via `merchantExtraction.ts`
   - Calcul des totaux et de la balance

5. **Stockage**
   - Création d'un enregistrement dans la table `bank_statements`
   - Création des transactions liées dans la table `transactions`
   - Association des transactions au relevé via `bank_statement_id`

## Types de données

### ProcessedTransaction
```typescript
interface ProcessedTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  category_id?: string;
  merchant?: string;
  metadata?: {
    date_valeur?: string;
    numero_releve?: string;
    titulaire?: string;
    document_name?: string;
    date_arrete?: string;
    solde_ancien?: string;
    solde_nouveau?: string;
    bank_statement_id?: string;
  };
}
```

### BankStatement
```typescript
interface BankStatement {
  id: string;
  created_at: string;
  created_by: string;
  document_name: string;
  statement_number: string;
  statement_date: string;
  account_holder: string;
  opening_balance: number;
  closing_balance: number;
  total_debits: number;
  total_credits: number;
  net_balance: number;
}
```

## Dépendances externes

- **Azure Document Intelligence** : Service d'extraction de données depuis les PDFs
- **Supabase** : Stockage des données et gestion des relations
- **UUID** : Génération des identifiants uniques

## Sécurité

- Les données sensibles (numéro de compte, IBAN, BIC) ne sont pas extraites
- RLS (Row Level Security) appliqué sur les tables `bank_statements` et `transactions`
- Validation des types de fichiers et des formats

## Utilisation

```typescript
import { processPDF } from '@/lib/fileProcessing';

// Traitement d'un relevé bancaire PDF
const transactions = await processPDF(file);

// Les transactions sont retournées avec leurs métadonnées
// et peuvent être affichées dans l'interface utilisateur
// avant d'être enregistrées en base de données
```

## Tests et validation

- Validation des formats de dates
- Vérification des totaux et balances
- Détection des doublons
- Gestion des erreurs et exceptions

## Maintenance

Pour ajouter le support d'un nouveau format de relevé :

1. Créer un nouveau processeur dans le dossier approprié
2. Mettre à jour `index.ts` pour exposer le nouveau processeur
3. Implémenter la logique d'extraction spécifique
4. Mettre à jour les types si nécessaire
5. Ajouter les tests correspondants
