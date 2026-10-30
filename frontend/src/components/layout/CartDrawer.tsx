import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';

export const CartDrawer: React.FC = () => {
  const { items, isCartOpen, closeCart, updateQuantity, removeItem, getSubtotal, checkGuestExpiration } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isCartOpen) {
      checkGuestExpiration();
    }
  }, [isCartOpen, checkGuestExpiration]);

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const freeShippingThreshold = 180.000;
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      navigate('/connexion', {
        state: {
          from: { pathname: '/commande' },
          message: 'Veuillez vous connecter ou créer un compte pour finaliser votre commande.'
        }
      });
    } else {
      navigate('/commande');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-drawer flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 border-b border-guven-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-guven-blue" />
              <h2 className="font-serif text-2xl font-bold text-guven-charcoal">
                Mon Panier
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-guven-ivory text-guven-muted">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-guven-muted hover:text-guven-charcoal rounded-full hover:bg-guven-ivory transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Bar */}
          <div className="px-6 py-3.5 bg-guven-ivory border-b border-guven-border">
            <div className="flex justify-between text-xs font-medium text-guven-charcoal mb-1.5">
              <span>
                {remainingForFree === 0 ? (
                  <span className="text-emerald-600 font-semibold">
                    ✓ Vous bénéficiez de la livraison offerte !
                  </span>
                ) : (
                  <>
                    Plus que <strong className="text-guven-blue">{remainingForFree.toFixed(3)} DT</strong> pour la livraison offerte
                  </>
                )}
              </span>
              <span className="text-guven-muted">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-guven-border rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-guven-blue h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-guven-ivory flex items-center justify-center text-guven-muted mb-4">
                  <ShoppingBag className="w-8 h-8 text-guven-blue/60" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-guven-charcoal mb-2">
                  Votre panier est vide
                </h3>
                <p className="text-sm text-guven-muted max-w-xs mb-6">
                  Découvrez nos nouvelles créations et trouvez la pièce d'exception qui sublimera votre vestiaire.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/boutique');
                  }}
                  className="px-6 py-3 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-colors shadow-sm"
                >
                  Découvrir la collection
                </button>
              </div>
            ) : (
              items.map((item) => {
                const price = item.variant.price_override ?? item.product.base_price;
                const lineTotal = price * item.quantity;
                const img = item.product.images[0]?.storage_path;

                return (
                  <div
                    key={item.variant_id}
                    className="flex gap-4 p-3 rounded-2xl border border-guven-border hover:border-guven-sand transition-colors"
                  >
                    <img
                      src={img}
                      alt={item.product.name}
                      className="w-20 h-26 object-cover rounded-xl bg-guven-ivory flex-shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif text-base font-semibold text-guven-charcoal line-clamp-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.variant_id)}
                            className="text-guven-muted hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-guven-muted">
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 inline-block"
                            style={{ backgroundColor: item.variant.color_hex }}
                          />
                          <span>{item.variant.color_name}</span>
                          <span>•</span>
                          <span>Taille {item.variant.size_label}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-guven-border rounded-lg bg-guven-ivory">
                          <button
                            onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                            className="p-1 hover:text-guven-blue transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-guven-charcoal">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                            className="p-1 hover:text-guven-blue transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-sm font-semibold text-guven-charcoal">
                            {lineTotal.toFixed(3)} DT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-guven-border bg-guven-ivory/50 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-guven-muted">
                  <span>Sous-total</span>
                  <span className="font-semibold text-guven-charcoal">{subtotal.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between text-guven-muted text-xs">
                  <span>Livraison</span>
                  <span>
                    {remainingForFree === 0 ? (
                      <span className="text-emerald-600 font-semibold uppercase">Offerte</span>
                    ) : (
                      'Calculée à la commande'
                    )}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-all shadow-md hover:shadow-luxury-hover flex items-center justify-center gap-2 group"
              >
                <span>Commander</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[11px] text-center text-guven-muted">
                Paiement à la livraison disponible sur toute la Tunisie.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
