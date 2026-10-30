import React, { useEffect, useState } from 'react';
import { Tag, Plus, Check, X, Loader2, Edit2, Trash2, Power } from 'lucide-react';
import { api } from '../../api/client.js';
import { Promotion } from '../../types/index.js';

export const AdminPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('15');
  const [minOrder, setMinOrder] = useState('100');
  const [usageLimit, setUsageLimit] = useState('500');
  const [saving, setSaving] = useState(false);

  const loadPromos = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/admin/promotions');
      setPromotions(res || []);
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const handleOpenAdd = () => {
    setEditingPromotion(null);
    setName('');
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('15');
    setMinOrder('100');
    setUsageLimit('500');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Promotion) => {
    setEditingPromotion(p);
    setName(p.name);
    setCode(p.code);
    setDiscountType(p.discount_type);
    setDiscountValue(String(p.discount_value));
    setMinOrder(p.min_order_amount ? String(p.min_order_amount) : '');
    setUsageLimit(p.usage_limit ? String(p.usage_limit) : '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name,
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: minOrder ? Number(minOrder) : 0,
        usage_limit: usageLimit ? Number(usageLimit) : null
      };

      if (!editingPromotion) {
        const newPromo: Promotion = await api.post('/admin/promotions', payload);
        setPromotions([...promotions, newPromo]);
      } else {
        const updated: Promotion = await api.patch(`/admin/promotions/${editingPromotion.id}`, payload);
        setPromotions(promotions.map((p) => (p.id === updated.id ? updated : p)));
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    try {
      const updated: Promotion = await api.patch(`/admin/promotions/${promo.id}`, {
        is_active: !promo.is_active
      });
      setPromotions(promotions.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer définitivement ce code privilège ?')) return;
    try {
      await api.delete(`/admin/promotions/${id}`);
      setPromotions(promotions.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Codes Privilèges</h1>
          <p className="text-xs text-gray-500 mt-1">
            Création, modification intégrale et suivi des réductions en pourcentage ou montant fixe en TND.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Code Promo</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 text-guven-blue animate-spin mb-2" />
            <p className="text-xs">Chargement des promotions...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-sm">Aucune promotion configurée.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {promotions.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-guven-charcoal">
                      {p.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                    <p className="text-xs font-bold text-guven-blue mt-0.5">
                      Remise : {p.discount_type === 'percentage' ? `${p.discount_value}%` : `${p.discount_value.toFixed(3)} DT`}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Min. {p.min_order_amount ? `${p.min_order_amount.toFixed(3)} DT` : 'Aucun'} • Utilisations : {p.usage_count} / {p.usage_limit || '∞'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        p.is_active ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {p.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Nom</th>
                    <th className="py-3.5 px-6">Code Promo</th>
                    <th className="py-3.5 px-6">Remise</th>
                    <th className="py-3.5 px-6">Min. Commande</th>
                    <th className="py-3.5 px-6">Utilisations</th>
                    <th className="py-3.5 px-6">Statut</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {promotions.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80">
                      <td className="py-4 px-6 font-bold text-gray-900">{p.name}</td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-guven-charcoal">
                          {p.code}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-guven-blue">
                        {p.discount_type === 'percentage'
                          ? `${p.discount_value}%`
                          : `${p.discount_value.toFixed(3)} DT`}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {p.min_order_amount ? `${p.min_order_amount.toFixed(3)} DT` : 'Aucun'}
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-mono">
                        {p.usage_count} / {p.usage_limit || '∞'}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            p.is_active
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {p.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-guven-blue transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Promo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">
                {editingPromotion ? 'Modifier le Code Privilège' : 'Créer un Code Privilège'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nom de l'opération *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Soldes d'Hiver"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Code Promotionnel *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: HIVER15"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none font-mono uppercase tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Type de remise</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (DT)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Valeur de remise</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Minimum commande (DT)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Limite d'utilisations</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-guven-blue hover:bg-guven-blue-deep text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingPromotion ? 'Enregistrer les modifications' : 'Créer le Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
