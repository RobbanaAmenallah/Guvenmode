# GÜVEN MODE — Documentation Technique Frontend Storefront & Admin

Ce répertoire contient l'application web de la maison **GÜVEN MODE**, regroupant la boutique en ligne publique (Storefront) et la console d'administration SaaS.

---

## 🛠️ Stack Frontend

- **Framework :** React 18, TypeScript
- **Bundler & Serveur de Développement :** Vite 6
- **Styling :** Tailwind CSS avec tokens graphiques luxe
- **Routage :** React Router v7
- **Gestion d'État Global :** Zustand
- **Requêtes Serveur & Mise en Cache :** TanStack Query (React Query)
- **Temps Réel :** Supabase Realtime Client (WebSockets natifs)
- **Composants d'Icônes :** Lucide React
- **Graphiques :** Recharts

---

## 📋 Variables d'Environnement (`frontend/.env`)

| Variable | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL de base de l'API backend | `/api` ou `https://guvenmode-backend.onrender.com/api` |
| `VITE_SUPABASE_URL` | URL de l'instance Supabase | `https://ggxtshlqpdibwdgzhlmq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anonyme pour l'écoute temps réel | `eyJhbGciOi...` |

---

## 📁 Organisation du Code Source

```
frontend/src/
├── api/
│   └── client.ts             # Client Axios typé, intercepteurs JWT et gestion globale d'erreurs
├── components/
│   ├── cart/                 # Tiroir panier latéral (CartDrawer), jauge de livraison offerte
│   ├── common/               # BrandLogo, modales, bannières d'alerte
│   ├── layout/               # Header, Footer, AnnouncementBar
│   └── product/              # ProductCard (avec vidéo au survol zéro-latence), badges, zoom
├── lib/
│   └── supabase.ts           # Client Supabase Realtime configuré pour les WebSockets
├── pages/
│   ├── admin/                # Console d'Administration complète :
│   │   ├── AdminDashboardPage.tsx   # Indicateurs financiers, graphiques de ventes
│   │   ├── AdminOrdersPage.tsx      # Gestion et expédition des commandes
│   │   ├── AdminProductsPage.tsx    # Création, édition, upload PC d'images et vidéos
│   │   ├── AdminInventoryPage.tsx   # Stock en direct et alertes
│   │   ├── AdminCategoriesPage.tsx  # Rayons et collections
│   │   ├── AdminMessagesPage.tsx    # Conciergerie temps réel, appel 1 clic, WhatsApp
│   │   ├── AdminCustomersPage.tsx   # Répertoire client consolidé
│   │   ├── AdminPromotionsPage.tsx  # Codes promotionnels
│   │   ├── AdminSettingsPage.tsx    # Configuration de la boutique
│   │   └── AdminLayout.tsx          # Navigation latérale et cloche de notifications
│   ├── AccountPage.tsx       # Espace compte client et favoris
│   ├── AuthPages.tsx         # Connexion et inscription sécurisées
│   ├── CatalogPage.tsx       # Catalogue avec filtres facettés et pagination
│   ├── CheckoutPage.tsx      # Tunnel de commande et sélection de gouvernorat
│   ├── ContentPages.tsx      # À propos, Contactez-nous (avec téléphone), Retours
│   ├── HomePage.tsx          # Page d'accueil éditoriale avec hero banner
│   ├── OrderConfirmationPage.tsx # Reçu de commande imprimable avec confettis
│   └── ProductDetailPage.tsx # Fiche produit avec lecteur vidéo 1080p ultra-fluide
├── stores/
│   ├── useCartStore.ts       # Panier d'achat synchronisé avec le backend
│   ├── useAuthStore.ts       # Gestion des sessions et des droits admin
│   └── useWishlistStore.ts   # Liste d'envies stockée localement
├── types/
│   └── index.ts              # Définitions TypeScript du domaine e-commerce
├── App.tsx                   # Hiérarchie des routes et gardes de sécurité
└── main.tsx                  # Montage de l'arbre React et QueryClientProvider
```

---

## ⚡ Optimisations Médias & Zéro-Latence

1. **Lecteur Vidéo Haute Définition :**
   - Le lecteur de la fiche produit utilise `preload="auto"` et est pré-monté dans le DOM pour garantir un démarrage instantané sans freeze.
   - Les vidéos profitent de l'accélération GPU (`transform: translateZ(0)`).
   - Bouton de passage en mode plein écran natif et bascule vers les photos haute définition.
2. **Survol Produit dans le Catalogue :**
   - La vidéo d'aperçu d'un produit est pré-chargée en tâche de fond et démarre au survol de la souris sans écran blanc.
3. **Chargement Prioritaire des Photos :**
   - L'image principale de la fiche produit et de la bannière hero bénéficient de `fetchPriority="high"` et `loading="eager"`.
   - Les galeries et listes secondaires utilisent `loading="lazy"` et `decoding="async"`.

---

## 💬 Conciergerie & Temps Réel

- Le composant `AdminMessagesPage` est abonné aux canaux WebSockets de Supabase sur les tables `contact_messages` et `notifications`.
- Dès qu'un client soumet le formulaire `/contact`, la demande apparaît sans délai sur le tableau de bord de l'administrateur avec des raccourcis d'action :
  - **Appeler le client :** `href="tel:..."`
  - **WhatsApp Direct :** `href="https://wa.me/..."` avec message pré-rempli
  - **Email :** `href="mailto:..."`

---

## 🏗️ Commandes de Développement & Production

```bash
# Démarrer le serveur de développement local (Vite)
npm run dev

# Compiler l'application pour la production (TypeScript + Vite)
npm run build

# Prévisualiser la compilation de production
npm run preview
```
