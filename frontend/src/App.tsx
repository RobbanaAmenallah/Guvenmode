import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import { AnnouncementBar } from './components/layout/AnnouncementBar.js';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { AdminLayout } from './pages/admin/AdminLayout.js';

// Public Storefront Pages
import { HomePage } from './pages/HomePage.js';
import { CatalogPage } from './pages/CatalogPage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.js';
import { AuthPages } from './pages/AuthPages.js';
import { AccountPage } from './pages/AccountPage.js';
import { AboutPage, ContactPage, DeliveryReturnsPage } from './pages/ContentPages.js';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage.js';
import { AdminProductsPage } from './pages/admin/AdminProductsPage.js';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage.js';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage.js';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage.js';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';
import { useCartStore } from './stores/useCartStore.js';
import { useAuthStore } from './stores/useAuthStore.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Storefront Wrapper
const StorefrontLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-guven-ivory text-guven-charcoal selection:bg-guven-blue selection:text-white">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  const { checkGuestExpiration, loadFromBackend } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    checkGuestExpiration();
    if (isAuthenticated) {
      loadFromBackend();
    }
  }, [isAuthenticated, checkGuestExpiration, loadFromBackend]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Storefront Routes */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/boutique" element={<CatalogPage mode="all" />} />
            <Route path="/nouveautes" element={<CatalogPage mode="new" />} />
            <Route path="/promotions" element={<CatalogPage mode="sale" />} />
            <Route path="/categories/:slug" element={<CatalogPage mode="all" />} />
            <Route path="/collections" element={<CatalogPage mode="all" />} />
            <Route path="/collections/:slug" element={<CatalogPage mode="all" />} />
            <Route path="/produit/:slug" element={<ProductDetailPage />} />
            <Route path="/commande" element={<CheckoutPage />} />
            <Route path="/confirmation/:orderNumber" element={<OrderConfirmationPage />} />
            <Route path="/connexion" element={<AuthPages mode="login" />} />
            <Route path="/inscription" element={<AuthPages mode="register" />} />
            <Route path="/mon-compte" element={<AccountPage />} />
            <Route path="/favoris" element={<AccountPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/livraison-et-retours" element={<DeliveryReturnsPage />} />
            <Route path="/conditions-generales" element={<DeliveryReturnsPage />} />
            {/* Fallback 404 */}
            <Route
              path="*"
              element={
                <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
                  <h1 className="font-serif text-5xl font-bold text-guven-charcoal">404</h1>
                  <h2 className="font-serif text-2xl font-bold">Page Introuvable</h2>
                  <p className="text-xs text-guven-muted">
                    La page que vous recherchez n'existe pas ou a été déplacée.
                  </p>
                  <a
                    href="/"
                    className="inline-block px-8 py-3 bg-guven-blue text-white rounded-full text-xs font-semibold uppercase tracking-wider"
                  >
                    Retour à l'accueil
                  </a>
                </div>
              }
            />
          </Route>

          {/* Dedicated SaaS Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="commandes" element={<AdminOrdersPage />} />
            <Route path="produits" element={<AdminProductsPage />} />
            <Route path="stock" element={<AdminInventoryPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="promotions" element={<AdminPromotionsPage />} />
            <Route path="clients" element={<AdminCustomersPage />} />
            <Route path="parametres" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
