import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Facebook, Instagram } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo.js';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <div className="text-center space-y-4">
        <BrandLogo variant="footer" size="lg" className="mx-auto" />
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-guven-charcoal">
          L'Histoire de la Maison GÜVEN MODE
        </h1>
        <p className="text-base text-guven-muted font-light max-w-xl mx-auto">
          L'élégance affirmée, la perfection des coupes et l'amour du détail féminin.
        </p>
      </div>

      <div className="prose prose-lg mx-auto text-guven-charcoal/80 space-y-6 text-sm sm:text-base leading-relaxed font-light">
        <p>
          Fondée avec la volonté de célébrer la femme contemporaine, <strong>GÜVEN MODE</strong> réinvente le vestiaire féminin haut de gamme. Chaque pièce est pensée comme une œuvre d'équilibre : entre la structure architecturale d'un tailleur et la fluidité vaporeuse d'une robe en crêpe de soie.
        </p>
        <p>
          Notre identité visuelle — incarnée par notre logo représentant une silhouette féminine coiffée d'un chapeau et de lunettes solaires dans notre bleu signature — symbolise l'assurance, le mystère, le raffinement et l'audace.
        </p>
        <div className="aspect-[16/9] rounded-3xl overflow-hidden my-8 shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
            alt="Atelier Güven Mode"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="font-serif text-2xl font-bold text-guven-charcoal pt-4">
          Nos Engagements d'Excellence
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Matières Premières Sélectionnées :</strong> Soie peignée, mousseline haute densité, laines froides italiennes et velours d'exception.</li>
          <li><strong>Confection Rigoureuse :</strong> Finitions intérieures gansées, doublures respirantes et tombés impeccables.</li>
          <li><strong>Proximité & Écoute :</strong> Une conciergerie dédiée à votre écoute pour vous conseiller sur vos mensurations et occasions spéciales.</li>
        </ul>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-guven-blue">
          Conciergerie & Service Client
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-guven-charcoal">
          Contactez la Maison
        </h1>
        <p className="text-sm text-guven-muted font-light max-w-lg mx-auto">
          Nos conseillers vous répondent avec attention pour toute demande d'information, suivi de commande ou conseil de style.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="space-y-6 bg-white p-8 rounded-3xl border border-guven-border shadow-sm">
          <h3 className="font-serif text-2xl font-bold text-guven-charcoal">Coordonnées</h3>
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-guven-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-guven-charcoal">Téléphone & WhatsApp</p>
                <p className="text-guven-muted mt-0.5">+216 28 827 626</p>
                <p className="text-[11px] text-guven-muted">Du lundi au samedi : 10h00 - 19h30</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-guven-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-guven-charcoal">Email Officiel</p>
                <p className="text-guven-muted mt-0.5">guvenmode@gmail.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-guven-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-guven-charcoal">Boutique & Showroom</p>
                <p className="text-guven-muted mt-0.5">Tunis, Tunisie</p>
              </div>
            </div>

            <div className="pt-4 border-t border-guven-border/60">
              <p className="font-semibold text-guven-charcoal mb-2">Suivez la Maison sur les réseaux</p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/search/top?q=guven%20mode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-guven-ivory hover:bg-guven-blue hover:text-white text-guven-charcoal text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/guven_mode/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-guven-ivory hover:bg-guven-blue hover:text-white text-guven-charcoal text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-guven-border shadow-sm">
          {sent ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-serif text-xl font-bold text-guven-charcoal">Message Transmis</h4>
              <p className="text-xs text-guven-muted">
                Merci de votre message. Notre équipe vous répondra sous 24h ouvrables.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">Votre Nom</label>
                <input
                  type="text"
                  required
                  placeholder="Amina"
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">Adresse Email</label>
                <input
                  type="email"
                  required
                  placeholder="votre.email@domaine.com"
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">Votre Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Comment pouvons-nous vous aider ?"
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <span>Envoyer le Message</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const DeliveryReturnsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-guven-charcoal">
          Livraison & Retours
        </h1>
        <p className="text-xs text-guven-muted">Toutes les informations sur vos expéditions et garanties.</p>
      </div>

      <div className="space-y-6 text-sm text-guven-charcoal/80 font-light leading-relaxed">
        <div className="bg-white p-6 rounded-2xl border border-guven-border space-y-2">
          <h3 className="font-serif text-lg font-bold text-guven-charcoal">1. Délais et Frais de Livraison</h3>
          <p>
            Nous livrons sur l'ensemble du territoire tunisien en partenariat avec des transporteurs express certifiés.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Grand Tunis :</strong> 24h à 48h ouvrables (7.000 DT)</li>
            <li><strong>Sahel, Cap Bon & Intérieur :</strong> 48h à 72h ouvrables (8.000 DT à 9.000 DT)</li>
            <li><strong>Livraison Offerte :</strong> Gratuite dès 180.000 DT de commande.</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-guven-border space-y-2">
          <h3 className="font-serif text-lg font-bold text-guven-charcoal">2. Paiement à la Livraison</h3>
          <p>
            Pour votre tranquillité d'esprit, vous réglez le montant exact de votre commande en espèces directement auprès du livreur à la réception de votre colis.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-guven-border space-y-2">
          <h3 className="font-serif text-lg font-bold text-guven-charcoal">3. Politique d'Échange et Retours</h3>
          <p>
            Vous disposez d'un délai de 14 jours à compter de la réception de votre commande pour demander un échange de taille ou de modèle. Les articles doivent être retournés non portés, non lavés, avec leurs étiquettes d'origine intactes.
          </p>
        </div>
      </div>
    </div>
  );
};
