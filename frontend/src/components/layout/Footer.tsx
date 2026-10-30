import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo.js';
import { Facebook, Instagram, Send, CheckCircle2, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { api } from '../../api/client.js';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    try {
      setSubmitting(true);
      setErrorMsg('');
      await api.post('/newsletter/subscribe', { email });
      setSubscribed(true);
      setEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-white border-t border-guven-border mt-24">
      {/* Trust Badges */}
      <div className="border-b border-guven-border bg-guven-ivory/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-guven-blue/10 flex items-center justify-center text-guven-blue flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-guven-charcoal">
                  Livraison Partout en Tunisie
                </h4>
                <p className="text-xs text-guven-muted mt-0.5">
                  Expédition rapide sous 24h à 72h ouvrables avec suivi.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-guven-blue/10 flex items-center justify-center text-guven-blue flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-guven-charcoal">
                  Paiement à la Livraison
                </h4>
                <p className="text-xs text-guven-muted mt-0.5">
                  Réglez votre commande en toute sérénité à réception du colis.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-guven-blue/10 flex items-center justify-center text-guven-blue flex-shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-guven-charcoal">
                  Échanges Faciles sous 14 Jours
                </h4>
                <p className="text-xs text-guven-muted mt-0.5">
                  Un doute sur la taille ou la coupe ? Notre équipe vous accompagne.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-5">
            <BrandLogo size="md" />
            <p className="text-sm text-guven-muted leading-relaxed max-w-sm">
              Maison de prêt-à-porter féminin contemporain. Nous imaginons des pièces raffinées,
              sculptées pour révéler l'assurance et la grâce de chaque femme.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://www.facebook.com/search/top?q=guven%20mode"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-guven-ivory hover:bg-guven-blue hover:text-white text-guven-charcoal flex items-center justify-center transition-colors shadow-sm"
                aria-label="Facebook Güven Mode"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/guven_mode/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-guven-ivory hover:bg-guven-blue hover:text-white text-guven-charcoal flex items-center justify-center transition-colors shadow-sm"
                aria-label="Instagram Güven Mode"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-2 text-xs text-guven-muted space-y-1">
              <p>📞 <a href="tel:+21628827626" className="hover:text-guven-blue transition-colors font-medium text-guven-charcoal">+216 28 827 626</a></p>
              <p>✉️ <a href="mailto:guvenmode@gmail.com" className="hover:text-guven-blue transition-colors font-medium text-guven-charcoal">guvenmode@gmail.com</a></p>
            </div>
          </div>

          {/* Boutique Navigation */}
          <div className="space-y-4">
            <h5 className="font-serif text-base font-semibold tracking-wider text-guven-charcoal uppercase">
              Boutique
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/boutique" className="text-guven-muted hover:text-guven-blue transition-colors">
                  Toute la Collection
                </Link>
              </li>
              <li>
                <Link to="/categories/robes" className="text-guven-muted hover:text-guven-blue transition-colors">
                  Robes Élégantes
                </Link>
              </li>
              <li>
                <Link to="/categories/ensembles" className="text-guven-muted hover:text-guven-blue transition-colors">
                  Tailleurs & Ensembles
                </Link>
              </li>
              <li>
                <Link to="/categories/hauts" className="text-guven-muted hover:text-guven-blue transition-colors">
                  Chemisiers & Soie
                </Link>
              </li>
              <li>
                <Link to="/categories/vestes" className="text-guven-muted hover:text-guven-blue transition-colors">
                  Manteaux & Vestes
                </Link>
              </li>
              <li>
                <Link to="/promotions" className="text-guven-blue font-semibold hover:underline">
                  Offres Spéciales
                </Link>
              </li>
            </ul>
          </div>

          {/* Service Client */}
          <div className="space-y-4">
            <h5 className="font-serif text-base font-semibold tracking-wider text-guven-charcoal uppercase">
              Service Client
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/livraison-et-retours" className="text-guven-muted hover:text-guven-blue transition-colors">
                  Livraison & Retours
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-guven-muted hover:text-guven-blue transition-colors">
                  Contactez-nous
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-guven-muted hover:text-guven-blue transition-colors">
                  L'Histoire de la Maison
                </Link>
              </li>
              <li>
                <Link to="/conditions-generales" className="text-guven-muted hover:text-guven-blue transition-colors">
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-guven-muted/70 hover:text-guven-blue transition-colors">
                  Espace Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h5 className="font-serif text-base font-semibold tracking-wider text-guven-charcoal uppercase">
              Lettre d'Information
            </h5>
            <p className="text-xs text-guven-muted leading-relaxed">
              Inscrivez-vous pour recevoir nos invitations privées et découvrir en avant-première nos nouvelles créations.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Merci de votre inscription à notre newsletter !</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Votre adresse email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-full border border-guven-border focus:border-guven-blue focus:outline-none pr-10 bg-guven-ivory/40"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-guven-blue hover:bg-guven-blue-deep text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {errorMsg && <p className="text-[11px] text-red-500">{errorMsg}</p>}
                <p className="text-[10px] text-guven-muted">
                  En vous abonnant, vous acceptez de recevoir les communications exclusives Güven Mode.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-guven-border mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-guven-muted gap-4">
          <p>© {new Date().getFullYear()} GÜVEN MODE. Tous droits réservés.</p>
          <div className="flex items-center gap-6 text-xs">
            <Link to="/conditions-generales" className="hover:text-guven-blue transition-colors">
              Conditions de Vente
            </Link>
            <Link to="/conditions-generales" className="hover:text-guven-blue transition-colors">
              Politique de Confidentialité
            </Link>
            <span className="text-guven-muted/50">|</span>
            <span className="font-medium text-guven-charcoal">Tunisie (TND - DT)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
