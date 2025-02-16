# Calcul du Budget Prévisionnel

## Principes de calcul

### 1. Moyenne Mensuelle
- La moyenne est calculée sur les 6 derniers mois
- Pour chaque catégorie, on calcule : `total des dépenses / nombre de mois avec des dépenses`
- **Important** : On ne divise PAS par 6 systématiquement car certaines dépenses sont périodiques (ex: tous les 3 mois)

### 2. Tendance
- Compare la moyenne des 3 derniers mois avec la moyenne des 3 mois précédents
- Formule : `((moyenne_3_derniers_mois - moyenne_3_mois_precedents) / moyenne_3_mois_precedents) * 100`
- Indique si la dépense a tendance à augmenter ou diminuer
- Une tendance positive (+%) signifie une augmentation des dépenses
- Une tendance négative (-%) signifie une diminution des dépenses

### 3. Estimation
- Basée sur la moyenne mensuelle ajustée par la tendance
- Formule : `moyenne_mensuelle * (1 + (tendance / 100))`
- Prend en compte la saisonnalité si des données historiques sont disponibles
- Pour les dépenses périodiques, l'estimation est ajustée selon la fréquence habituelle

### 4. Ajustement
- Permet de modifier manuellement l'estimation pour le mois à venir
- Utile pour :
  - Corriger une estimation qui ne correspond pas à la réalité attendue
  - Prendre en compte des événements exceptionnels
  - Définir des objectifs budgétaires

## Exemples

### Dépense Mensuelle Régulière
- Courses alimentaires : apparaissent chaque mois
- Moyenne calculée sur le nombre total de mois (6)
- Tendance reflète l'évolution régulière des prix

### Dépense Périodique
- Assurance : payée tous les 3 mois
- Moyenne calculée sur le nombre de mois où il y a eu un paiement
- L'estimation tient compte de la périodicité

### Dépense Irrégulière
- Restaurant : fréquence variable
- Moyenne calculée sur les mois avec des dépenses
- La tendance aide à comprendre l'évolution des habitudes
