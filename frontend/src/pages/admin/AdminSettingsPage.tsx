import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, Loader2, Sparkles, Truck } from 'lucide-react';
import { api } from '../../api/client.js';

export const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // General Settings
  const [storeName, setStoreName] = useState('GÜVEN MODE');
  const [phone, setPhone] = useState('+216 28 827 626');
  const [whatsapp, setWhatsapp] = useState('+216 28 827 626');
  const [contactEmail, setContactEmail] = useState('guvenmode@gmail.com');
  const [facebookUrl, setFacebookUrl] = useState('https://www.facebook.com/search/top?q=guven%20mode');
  const [instagramUrl, setInstagramUrl] = useState('https://www.instagram.com/guven_mode/');
  const [address, setAddress] = useState('Tunis, Tunisie');

  // Announcement & Hero
  const [announcementText, setAnnouncementText] = useState('Nouvelle Collection Automne-Hiver | Livraison offerte à partir de 180 TND');
  const [heroTitle, setHeroTitle] = useState('Votre style, votre signature.');
  const [heroSubtitle, setHeroSubtitle] = useState('Découvrez une mode féminine pensée pour chaque instant. L\'élégance contemporaine au féminin.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop');

  // Shipping
  const [shippingFee, setShippingFee] = useState('7.000');
  const [freeThreshold, setFreeThreshold] = useState('180.000');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res: any = await api.get('/admin/settings');
        const s = res?.settings || {};
        if (s.general) {
          setStoreName(s.general.store_name || 'GÜVEN MODE');
          setPhone(s.general.phone || '+216 28 827 626');
          setWhatsapp(s.general.whatsapp || '+216 28 827 626');
          setContactEmail(s.general.contact_email || 'guvenmode@gmail.com');
          setFacebookUrl(s.general.facebook_url || 'https://www.facebook.com/search/top?q=guven%20mode');
          setInstagramUrl(s.general.instagram_url || 'https://www.instagram.com/guven_mode/');
          setAddress(s.general.store_address || 'Tunis, Tunisie');
        }
        if (s.announcement) {
          setAnnouncementText(s.announcement.text || '');
        }
        if (s.hero) {
          setHeroTitle(s.hero.title || '');
          setHeroSubtitle(s.hero.subtitle || '');
          setHeroImage(s.hero.image_url || '');
        }
        if (s.shipping) {
          if (s.shipping.standard_fee !== undefined) setShippingFee(Number(s.shipping.standard_fee).toFixed(3));
          if (s.shipping.free_shipping_threshold !== undefined) setFreeThreshold(Number(s.shipping.free_shipping_threshold).toFixed(3));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');

      await Promise.all([
        api.patch('/admin/settings', {
          key: 'general',
          value: {
            store_name: storeName,
            phone,
            whatsapp,
            contact_email: contactEmail,
            facebook_url: facebookUrl,
            instagram_url: instagramUrl,
            store_address: address
          }
        }),
        api.patch('/admin/settings', {
          key: 'announcement',
          value: { text: announcementText, is_active: true }
        }),
        api.patch('/admin/settings', {
          key: 'hero',
          value: {
            title: heroTitle,
            subtitle: heroSubtitle,
            image_url: heroImage,
            badge: 'Collection 2026'
          }
        }),
        api.patch('/admin/settings', {
          key: 'shipping',
          value: {
            standard_fee: Number(shippingFee),
            free_shipping_threshold: Number(freeThreshold)
          }
        })
      ]);

      setSuccessMsg('Paramètres enregistrés avec succès !');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 text-guven-blue animate-spin mb-2" />
        <p className="text-xs">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de la Boutique</h1>
        <p className="text-xs text-gray-500 mt-1">
          Personnalisation des coordonnées, réseaux sociaux, bannières et règles de livraison.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Informations Générales */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200">
            Coordonnées & Réseaux Sociaux
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nom de la Boutique</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email de Contact</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Téléphone Appel</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Numéro WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Lien Page Facebook Officielle</label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Lien Compte Instagram Officiel</label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Adresse Showroom</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Marketing & CMS */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-guven-blue" />
            <span>Contenu Éditorial & Bannières</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Message de la Barre d'Annonce (Haut de page)
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Titre Hero Banner</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Photo Hero Banner (URL)</label>
                <input
                  type="url"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Sous-titre Hero Banner</label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Livraison */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200 flex items-center gap-2">
            <Truck className="w-4 h-4 text-guven-blue" />
            <span>Frais & Règles de Livraison</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Frais de livraison standard (DT)</label>
              <input
                type="number"
                step="0.001"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Seuil de livraison offerte (DT)</label>
              <input
                type="number"
                step="0.001"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Enregistrer Tous les Paramètres</span>
          </button>
        </div>
      </form>
    </div>
  );
};
