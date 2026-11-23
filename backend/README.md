# GÜVEN MODE — Documentation Technique Backend API

Ce répertoire contient l'API REST de production de la maison **GÜVEN MODE**, construite avec Node.js, Express.js et TypeScript en mode ESM natif.

---

## 🛠️ Stack Backend

- **Runtime :** Node.js 18+ (testé et validé avec Node v24)
- **Framework :** Express.js
- **Langage :** TypeScript (ESM)
- **Sécurité :** Helmet, CORS dynamique, Rate Limiting distribué, validation de signatures binaires (Magic Bytes)
- **Base de données :** Supabase PostgreSQL (client officiel `@supabase/supabase-js`)
- **Stockage Médias :** Supabase Storage CDN (Bucket `product-media`) avec clé `service_role`
- **Tests :** Vitest (12 tests d'intégration et de sécurité automatisés)

---

## 📋 Variables d'Environnement (`backend/.env`)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `NODE_ENV` | Environnement d'exécution | `development` ou `production` |
| `PORT` | Port d'écoute du serveur | `5000` |
| `FRONTEND_URL` | URL autorisée pour les requêtes CORS | `http://localhost:3000` ou `https://guvenmode-frontend.onrender.com` |
| `JWT_SECRET` | Clé secrète pour la signature des sessions | Chaîne aléatoire de 64 caractères |
| `SUPABASE_URL` | URL de votre instance Supabase | `https://ggxtshlqpdibwdgzhlmq.supabase.co` |
| `SUPABASE_ANON_KEY` | Clé publique anonyme Supabase | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète d'administration Supabase | `eyJhbGciOi...` |

---

## 🔌 Référentiel des Endpoints API

### Routes Publiques (`/api`)

| Méthode | Route | Description | Protection |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Vérification de la santé du serveur | Aucune |
| `POST`| `/auth/login` | Connexion utilisateur (génération JWT) | `authLimiter` (10 req / 15 min) |
| `POST`| `/auth/register` | Inscription nouveau compte client | `authLimiter` + Validation mot de passe |
| `GET` | `/auth/me` | Informations de l'utilisateur connecté | `requireAuth` |
| `GET` | `/products` | Liste paginée des produits avec filtres | Cache / Global |
| `GET` | `/products/:slug` | Fiche détaillée d'un produit avec variantes | Cache / Global |
| `GET` | `/categories` | Liste des catégories actives | Global |
| `GET` | `/collections` | Liste des collections saisonnières | Global |
| `GET` | `/homepage` | Agrégation des données de la page d'accueil | Global |
| `GET` | `/settings/public` | Paramètres publics du site (textes, contact) | Global |
| `POST`| `/promotions/validate` | Validation d'un code de réduction | `checkoutAndPromoLimiter` |
| `POST`| `/newsletter/subscribe`| Inscription à la newsletter | `checkoutAndPromoLimiter` |
| `POST`| `/contact` | Envoi d'un message client avec téléphone | `checkoutAndPromoLimiter` |
| `POST`| `/checkout` | Création atomique d'une commande | `requireAuth`, `checkoutAndPromoLimiter` |
| `GET` | `/orders/:reference` | Consultation de commande sécurisée | `requireAuth` (Propriétaire uniquement) |

### Routes d'Administration (`/api/admin`) — *Requiert `requireAdmin`*

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `POST`  | `/upload` | Téléversement direct de photos ou vidéos vers le CDN Supabase |
| `GET`   | `/dashboard` | Statistiques globales, chiffre d'affaires, alertes de stock |
| `GET`   | `/orders` | Consultation de toutes les commandes avec filtres et recherche |
| `PATCH` | `/orders/:id/status` | Modification de l'état d'une commande avec ajustement du stock |
| `PATCH` | `/orders/:id` | Modification des coordonnées d'une commande |
| `GET`   | `/products` | Liste complète des produits (publiés et brouillons) |
| `POST`  | `/products` | Création d'un produit avec déclinaisons et synchronisation du stock |
| `PATCH` | `/products/:id` | Mise à jour complète d'un produit et de ses variantes |
| `DELETE`| `/products/:id` | Suppression d'un produit |
| `GET`   | `/inventory` | Vue consolidée des stocks physiques et réservés par taille |
| `POST`  | `/inventory/adjust` | Réapprovisionnement ou ajustement manuel de stock |
| `GET`   | `/inventory/movements` | Historique d'audit des mouvements de stock |
| `GET`   | `/messages` | **Liste des messages clients reçus avec numéro de téléphone** |
| `PATCH` | `/messages/:id/status` | Marquer un message comme lu, non lu ou répondu |
| `DELETE`| `/messages/:id` | Suppression définitive d'un message |
| `GET`   | `/customers` | Répertoire des clientes consolidé d'après les commandes et profils |
| `GET`   | `/notifications` | Liste des notifications administrateur |
| `PATCH` | `/notifications/read-all` | Marquer toutes les notifications comme lues |

---

## 🧪 Tests Automatisés

Pour exécuter la suite de tests Vitest :
```bash
npm test
```
Pour lancer les tests en mode surveillance :
```bash
npm run test:watch
```
Pour construire le projet pour la production :
```bash
npm run build
```
Le code compilé est généré dans le dossier `dist/`.
