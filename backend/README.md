# Backend FastAPI pour Tracking Budget

Ce backend FastAPI va gérer toute la logique d'interaction avec l'API OpenAI qui était précédemment gérée côté frontend.

## Structure du Projet

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Point d'entrée de l'application FastAPI
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Configuration (variables d'environnement)
│   │   └── constants.py     # Constantes (catégories, etc.)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── dependencies.py  # Dépendances FastAPI (auth, etc.)
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── category.py  # Routes pour la détection de catégories
│   ├── models/
│   │   ├── __init__.py
│   │   └── category.py      # Modèles Pydantic pour la validation
│   └── services/
│       ├── __init__.py
│       └── openai.py        # Service OpenAI
├── tests/
│   ├── __init__.py
│   ├── test_api/
│   │   └── test_category.py
│   └── test_services/
│       └── test_openai.py
├── requirements.txt         # Dépendances Python
├── requirements-dev.txt     # Dépendances de développement
└── .env                    # Variables d'environnement
```

## Plan de Migration

### 1. Développement du Backend (À faire en premier)

#### 1.1 Configuration
1. **Variables d'Environnement** (`app/core/config.py`)
   ```python
   class Settings:
       AZURE_OPENAI_ENDPOINT: str
       AZURE_OPENAI_API_KEY: str
       AZURE_OPENAI_DEPLOYMENT: str
   ```

2. **Constantes** (`app/core/constants.py`)
   - Migrer les catégories depuis `fileProcessing/constants.ts`
   - Définir les constantes pour les prompts OpenAI

#### 1.2 Modèles de Données (`app/models/category.py`)
1. **Request Models**
   ```python
   class CategoryDetectionRequest(BaseModel):
       description: str
   ```
2. **Response Models**
   ```python
   class CategoryResponse(BaseModel):
       category: str
   ```

#### 1.3 Service OpenAI (`app/services/openai.py`)
1. **Migrer la logique depuis `openai.service.ts`**
   - Implémenter la classe `OpenAIService`
   - Gérer la connexion à Azure OpenAI
   - Implémenter la détection de catégorie
   - Ajouter la gestion d'erreurs

#### 1.4 API Endpoints (`app/api/routes/category.py`)
1. **Endpoint de Détection**
   ```python
   @router.post("/detect-category")
   async def detect_category(
       request: CategoryDetectionRequest,
       openai_service: OpenAIService = Depends()
   ) -> CategoryResponse:
   ```

#### 1.5 Tests
1. **Tests Unitaires**
   - Service OpenAI
   - Validation des modèles
2. **Tests d'Intégration**
   - Endpoints API
   - Connexion OpenAI

### 2. Tests et Validation du Backend

1. **Tests Manuels**
   - Tester l'endpoint avec Postman/cURL
   - Vérifier les réponses et codes d'erreur
   - Valider le format des réponses

2. **Documentation API**
   - Générer la documentation Swagger
   - Documenter les codes d'erreur
   - Ajouter des exemples de requêtes

### 3. Migration du Frontend (À faire après validation du backend)

#### 3.1 Préparation
1. **Créer une branche de migration**
   ```bash
   git checkout -b feature/backend-migration
   ```

2. **Sauvegarder les fichiers à supprimer**
   ```bash
   mkdir backup
   cp src/lib/services/openai.service.ts backup/
   cp src/routes/api/detect-category/+server.ts backup/
   ```

#### 3.2 Modifications du Frontend
1. **Mise à jour de l'API Client** (`src/lib/api/category.api.ts`)
   ```typescript
   const BACKEND_URL = 'http://localhost:8000';
   
   export async function detectCategory(description: string): Promise<string> {
     const response = await fetch(`${BACKEND_URL}/api/detect-category`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ description })
     });
     // ...
   }
   ```

2. **Configuration CORS dans Vite** (`vite.config.ts`)
   ```typescript
   export default defineConfig({
     server: {
       proxy: {
         '/api': {
           target: 'http://localhost:8000',
           changeOrigin: true
         }
       }
     }
   });
   ```

#### 3.3 Nettoyage
1. **Supprimer les fichiers**
   - `src/lib/services/openai.service.ts`
   - `src/routes/api/detect-category/+server.ts`

2. **Nettoyer les imports**
   - Retirer les imports inutilisés
   - Mettre à jour les chemins d'importation

#### 3.4 Tests Frontend
1. **Tests Fonctionnels**
   - Tester le bouton "Détecter"
   - Vérifier les messages d'erreur
   - Valider le comportement avec/sans backend

## Installation et Démarrage

### Backend
1. **Environnement Python**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

2. **Installation**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # Pour le développement
   ```

3. **Configuration**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos clés API
   ```

4. **Démarrage**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend
1. **Installation**
   ```bash
   npm install
   ```

2. **Démarrage**
   ```bash
   npm run dev
   ```

## Points d'Attention

### 1. Sécurité
- Implémenter la validation des requêtes
- Configurer CORS correctement
- Protéger les clés API
- Ajouter des rate limits

### 2. Performance
- Mettre en cache les résultats fréquents
- Gérer les timeouts des appels API
- Optimiser les prompts OpenAI

### 3. Maintenance
- Ajouter des logs détaillés
- Implémenter des tests unitaires
- Documenter l'API avec Swagger
- Mettre en place un monitoring

### 4. Déploiement
- Préparer les fichiers Docker
- Configurer CI/CD
- Planifier la stratégie de backup
