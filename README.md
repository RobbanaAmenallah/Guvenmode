# GÜVEN MODE — Maison de Prêt-à-Porter Féminin Haut de Gamme

Bienvenue sur le projet officiel **GÜVEN MODE**, une plateforme e-commerce haut de gamme de prêt-à-porter féminin, conçue et développée selon les standards architecturaux de production les plus exigeants.

---

## 1. Identité de Marque & Direction Artistique

- **Nom de la marque :** GÜVEN MODE
- **Secteur :** Prêt-à-porter féminin contemporain de luxe accessible
- **Lien officiel :** [Facebook Güven Mode](https://www.facebook.com/profile.php?id=100064032068005)
- **Palette chromatique :**
  - **Bleu Signature :** `#1598C8`
  - **Bleu Profond d'Interaction :** `#127AA4`
  - **Ivoire Chaud (Fonds) :** `#FAF8F5`
  - **Blanc Pur (Surfaces) :** `#FFFFFF`
  - **Poudre Blush :** `#EAD9D8`
  - **Sable Doux :** `#E8DDD0`
  - **Anthracite Primaire :** `#292B30`
  - **Gris Muted :** `#77747A`
  - **Bordures Subtiles :** `#EAE5E2`
- **Typographie :**
  - **Titres & Identité :** *Cormorant Garamond* (Sérif haute couture)
  - **Corps de texte & UI :** *DM Sans* (Sans-sérif moderne, lisibilité optimale)

---

## 2. Stack Technique

### Frontend (`frontend/`)
- **Framework :** React 18, TypeScript, Vite
- **Styling :** Tailwind CSS avec configuration de tokens luxe
- **Routage :** React Router v7
- **Gestion d'état :** Zustand (panier d'achat avec persistance locale et contrôle de stock en temps réel, session utilisateur, liste d'envies)
- **Requêtes & Cache :** TanStack Query
- **Formulaires & Validation :** React Hook Form, Zod
- **Animations :** Motion for React & Canvas Confetti
- **Analytique & Graphiques :** Recharts (courbes de ventes réelles, top produits)
- **Icônes :** Lucide React

### Backend (`backend/`)
- **Runtime & Serveur :** Node.js, Express.js, TypeScript (ESM)
- **Sécurité :** Helmet, CORS paramétré, validation Zod stricte
- **Authentification :** JWT Supabase Auth + Middleware RBAC (Rôles : `customer`, `admin`, `super_admin`)
- **Architecture :** Contrôleurs, Services, Magasin relationnel transactionnel, Middlewares centralisés
- **Tests :** Vitest (tests d'intégration sur le checkout atomique, gestion de stock et promotions)

### Base de Données (`supabase/`)
- **SGBD :** PostgreSQL (Supabase)
- **Migrations SQL :**
  - `001_initial_schema.sql` : Tables relationnelles complètes, clés primaires, clés étrangères, contraintes de vérification, index de performance
  - `002_rls_policies.sql` : Politiques complètes de sécurité au niveau des lignes (Row Level Security)
  - `003_functions_and_rpc.sql` : Fonctions PL/pgSQL transactionnelles atomiques avec verrouillage de lignes (`SELECT ... FOR UPDATE`) pour empêcher le surstock et les collisions
  - `seed_data.sql` : Données de démonstration réalistes pour la maison Güven Mode (produits avec photos haute résolution, variantes tailles/coloris, stocks, zones de livraison en Tunisie, promotions actives)

---

## 3. Structure du Projet

```
guvenmode/
├── backend/
│   ├── src/
│   │   ├── config/             # Environnement et client Supabase
│   │   ├── controllers/        # Contrôleurs Express (produits, commandes, admin, etc.)
│   │   ├── data/               # Magasin relationnel persistant
│   │   ├── middlewares/        # Authentification JWT, RBAC, gestionnaire d'erreurs
│   │   ├── routes/             # Routes publiques, clients et admin
│   │   ├── services/           # Logique métier (checkout atomique, stocks, commandes)
│   │   ├── types/              # Définitions TypeScript partagées
│   │   ├── utils/              # Générateurs d'identifiants uniques
│   │   └── server.ts           # Point d'entrée de l'API Express
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                # Client HTTP typé
│   │   ├── components/         # Composants réutilisables (Header, Footer, CartDrawer, etc.)
│   │   ├── pages/              # Pages publiques et Espace Client
│   │   │   └── admin/          # Console d'Administration complète (SaaS)
│   │   ├── stores/             # Stores Zustand (Panier, Auth, Wishlist)
│   │   ├── types/              # Types TypeScript du domaine
│   │   ├── App.tsx             # Configuration des routes
│   │   └── main.tsx            # Point d'entrée React
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── package.json
│   └── .env.example
├── supabase/
│   ├── migrations/             # Migrations SQL PostgreSQL Supabase
│   └── seed/                   # Données de catalogue initiales
└── README.md
```

---

## 4. Démarrage Rapide en Local

### Prérequis
- Node.js version 18+ (testé avec Node v24)
- npm version 9+

### Étape 1 : Lancer le Backend Express
```bash
cd backend
npm install
npm run dev
```
Le serveur démarre sur `http://localhost:5000`.  
Vérification santé : `http://localhost:5000/api/health`

### Étape 2 : Lancer le Frontend React
Dans un second terminal :
```bash
cd frontend
npm install
npm run dev
```
L'application storefront est accessible sur `http://localhost:3000`.

---

## 5. Parcours Utilisateur & Démonstration

### Expérience Cliente
1. Ouvrez `http://localhost:3000` pour accéder à la vitrine éditoriale.
2. Naviguez vers la **Boutique** (`/boutique`) ou parcourez les filtres par catégorie, collection, coloris et taille.
3. Ouvrez un produit (ex : *Robe Élégance Azur* à `/produit/robe-elegance-azur`).
4. Sélectionnez la couleur et la taille : notez l'indicateur d'état du stock en temps réel.
5. Ajoutez au panier : le tiroir latéral s'ouvre, calculant la jauge de livraison offerte (seuil : 180 DT).
6. Cliquez sur **Commander** (`/commande`).
7. Renseignez l'adresse de livraison (avec sélection des 24 gouvernorats tunisiens).
8. Testez le code promo `BIENVENUE10` (-10%) ou `GUVEN20` (-20 DT).
9. Confirmez la commande : un numéro unique (ex : `GM-2026-1002`) est généré, les stocks sont réservés de manière atomique, et la page de reçu s'affiche avec confettis et bouton d'impression.

### Expérience Administrateur
1. Rendez-vous sur `http://localhost:3000/connexion`.
2. Cliquez sur **"Accéder en tant qu'Administrateur"** (ou naviguez directement vers `/admin`).
3. Vous accédez au **Tableau de Bord** SaaS indépendant :
   - Indicateurs financiers réels (Chiffre d'affaires net, ventilation par statut).
   - Graphique interactif d'évolution des ventes sur 7 jours.
   - Commandes récentes et alertes de stock faible.
4. Dans **Commandes** (`/admin/commandes`) :
   - Ouvrez la commande passée précédemment.
   - Cliquez sur **Confirmer la commande**, **Mettre en préparation**, ou **Expédier** (déduit physiquement le stock).
   - Testez **Annuler la commande** : le système restitue immédiatement le stock réservé sans duplication !
5. Dans **Stock & Inventaire** (`/admin/stock`) :
   - Visualisez l'état précis du stock physique vs réservé vs disponible.
   - Cliquez sur **Ajuster** pour réapprovisionner une référence et consultez le journal d'audit des mouvements.
6. Dans **Produits** (`/admin/produits`) :
   - Ajoutez une nouvelle robe ou un ensemble avec sa matrice de déclinaisons.
   - Le produit apparaît instantanément sur la vitrine publique.

---

## 6. Exécution des Tests

Les tests unitaires et d'intégration couvrent la réservation atomique de stock, l'idempotence des commandes, le calcul des remises promotionnelles et la restitution de stock en cas d'annulation.

Pour lancer les tests du backend :
```bash
cd backend
npm test
```

---

## 7. Configuration Supabase en Production

Pour connecter l'application à un projet Supabase PostgreSQL hébergé :
1. Créez un projet sur [Supabase](https://supabase.com).
2. Dans le SQL Editor de Supabase, exécutez séquentiellement :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions_and_rpc.sql`
   - `supabase/seed/seed_data.sql`
3. Renseignez les variables d'environnement dans `backend/.env` :
   ```env
   SUPABASE_URL=https://<votre-projet>.supabase.co
   SUPABASE_ANON_KEY=<votre-cle-anon>
   SUPABASE_SERVICE_ROLE_KEY=<votre-cle-service-role>
   ```
4. Dans `frontend/.env` :
   ```env
   VITE_API_URL=https://api.votredomaine.com/api
   ```
