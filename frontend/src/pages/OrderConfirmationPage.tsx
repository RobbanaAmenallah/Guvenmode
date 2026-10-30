import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Printer, ArrowRight, Phone, Clock, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';
import { Order } from '../types/index.js';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1598C8', '#127AA4', '#FAF8F5', '#EAD9D8', '#292B30']
    });

    async function loadOrder() {
      if (!orderNumber) return;
      try {
        setLoading(true);
        const data: Order = await api.get(`/orders/${orderNumber}`);
        setOrder(data);
      } catch (err) {
        console.error('Error loading confirmed order:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-guven-muted space-y-3">
        <Loader2 className="w-8 h-8 text-guven-blue animate-spin" />
        <p className="text-xs uppercase tracking-widest font-semibold">Génération de votre reçu...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-3xl font-bold text-guven-charcoal">Commande Introuvable</h2>
        <p className="text-sm text-guven-muted mt-2 mb-6">
          La référence de commande fournie n'a pas pu être trouvée.
        </p>
        <Link
          to="/"
          className="inline-flex px-8 py-3 bg-guven-blue text-white rounded-full text-xs font-semibold uppercase tracking-wider"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-guven-border shadow-luxury space-y-8 printable-area">
        {/* Celebration Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-guven-blue">
            Commande Confirmée
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-guven-charcoal">
            Merci pour votre confiance, {order.customer_name} !
          </h1>
          <p className="text-sm text-guven-muted font-light max-w-lg mx-auto">
            Votre commande a bien été enregistrée dans notre atelier. Notre équipe prépare votre colis avec le plus grand soin.
          </p>
        </div>

        {/* Order Meta Box */}
        <div className="p-4 rounded-2xl bg-guven-ivory border border-guven-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-guven-muted">Numéro de Commande :</span>
            <span className="font-mono font-bold text-guven-charcoal ml-2 text-sm">
              {order.order_number}
            </span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-semibold border border-emerald-200">
            <Clock className="w-3.5 h-3.5" />
            <span>En attente de confirmation</span>
          </div>
        </div>

        {/* Ordered Items Snapshot */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-semibold text-guven-charcoal border-b border-guven-border pb-2">
            Articles Commandés
          </h3>
          <div className="space-y-3 divide-y divide-guven-border">
            {order.items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-4">
                {item.image_url_snapshot && (
                  <img
                    src={item.image_url_snapshot}
                    alt={item.product_name_snapshot}
                    className="w-16 h-20 object-cover rounded-xl bg-guven-ivory flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-base font-semibold text-guven-charcoal">
                    {item.product_name_snapshot}
                  </h4>
                  <p className="text-xs text-guven-muted">
                    {item.color_snapshot} • Taille {item.size_snapshot} • Réf: {item.sku_snapshot}
                  </p>
                  <p className="text-xs font-medium text-guven-charcoal mt-1">
                    Quantité : {item.quantity} × {item.final_unit_price.toFixed(3)} DT
                  </p>
                </div>
                <span className="text-sm font-bold text-guven-charcoal">
                  {item.line_total.toFixed(3)} DT
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address & Financial Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-guven-border text-xs">
          {/* Address */}
          <div className="space-y-2">
            <h4 className="font-serif text-base font-semibold text-guven-charcoal">
              Adresse de Livraison
            </h4>
            <p className="font-semibold text-guven-charcoal">
              {order.shipping_address_snapshot.recipient_name || (order.shipping_address_snapshot as any).recipientName}
            </p>
            <p className="text-guven-muted">
              {order.shipping_address_snapshot.street_address || (order.shipping_address_snapshot as any).streetAddress}
            </p>
            <p className="text-guven-muted">
              {order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.region}
              {(order.shipping_address_snapshot.postal_code || (order.shipping_address_snapshot as any).postalCode) ? ` - ${(order.shipping_address_snapshot.postal_code || (order.shipping_address_snapshot as any).postalCode)}` : ''}
            </p>
            <p className="text-guven-muted">
              Tél: {order.shipping_address_snapshot.phone}
            </p>
            {order.customer_note && (
              <p className="text-guven-muted italic mt-2">
                Note : "{order.customer_note}"
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <h4 className="font-serif text-base font-semibold text-guven-charcoal">
              Règlement
            </h4>
            <div className="flex justify-between text-guven-muted">
              <span>Mode de paiement</span>
              <span className="font-semibold text-guven-charcoal">Paiement à la livraison</span>
            </div>
            <div className="flex justify-between text-guven-muted">
              <span>Sous-total</span>
              <span>{order.subtotal_amount.toFixed(3)} DT</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Remise</span>
                <span>-{order.discount_amount.toFixed(3)} DT</span>
              </div>
            )}
            <div className="flex justify-between text-guven-muted">
              <span>Frais de livraison</span>
              <span>
                {order.shipping_amount === 0 ? 'Offerte' : `${order.shipping_amount.toFixed(3)} DT`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-guven-charcoal pt-2 border-t border-guven-border">
              <span>Montant à régler</span>
              <span className="text-guven-blue text-base">{order.total_amount.toFixed(3)} DT</span>
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="pt-6 border-t border-guven-border flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-guven-border hover:bg-guven-ivory text-guven-charcoal text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le reçu</span>
          </button>

          <Link
            to="/boutique"
            className="w-full sm:w-auto px-8 py-3 bg-guven-blue hover:bg-guven-blue-deep text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <span>Continuer la visite</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Contact Hotline */}
        <div className="text-center text-xs text-guven-muted pt-2 no-print">
          <p className="flex items-center justify-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-guven-blue" />
            <span>Une question sur votre livraison ? Contactez notre conciergerie au <strong>+216 29 000 000</strong></span>
          </p>
        </div>
      </div>
    </div>
  );
};
