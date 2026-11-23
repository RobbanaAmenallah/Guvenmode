# GÜVEN MODE — Plateforme E-Commerce Luxe & Haute Couture

Bienvenue sur le dépôt officiel de la maison **GÜVEN MODE**, une plateforme e-commerce haut de gamme de prêt-à-porter féminin contemporain, conçue et développée selon les standards architecturaux de production les plus stricts : sécurité renforcée, architecture découplée, synchronisation PostgreSQL temps réel, streaming vidéo zéro-latence et console d'administration SaaS complète.

---

## 🌐 Liens Officiels & Déploiement en Production

- **Boutique en Ligne (Production) :** [https://guvenmode-frontend.onrender.com](https://guvenmode-frontend.onrender.com)
- **API Backend Express (Production) :** [https://guvenmode-backend.onrender.com](https://guvenmode-backend.onrender.com)
- **Console d'Administration :** [https://guvenmode-frontend.onrender.com/admin](https://guvenmode-frontend.onrender.com/admin)
- **Conciergerie & Messages Clients :** [https://guvenmode-frontend.onrender.com/admin/messages](https://guvenmode-frontend.onrender.com/admin/messages)
- **Dépôt GitHub :** [RobbanaAmenallah/Guvenmode](https://github.com/RobbanaAmenallah/Guvenmode)
- **Base de Données & CDN :** Supabase PostgreSQL hébergé (`ggxtshlqpdibwdgzhlmq.supabase.co`)
- **Réseaux Sociaux :** [Facebook Güven Mode](https://www.facebook.com/search/top?q=guven%20mode) | [Instagram Güven Mode](https://www.instagram.com/guven_mode/)

---

## 1. Identité Visuelle & Direction Artistique

La direction artistique incarne l'élégance sobre, la précision des coupes architecturales et le mystère de la femme moderne.

- **Palette Chromatique Luxury Editorial :**
  - **Bleu Signature :** `#1598C8` (Accents, boutons d'action, branding)
  - **Bleu Profond d'Interaction :** `#127AA4` (Survols, focus)
  - **Ivoire Chaud (Fonds) :** `#FAF8F5` (Teinte naturelle apaisante)
  - **Blanc Pur (Surfaces) :** `#FFFFFF` (Cartes, modales, fiches produits)
  - **Poudre Blush :** `#EAD9D8` (Touches féminines délicates)
  - **Sable Doux :** `#E8DDD0` (Badges et séparateurs)
  - **Anthracite Primaire :** `#292B30` (Typographie principale)
  - **Gris Muted :** `#77747A` (Descriptions, sous-titres)
  - **Bordures Subtiles :** `#EAE5E2` (Contours fins élégants)
- **Typographie :**
  - **Titres & Identité :** *Cormorant Garamond* (Sérif d'inspiration haute couture italienne/parisienne)
  - **Textes Courants & UI :** *DM Sans* (Sans-sérif moderne et géométrique, lisibilité optimale)

---

## 2. Architecture Technique

Le projet adopte une séparation stricte des responsabilités (SOC) :

```
                        ┌────────────────────────────────────────────────────────┐
                        │              Client Navigateur / Mobile                │
                        │        (React 18, TypeScript, Tailwind CSS, Vite)       │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │
                       HTTP / HTTPS REST           │ WebSocket Supabase Realtime
                     (Client API Typé Axios)       │ (Événements Postgres direct)
                                                   │
                        ┌──────────────────────────▼─────────────────────────────┐
                        │                   Backend Node.js                      │
                        │           (Express, TypeScript, ESM, Helmet)           │
                        ├────────────────────────────────────────────────────────┤
                        │ - Middlewares Sécurité (CORS strict, Rate Limiting)    │
                        │ - RBAC (JWT Supabase + is_admin)                       │
                        │ - Upload Controller (Validation magic bytes Multer)    │
                        │ - Services métier (Checkout atomique, Stock, Commandes)│
                        └──────────────────────────┬─────────────────────────────┘
                                                   │
                                      Connexion SSL Service Role
                                                   │
                        ┌──────────────────────────▼─────────────────────────────┐
                        │             Supabase Cloud (PostgreSQL 15)             │
                        ├────────────────────────────────────────────────────────┤
                        │ - 21 Tables Relationnelles avec Contraintes & RLS      │
                        │ - Supabase Storage CDN (Bucket product-media)          │
                        │ - Supabase Realtime (WebSockets sur notifications/msg) │
                        └────────────────────────────────────────────────────────┘
```

### Frontend (`frontend/`)
- **Framework :** React 18 avec TypeScript et Vite (bundling optimisé gzip ~230 kB).
- **Styling :** Tailwind CSS avec tokens personnalisés (couleurs de marque, ombres `shadow-luxury`, animations douces).
- **Routage :** React Router v7 avec gardes d'authentification (`AdminLayout` et `StorefrontLayout`).
- **Gestion d'État Global :** Zustand :
  - `useCartStore` : Panier persistant avec vérification atomique des stocks.
  - `useAuthStore` : Gestion JWT, profil utilisateur et droits administrateur.
  - `useWishlistStore` : Favoris en stockage local.
- **Requêtes & Cache :** TanStack Query (React Query) pour l'invalidation intelligente des données.
- **Streaming & Médias :**
  - Préchargement intelligent (`preload="auto"`) et accélération matérielle GPU (`transform: translateZ(0)`).
  - Contrôles personnalisés (lecture, pause, audio mute/unmute, bascule instantanée vidéo/photos HD, mode plein écran).
- **Temps Réel :** Client Supabase Realtime WebSocket pour l'actualisation sans rechargement des messages de conciergerie et des notifications.

### Backend (`backend/`)
- **Environnement d'Exécution :** Node.js 18+ (compatible Node v24), Express.js en TypeScript ESM natif.
- **Sécurité Industrielle (Hardening) :**
  - `helmet` : En-têtes HTTP sécurisés (CSP, HSTS, X-Content-Type-Options).
  - `express-rate-limit` : Limiteur d'appels distribué (global, anti force-brute sur l'authentification, anti énumération de codes promos, limiteur d'upload).
  - CORS Allowlist stricte : Rejet automatique des origines non autorisées avec code HTTP `403`.
  - Validation binaire par *Magic Bytes* : Vérification des signatures binaires des fichiers téléversés (JPEG, PNG, WebP, MP4, MOV, WebM).
  - Masquage des erreurs en production : Aucune trace d'exécution interne (stack trace) n'est transmise aux clients.
- **Logique Métier Transactionnelle :**
  - Traitement atomique du checkout avec réservation de stock immédiate.
  - Gestion idempotente des paiements à la livraison (Cash on Delivery).
  - Restitution automatique des stocks réservés en cas d'annulation de commande.

---

## 3. Base de Données Supabase PostgreSQL (21 Tables Dépolluées)

La base de données a été purgée de toutes les tables inutilisées pour ne conserver que les **21 tables indispensables** fonctionnant en liaison directe :

| Table | Rôle & Utilité dans Güven Mode |
| :--- | :--- |
| `products` | Fiches maîtresses des produits (titre, slug, prix de base, prix barré, description, composition, statut). |
| `product_variants` | Matrice des déclinaisons (tailles : 36, 38, 40, 42, coloris, codes hexadécimaux, SKU unique). |
| `product_images` | Galerie des photos hébergées sur le CDN Supabase Storage, ordre d'affichage, flag image principale. |
| `product_videos` | Vidéos haute définition 1080p pour les fiches produits (ex : Robe Émeraude Impériale). |
| `categories` | Univers et catégories de confection (Robes de Soirée, Tailleurs, Manteaux, etc.). |
| `collections` | Collections thématiques et capsules saisonnières (L'Émeraude Royale, Soirée Privée, etc.). |
| `inventory` | Stock physique en temps réel par variante : quantité en main, quantité réservée, stock disponible. |
| `inventory_movements`| Journal d'audit de chaque variation de stock (commande cliente, réapprovisionnement, annulation). |
| `orders` | Commandes clientes : numéro de commande (`GM-2026-XXXX`), coordonnées, montants, état, mode de règlement. |
| `order_items` | Lignes d'articles rattachées à chaque commande (produit, taille, couleur, prix unitaire, total). |
| `order_status_history`| Traçabilité des statuts d'expédition (*En attente → Confirmée → En préparation → Expédiée*). |
| `carts` | Paniers d'achat actifs des clientes (visiteuses ou connectées). |
| `cart_items` | Articles présents dans les paniers avec quantité sélectionnée. |
| `contact_messages` | **Table dédiée Conciergerie :** Messages clients, nom, email, **numéro de téléphone**, sujet, statut (*unread*, *read*, *replied*). |
| `notifications` | Alertes de l'administration et flux d'événements synchronisés en WebSockets temps réel. |
| `promotions` | Codes promotionnels actifs, type de remise (% ou montant fixe en DT), date de validité, seuil minimum d'achat. |
| `site_settings` | Configuration dynamique du site : textes d'accroche hero banner, bandeau défilant, coordonnées du showroom. |
| `newsletter_subscriptions` | Adresses email des abonnées à la lettre d'information Güven Mode. |
| `profiles` | Profils clients étendus (nom complet, numéro de téléphone, avatar). |
| `user_roles` | Contrôle d'accès basé sur les rôles (RBAC) liant `auth.users` aux rôles `admin` ou `customer`. |
| `shipping_methods` | Transporteurs et grilles de frais d'expédition sur le territoire tunisien. |

---

## 4. Fonctionnalités Clés & Expérience Utilisateur

### 🛍️ Côté Boutique (Expérience Cliente)
- **Vitrine Haute Couture :** Page d'accueil éditoriale, sélections exclusives, univers de collections.
- **Catalogue & Filtres Précis :** Filtrage instantané par catégorie, collection, coloris, taille et disponibilité de stock.
- **Fiche Produit avec Vidéo Zéro-Latence :**
  - Streaming fluide en 1080p, préchargement asynchrone, accélération matérielle.
  - Bascule instantanée entre la vidéo et les photos haute résolution.
  - Sélecteur de tailles et coloris avec affichage du stock réel disponible.
  - Guide des tailles interactif et politique de retour claire.
- **Tunnel de Commande Tunisien :**
  - Calcul automatique des frais de livraison selon le gouvernorat (Livraison offerte dès 180 DT).
  - Validation de codes promo en temps réel (`BIENVENUE10`, `GUVEN20`).
  - Paiement sécurisé à la livraison (Cash on Delivery).
  - Écran de confirmation avec numéro de commande unique, confettis et reçu imprimable.
- **Conciergerie & Prise de Contact (`/contact`) :**
  - Formulaire de demande avec **champ obligatoire pour le numéro de téléphone**.
  - Liens rapides d'appel téléphonique et de discussion **WhatsApp Direct**.

### 💼 Côté Administration (Console SaaS Dédiée)
- **Tableau de Bord KPI :** Chiffre d'affaires net, ventes brutes, commandes ventilées par statut, graphique des 7 derniers jours, alertes de stock faible.
- **Conciergerie & Messages Clients (`/admin/messages`) :**
  - Flux temps réel par WebSockets Supabase avec badge de notification en direct.
  - 📞 **Bouton d'Appel Direct en 1 Clic** (`tel:...`) sur le numéro de la cliente.
  - 💬 **Bouton WhatsApp Direct en 1 Clic** (`wa.me/...`) avec message d'accueil pré-rempli.
  - Filtres par statut (*Tous*, *Non lus*, *Répondus & Traités*) et recherche instantanée.
- **Gestion des Commandes (`/admin/commandes`) :**
  - Visualisation des commandes réelles, modification des adresses, ajout de notes internes.
  - Workflow d'expédition avec déduction physique du stock.
  - Restitution immédiate du stock réservé en cas d'annulation.
- **Catalogue & Gestion des Médias (`/admin/produits`, `/admin/categories`) :**
  - Import direct de photos et vidéos depuis le PC vers le CDN Supabase Storage.
  - Gestion des déclinaisons de tailles et inventaire associé.
- **Répertoire Clients (`/admin/clients`) :**
  - Fichier client consolidé d'après les commandes et profils réels (téléphones, dépenses cumulées, ville).

---

## 5. Structure Détaillée des Fichiers

```
guvenmode/
├── backend/
│   ├── src/
│   │   ├── __tests__/           # Tests automatisés Vitest (sécurité, checkout, stock)
│   │   ├── config/              # Configuration Supabase (client anonyme & service_role)
│   │   ├── controllers/         # Contrôleurs Express (admin, auth, catalog, checkout, upload)
│   │   ├── data/                # Magasin en mémoire (fallback de continuité)
│   │   ├── middlewares/         # auth (JWT & RBAC), rateLimiter, errorHandler
│   │   ├── routes/              # adminRoutes, customerRoutes, publicRoutes
│   │   ├── services/            # adminService, contactService, orderService, productService, etc.
│   │   ├── types/               # Schémas et interfaces TypeScript
│   │   ├── utils/               # Utilitaires (UUID, formateurs)
│   │   └── server.ts            # Serveur Express, Helmet, CORS et montage des routes
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Client Axios configuré avec intercepteurs JWT
│   │   ├── components/          # Composants UI (Header, Footer, ProductCard, CartDrawer, etc.)
│   │   ├── lib/                 # Client Supabase Realtime avec WebSockets
│   │   ├── pages/               # Pages publiques (HomePage, CatalogPage, ProductDetailPage, etc.)
│   │   │   └── admin/           # Pages de la console SaaS (Dashboard, Orders, Products, Messages, etc.)
│   │   ├── stores/              # Stores Zustand (useCartStore, useAuthStore, useWishlistStore)
│   │   ├── types/               # Types TypeScript du domaine
│   │   ├── App.tsx              # Définition des routes et hiérarchie des layouts
│   │   └── main.tsx             # Point d'entrée React et TanStack Query Provider
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
├── supabase/
│   ├── migrations/              # Scripts SQL PostgreSQL complets (001 à 004)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions_and_rpc.sql
│   │   └── 004_contact_messages.sql
│   └── COMPLETE_GUVENMODE_DATABASE_SETUP.sql
├── render.yaml                  # Blueprint Infrastructure-as-Code pour Render
└── README.md
```

---

## 6. Installation & Démarrage en Local

### Prérequis
- **Node.js :** Version 18 ou supérieure (recommandé v20 ou v24)
- **npm :** Version 9 ou supérieure
- **Compte Supabase :** Projet PostgreSQL actif

### 1. Cloner le Dépôt
```bash
git clone https://github.com/RobbanaAmenallah/Guvenmode.git
cd Guvenmode
```

### 2. Configurer les Variables d'Environnement

Créez le fichier `backend/.env` :
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=votre-cle-secrete-jwt-ultra-securisee
SUPABASE_URL=https://ggxtshlqpdibwdgzhlmq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

Créez le fichier `frontend/.env` :
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://ggxtshlqpdibwdgzhlmq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3. Lancer le Backend
```bash
cd backend
npm install
npm run dev
```
Le serveur démarre sur `http://localhost:5000`.  
Vérifiez l'état de santé : `http://localhost:5000/api/health`.

### 4. Lancer le Frontend
Dans un second terminal :
```bash
cd frontend
npm install
npm run dev
```
L'application s'ouvre sur `http://localhost:3000`.

---

## 7. Exécution des Tests Automatisés

Le backend inclut une suite de tests unitaires et d'intégration propulsée par **Vitest** validant le checkout atomique, la réservation d'inventaire, le calcul des remises, l'invalidation des accès non autorisés et la protection contre les requêtes CORS malveillantes :

```bash
cd backend
npm test
```

Résultat attendu :
```
✓ src/__tests__/security.test.ts (8 tests)
✓ src/__tests__/checkout.test.ts (4 tests)
Test Files  2 passed (2)
     Tests  12 passed (12)
```

---

## 8. Déploiement en Production sur Render (Blueprint)

Le fichier `render.yaml` situé à la racine du dépôt configure automatiquement l'ensemble de l'infrastructure sur [Render](https://render.com) :

1. Connectez votre compte Render à votre dépôt GitHub `RobbanaAmenallah/Guvenmode`.
2. Créez un **New Blueprint Instance**.
3. Render déploiera automatiquement :
   - **`guvenmode-backend`** (Web Service Node.js) : `buildCommand: npm install --include=dev && npm run build`, `startCommand: npm start`.
   - **`guvenmode-frontend`** (Static Site Vite/React) : `buildCommand: npm install && npm run build`, `staticPublishPath: ./dist`, avec réécriture des routes vers `/index.html`.
4. Renseignez les variables d'environnement secrètes (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`) dans le panneau Render.
5. Tout `git push` sur la branche `main` déclenche un déploiement continu sans interruption de service.

---

## 9. Sécurité & Bonnes Pratiques

- **Aucun mot de passe ou secret dans le code :** Les identifiants administrateur et clés privées sont strictement injectés via les variables d'environnement.
- **Validation stricte côté serveur :** Tous les corps de requêtes (`POST`, `PATCH`) sont validés avant tout traitement.
- **Isolation des rôles :** Seuls les utilisateurs disposant du rôle `admin` dans la table `user_roles` peuvent accéder aux endpoints d'administration et téléverser des fichiers sur le CDN.

---

## 10. Licence

Ce projet est la propriété exclusive de la maison **GÜVEN MODE**. Tous droits réservés © 2026.
