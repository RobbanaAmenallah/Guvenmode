import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Truck, ArrowLeft, Check, AlertCircle, 
  Tag, Loader2, Lock, ArrowRight 
} from 'lucide-react';
import { useCartStore } from '../stores/useCartStore.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { api } from '../api/client.js';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart, checkGuestExpiration } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkGuestExpiration();
  }, [checkGuestExpiration]);

  const subtotal = getSubtotal();

  // Form State
  const [customerName, setCustomerName] = useState(
    user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : ''
  );
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [region, setRegion] = useState('Tunis');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Shipping calculation
  const freeThreshold = 180.000;
  const isFreeShipping = subtotal >= freeThreshold;
  const shippingAmount = isFreeShipping ? 0 : 7.000;
  const finalTotal = Number((subtotal - promoDiscount + shippingAmount).toFixed(3));

  const tunisianGovernorates = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 
    'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
  ];

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold text-guven-charcoal">Votre panier est vide</h2>
        <p className="text-sm text-guven-muted">
          Ajoutez des créations à votre panier avant de finaliser votre commande.
        </p>
        <Link
          to="/boutique"
          className="inline-flex px-8 py-3 bg-guven-blue text-white rounded-full text-xs font-semibold uppercase tracking-wider"
        >
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  // Authentication barrier: guest must login or register to checkout
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-guven-blue/10 text-guven-blue rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl font-bold text-guven-charcoal">
            Connexion Requise pour Commander
          </h2>
          <p className="text-sm text-guven-muted max-w-md mx-auto">
            Pour assurer le suivi personnalisé de votre commande et la sécurité de vos informations, veuillez vous connecter ou créer votre compte GÜVEN MODE.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-guven-border shadow-luxury text-left space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-guven-charcoal border-b border-guven-border pb-2">
            <span>Articles réservés dans votre panier ({items.reduce((s, i) => s + i.quantity, 0)})</span>
            <span className="text-guven-blue font-bold">{subtotal.toFixed(3)} DT</span>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.variant_id} className="flex items-center gap-3 text-xs">
                <img
                  src={item.product.images[0]?.storage_path || ''}
                  alt={item.product.name}
                  className="w-10 h-12 object-cover rounded-lg bg-guven-ivory shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-guven-charcoal truncate">{item.product.name}</p>
                  <p className="text-guven-muted">{item.variant.color_name} • Taille {item.variant.size_label} • Qté: {item.quantity}</p>
                </div>
                <div className="font-semibold text-guven-charcoal">
                  {((item.variant.price_override ?? item.product.base_price) * item.quantity).toFixed(3)} DT
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/connexion"
            state={{ from: { pathname: '/commande' } }}
            className="px-8 py-3.5 bg-guven-blue hover:bg-guven-blue-deep text-white rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Se Connecter</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/inscription"
            state={{ from: { pathname: '/commande' } }}
            className="px-8 py-3.5 border border-guven-charcoal hover:bg-guven-charcoal hover:text-white text-guven-charcoal rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2"
          >
            <span>Créer un Compte</span>
          </Link>
        </div>
      </div>
    );
  }

  // Handle Promo Validation
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    try {
      setValidatingPromo(true);
      setPromoError('');
      const res: any = await api.post('/promotions/validate', {
        code: promoCodeInput.trim(),
        subtotal
      });

      setAppliedPromo(res.promotion);
      setPromoDiscount(res.discountAmount);
    } catch (err: any) {
      setPromoError(err.message || 'Code promo invalide');
      setAppliedPromo(null);
      setPromoDiscount(0);
    } finally {
      setValidatingPromo(false);
    }
  };

  // Handle Checkout Submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !city.trim() || !streetAddress.trim()) {
      setErrorMessage('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      // Unique idempotency key per checkout attempt
      const idempotencyKey = `checkout-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const orderData: any = await api.post('/checkout', {
        customerId: user?.id || null,
        guestEmail: guestEmail.trim() || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: {
          recipientName: customerName.trim(),
          phone: customerPhone.trim(),
          region,
          city: city.trim(),
          streetAddress: streetAddress.trim(),
          postalCode: postalCode.trim() || undefined,
          notes: notes.trim() || undefined
        },
        paymentMethod,
        items: items.map((i) => ({
          variantId: i.variant_id,
          quantity: i.quantity
        })),
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        customerNote: notes.trim() || undefined,
        idempotencyKey
      });

      // Clear local shopping bag
      clearCart();

      // Navigate to confirmation page
      navigate(`/confirmation/${orderData.order_number}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la validation de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Return link */}
      <Link
        to="/boutique"
        className="inline-flex items-center gap-1.5 text-xs text-guven-muted hover:text-guven-blue transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Continuer mes achats</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Checkout Form */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-guven-charcoal">
              Finaliser la Commande
            </h1>
            <p className="text-xs text-guven-muted mt-1">
              Renseignez vos coordonnées de livraison. Paiement sécurisé à la réception.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-8">
            {/* Step 1: Customer Info */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-guven-border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-guven-charcoal pb-2 border-b border-guven-border">
                <span className="w-6 h-6 rounded-full bg-guven-blue text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Coordonnées</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                    Nom & Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sarah Ben Mahmoud"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none bg-guven-ivory/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                    Numéro de Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 24 555 888"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none bg-guven-ivory/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                  Adresse Email (optionnelle, pour le suivi)
                </label>
                <input
                  type="email"
                  placeholder="votre.email@domaine.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none bg-guven-ivory/30"
                />
              </div>
            </div>

            {/* Step 2: Delivery Address */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-guven-border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-guven-charcoal pb-2 border-b border-guven-border">
                <span className="w-6 h-6 rounded-full bg-guven-blue text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Adresse de Livraison</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                    Gouvernorat <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none bg-white cursor-pointer"
                  >
                    {tunisianGovernorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                    Ville / Délégation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: La Marsa, Ennasr, Sahloul..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none bg-guven-ivory/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                    Adresse complète <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Numéro, rue, résidence, appartement..."
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none bg-guven-ivory/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                    Code Postal
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2078"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none bg-guven-ivory/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                  Instructions de livraison (optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Indications pour le livreur (ex: appeler à l'arrivée, sonner à l'interphone...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none bg-guven-ivory/30"
                />
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-guven-border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-guven-charcoal pb-2 border-b border-guven-border">
                <span className="w-6 h-6 rounded-full bg-guven-blue text-white text-xs flex items-center justify-center font-bold">
                  3
                </span>
                <span>Mode de Paiement</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-guven-blue bg-guven-blue/5 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-guven-blue accent-guven-blue"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-guven-charcoal flex items-center gap-1.5">
                      <span>Paiement à la livraison (Espèces)</span>
                      <ShieldCheck className="w-4 h-4 text-guven-blue" />
                    </p>
                    <p className="text-[11px] text-guven-muted mt-0.5">
                      Payez directement auprès du transporteur lors de la remise de votre colis.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-guven-blue hover:bg-guven-blue-deep disabled:bg-gray-400 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-all shadow-md hover:shadow-luxury-hover flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validation de votre commande...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirmer la Commande • {finalTotal.toFixed(3)} DT</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-guven-border shadow-sm space-y-6 sticky top-24">
          <h2 className="font-serif text-2xl font-bold text-guven-charcoal pb-4 border-b border-guven-border">
            Récapitulatif de Commande
          </h2>

          {/* Items Preview */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 divide-y divide-guven-border/60">
            {items.map((item) => {
              const price = item.variant.price_override ?? item.product.base_price;
              const lineTotal = price * item.quantity;
              const img = item.product.images[0]?.storage_path;

              return (
                <div key={item.variant_id} className="pt-3 first:pt-0 flex gap-3 items-center">
                  <img
                    src={img}
                    alt={item.product.name}
                    className="w-14 h-18 object-cover rounded-xl bg-guven-ivory flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm font-semibold text-guven-charcoal truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-guven-muted">
                      {item.variant.color_name} • Taille {item.variant.size_label}
                    </p>
                    <p className="text-xs text-guven-charcoal font-medium mt-0.5">
                      Qté: {item.quantity} × {price.toFixed(3)} DT
                    </p>
                  </div>
                  <span className="text-xs font-bold text-guven-charcoal">
                    {lineTotal.toFixed(3)} DT
                  </span>
                </div>
              );
            })}
          </div>

          {/* Promotion Input */}
          <div className="pt-4 border-t border-guven-border">
            <label className="block text-xs font-semibold text-guven-charcoal mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-guven-blue" />
              <span>Code Promotionnel</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: BIENVENUE10"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-guven-border uppercase tracking-wider focus:border-guven-blue focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={validatingPromo}
                className="px-4 py-2.5 bg-guven-charcoal hover:bg-guven-blue text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {validatingPromo ? '...' : 'Appliquer'}
              </button>
            </div>
            {promoError && <p className="text-[11px] text-red-500 mt-1">{promoError}</p>}
            {appliedPromo && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Code {appliedPromo.code} appliqué (-{promoDiscount.toFixed(3)} DT)
              </p>
            )}
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-2 pt-4 border-t border-guven-border text-xs">
            <div className="flex justify-between text-guven-muted">
              <span>Sous-total articles</span>
              <span className="font-semibold text-guven-charcoal">{subtotal.toFixed(3)} DT</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Remise promotionnelle</span>
                <span>-{promoDiscount.toFixed(3)} DT</span>
              </div>
            )}
            <div className="flex justify-between text-guven-muted">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Frais de livraison</span>
              </span>
              <span>
                {isFreeShipping ? (
                  <span className="text-emerald-600 font-bold uppercase">Offerte</span>
                ) : (
                  `${shippingAmount.toFixed(3)} DT`
                )}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-guven-charcoal pt-3 border-t border-guven-border">
              <span>Total à payer</span>
              <span className="text-guven-blue text-lg">{finalTotal.toFixed(3)} DT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
