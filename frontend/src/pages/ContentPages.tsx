import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Facebook, Instagram, MessageCircle, PhoneCall, Loader2, AlertCircle } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo.js';
import { api } from '../api/client.js';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Conseil Tailles & Mensurations',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/contact', formData);
      setSent(true);
    } catch (err: any) {
      console.error('Erreur envoi contact:', err);
      setErrorMessage(
        err?.response?.data?.error?.message ||
        'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer ou nous appeler directement.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: 'Conseil Tailles & Mensurations',
      message: ''
    });
    setSent(false);
    setErrorMessage('');
  };

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
          Nos conseillers vous répondent avec attention pour toute demande d'information, conseil personnalisé ou rendez-vous showroom.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Left: Contact Info & Direct Actions */}
        <div className="space-y-6 bg-white p-8 rounded-3xl border border-guven-border shadow-sm">
          <h3 className="font-serif text-2xl font-bold text-guven-charcoal">Coordonnées</h3>
          <div className="space-y-5 text-xs">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-guven-blue flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-guven-charcoal">Téléphone & Showroom</p>
                <p className="text-guven-muted font-bold text-sm">+216 28 827 626</p>
                <p className="text-[11px] text-guven-muted">Du lundi au samedi : 10h00 - 19h30</p>
                {/* Instant Call & WhatsApp Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <a
                    href="tel:+21628827626"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Appeler</span>
                  </a>
                  <a
                    href="https://wa.me/21628827626?text=Bonjour%20Maison%20G%C3%9CVEN%20MODE,%20je%20souhaite%20un%20renseignement"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp Direct</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
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

        {/* Right: Contact Form */}
        <div className="bg-white p-8 rounded-3xl border border-guven-border shadow-sm">
          {sent ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-guven-charcoal">Message Transmis avec Succès</h4>
              <p className="text-xs text-guven-muted leading-relaxed max-w-sm mx-auto">
                Merci chère cliente. Votre demande a bien été enregistrée par notre conciergerie. 
                Notre équipe vous rappellera au <strong>{formData.phone}</strong> dans les plus brefs délais.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-full border border-guven-border hover:border-guven-blue hover:text-guven-blue text-xs font-semibold transition-colors"
                >
                  Envoyer un autre message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                  Votre Nom Complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Amina Trabelsi"
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:ring-1 focus:ring-guven-blue focus:outline-none"
                />
              </div>

              {/* TELEPHONE FIELD (Customer phone for direct call & WhatsApp) */}
              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                  Numéro de Téléphone (Pour vous appeler) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: +216 28 827 626 ou 98 123 456"
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:ring-1 focus:ring-guven-blue focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-guven-muted mt-1">
                  Notre conseillère vous appellera ou vous enverra les photos par WhatsApp.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                  Adresse Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre.email@domaine.com"
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:ring-1 focus:ring-guven-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                  Sujet de votre demande
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:ring-1 focus:ring-guven-blue focus:outline-none bg-white"
                >
                  <option value="Conseil Tailles & Mensurations">Conseil Tailles & Mensurations</option>
                  <option value="Demande Création Sur-Mesure">Demande Création Sur-Mesure</option>
                  <option value="Suivi ou Modification de Commande">Suivi ou Modification de Commande</option>
                  <option value="Disponibilité en Boutique Showroom">Disponibilité en Boutique Showroom</option>
                  <option value="Autre demande">Autre demande</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">
                  Votre Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Décrivez votre demande, la pièce concernée, vos mensurations ou toute question..."
                  className="w-full text-xs px-4 py-3 rounded-xl border border-guven-border focus:border-guven-blue focus:ring-1 focus:ring-guven-blue focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-guven-blue hover:bg-guven-blue-deep disabled:opacity-70 text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmission en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Envoyer à la Conciergerie</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
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
