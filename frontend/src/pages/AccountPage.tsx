import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Package, Heart, LogOut, Clock, CheckCircle2, 
  Truck, XCircle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore.js';
import { useWishlistStore } from '../stores/useWishlistStore.js';
import { api } from '../api/client.js';
import { Order, Product } from '../types/index.js';
import { ProductCard } from '../components/product/ProductCard.js';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { productIds } = useWishlistStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/connexion');
      return;
    }

    async function loadData() {
      try {
        setLoadingOrders(true);
        const myOrders: any = await api.get('/me/orders');
        setOrders(Array.isArray(myOrders) ? myOrders : (myOrders?.orders || []));

        // Load wishlist items if any
        if (productIds.length > 0) {
          const allProds: any = await api.get('/products?limit=50');
          const favs = (allProds.products || []).filter((p: Product) => productIds.includes(p.id));
          setWishlistProducts(favs);
        }
      } catch (err) {
        console.error('Error loading account data:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadData();
  }, [isAuthenticated, user, productIds, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmée
          </span>
        );
      case 'preparing':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> En préparation
          </span>
        );
      case 'shipped':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Expédiée
          </span>
        );
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Livrée
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Annulée
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> En attente
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-guven-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-guven-blue/10 text-guven-blue flex items-center justify-center font-serif text-2xl font-bold">
            {user?.first_name?.[0] || 'C'}
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-guven-charcoal">
              Bonjour, {user?.first_name || 'Chère Cliente'} {user?.last_name || ''}
            </h1>
            <p className="text-xs text-guven-muted mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'admin' || user?.role === 'super_admin' ? (
            <Link
              to="/admin"
              className="px-5 py-2.5 bg-guven-charcoal hover:bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-guven-blue" />
              <span>Panneau Admin</span>
            </Link>
          ) : null}

          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-full border border-guven-border hover:bg-guven-ivory text-guven-charcoal text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-guven-border mb-8 gap-8 text-xs font-semibold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-guven-blue text-guven-blue'
              : 'border-transparent text-guven-muted hover:text-guven-charcoal'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Mes Commandes ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'wishlist'
              ? 'border-guven-blue text-guven-blue'
              : 'border-transparent text-guven-muted hover:text-guven-charcoal'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Mes Favoris ({productIds.length})</span>
        </button>
      </div>

      {/* Tab: Orders List */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-guven-border space-y-4">
              <Package className="w-12 h-12 text-guven-muted mx-auto" />
              <h3 className="font-serif text-xl font-bold text-guven-charcoal">
                Aucune commande enregistrée pour le moment
              </h3>
              <p className="text-xs text-guven-muted max-w-sm mx-auto">
                Vos prochaines commandes passées apparaîtront ici avec leur suivi en temps réel.
              </p>
              <Link
                to="/boutique"
                className="inline-flex px-8 py-3 bg-guven-blue text-white rounded-full text-xs font-semibold uppercase tracking-wider"
              >
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-guven-border shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-guven-border gap-2">
                  <div>
                    <span className="text-xs text-guven-muted">Commande</span>
                    <h4 className="font-mono font-bold text-guven-charcoal text-base">
                      {order.order_number}
                    </h4>
                    <span className="text-[11px] text-guven-muted">
                      Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-bold text-guven-charcoal text-base">
                      {order.total_amount.toFixed(3)} DT
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-guven-ivory/50 p-3 rounded-2xl border border-guven-border/60">
                      {item.image_url_snapshot && (
                        <img
                          src={item.image_url_snapshot}
                          alt={item.product_name_snapshot}
                          className="w-12 h-16 object-cover rounded-xl flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-sm font-semibold truncate text-guven-charcoal">
                          {item.product_name_snapshot}
                        </p>
                        <p className="text-[11px] text-guven-muted">
                          {item.color_snapshot} • Taille {item.size_snapshot}
                        </p>
                        <p className="text-xs font-bold text-guven-blue mt-0.5">
                          {item.quantity} × {item.final_unit_price.toFixed(3)} DT
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Link
                    to={`/confirmation/${order.order_number}`}
                    className="text-xs font-semibold text-guven-blue hover:text-guven-blue-deep flex items-center gap-1"
                  >
                    <span>Voir le reçu complet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-guven-border space-y-4">
              <Heart className="w-12 h-12 text-guven-muted mx-auto" />
              <h3 className="font-serif text-xl font-bold text-guven-charcoal">
                Votre liste d'envies est vide
              </h3>
              <p className="text-xs text-guven-muted max-w-sm mx-auto">
                Explorez notre collection et enregistrez vos pièces favorites en cliquant sur le cœur.
              </p>
              <Link
                to="/boutique"
                className="inline-flex px-8 py-3 bg-guven-blue text-white rounded-full text-xs font-semibold uppercase tracking-wider"
              >
                Parcourir la collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {wishlistProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
