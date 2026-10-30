import React, { useEffect, useState } from 'react';
import { 
  Boxes, AlertTriangle, ArrowUpDown, History, 
  Search, Check, X, Loader2, Save 
} from 'lucide-react';
import { api } from '../../api/client.js';

export const AdminInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');

  // Adjustment Modal
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [newOnHand, setNewOnHand] = useState<number>(0);
  const [reason, setReason] = useState('Réapprovisionnement atelier');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, movRes]: any = await Promise.all([
        api.get('/admin/inventory'),
        api.get('/admin/inventory/movements')
      ]);
      setInventory(invRes || []);
      setMovements(movRes || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdjust = (item: any) => {
    setAdjustingItem(item);
    setNewOnHand(item.quantity_on_hand);
    setReason('Réapprovisionnement atelier');
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    try {
      setSaving(true);
      await api.post('/admin/inventory/adjust', {
        variantId: adjustingItem.variant_id,
        quantityOnHand: Number(newOnHand),
        reason
      });

      await loadData();
      setAdjustingItem(null);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredInventory = inventory.filter(
    (i) =>
      i.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.color_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock & Inventaire</h1>
          <p className="text-xs text-gray-500 mt-1">
            Gestion du stock physique, stock réservé et mouvements d'inventaire par déclinaison.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-guven-blue text-guven-blue'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>État des Stocks ({inventory.length} références)</span>
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'movements'
              ? 'border-guven-blue text-guven-blue'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Journal d'Audit des Mouvements</span>
        </button>
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm max-w-md">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une pièce, un SKU ou un coloris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-8 h-8 text-guven-blue animate-spin mb-2" />
                <p className="text-xs">Chargement de l'inventaire...</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="block md:hidden divide-y divide-gray-100">
                  {filteredInventory.map((item) => (
                    <div key={item.variant_id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-gray-500">{item.sku}</span>
                        {item.status === 'out_of_stock' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700">
                            Rupture
                          </span>
                        ) : item.status === 'low_stock' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                            Stock Faible
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            En Stock
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <img
                          src={item.product_image || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=200'}
                          alt={item.product_name}
                          className="w-10 h-14 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-gray-900">{item.product_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/15 inline-block"
                              style={{ backgroundColor: item.color_hex }}
                            />
                            <span className="text-gray-700">{item.color_name}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">Taille {item.size_label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl text-center text-xs">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">Physique</p>
                          <p className="font-bold text-gray-900">{item.quantity_on_hand}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-600 font-semibold uppercase">Réservé</p>
                          <p className="font-bold text-amber-600">{item.quantity_reserved}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-guven-blue font-semibold uppercase">Dispo</p>
                          <p className="font-bold text-guven-blue">{item.available_stock}</p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-guven-blue hover:text-white text-gray-700 font-semibold text-xs transition-colors"
                        >
                          Ajuster le stock
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
                        <th className="py-3.5 px-6">Modèle</th>
                        <th className="py-3.5 px-6">SKU</th>
                        <th className="py-3.5 px-6">Coloris & Taille</th>
                        <th className="py-3.5 px-6 text-center">Stock Physique</th>
                        <th className="py-3.5 px-6 text-center">Réservé</th>
                        <th className="py-3.5 px-6 text-center">Disponible</th>
                        <th className="py-3.5 px-6">Statut</th>
                        <th className="py-3.5 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInventory.map((item) => (
                        <tr key={item.variant_id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product_image || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=200'}
                                alt={item.product_name}
                                className="w-9 h-12 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                              />
                              <span className="font-bold text-gray-900">{item.product_name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-mono text-gray-600">{item.sku}</td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-black/15 inline-block"
                                style={{ backgroundColor: item.color_hex }}
                              />
                              <span className="font-semibold text-gray-800">{item.color_name}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">Taille {item.size_label}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-center font-bold text-gray-900">
                            {item.quantity_on_hand}
                          </td>
                          <td className="py-3.5 px-6 text-center text-amber-600 font-semibold">
                            {item.quantity_reserved}
                          </td>
                          <td className="py-3.5 px-6 text-center font-bold text-guven-blue text-sm">
                            {item.available_stock}
                          </td>
                          <td className="py-3.5 px-6">
                            {item.status === 'out_of_stock' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700">
                                Rupture
                              </span>
                            ) : item.status === 'low_stock' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                                Stock Faible
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                En Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => handleOpenAdjust(item)}
                              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-guven-blue hover:text-white text-gray-700 font-semibold transition-colors"
                            >
                              Ajuster
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
        </div>
      )}

      {/* Tab 2: Movements Log */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-sm text-gray-900">Historique des Mouvements de Stock</h3>
            <p className="text-xs text-gray-500">Traçabilité complète des réservations, déductions et ajustements manuels.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Delta</th>
                  <th className="py-3 px-6">Avant → Après</th>
                  <th className="py-3 px-6">Réservé</th>
                  <th className="py-3 px-6">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50/80">
                    <td className="py-3 px-6 text-gray-600">
                      {new Date(mov.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-6 font-bold uppercase text-[11px] text-gray-800">
                      {mov.movement_type}
                    </td>
                    <td className={`py-3 px-6 font-bold ${mov.quantity_delta > 0 ? 'text-emerald-600' : mov.quantity_delta < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {mov.quantity_delta > 0 ? `+${mov.quantity_delta}` : mov.quantity_delta}
                    </td>
                    <td className="py-3 px-6 text-gray-700">
                      {mov.quantity_before} → {mov.quantity_after}
                    </td>
                    <td className="py-3 px-6 text-amber-600">
                      {mov.reserved_before} → {mov.reserved_after}
                    </td>
                    <td className="py-3 px-6 font-sans text-gray-600 text-[11px]">
                      {mov.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">
                Ajuster le Stock • {adjustingItem.sku}
              </h3>
              <button
                onClick={() => setAdjustingItem(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 text-xs space-y-1">
              <p><strong>Produit :</strong> {adjustingItem.product_name}</p>
              <p><strong>Déclinaison :</strong> {adjustingItem.color_name} • Taille {adjustingItem.size_label}</p>
              <p><strong>Stock actuel :</strong> {adjustingItem.quantity_on_hand} pièces (dont {adjustingItem.quantity_reserved} réservées)</p>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nouveau Stock Physique Réel (on_hand)
                </label>
                <input
                  type="number"
                  min={adjustingItem.quantity_reserved}
                  required
                  value={newOnHand}
                  onChange={(e) => setNewOnHand(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none font-bold text-sm"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Doit être au minimum égal à {adjustingItem.quantity_reserved} (quantité actuellement réservée).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Motif de l'ajustement
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none bg-white cursor-pointer"
                >
                  <option value="Réapprovisionnement atelier">Réapprovisionnement atelier</option>
                  <option value="Inventaire physique de contrôle">Inventaire physique de contrôle</option>
                  <option value="Correction d'erreur de saisie">Correction d'erreur de saisie</option>
                  <option value="Article défectueux retiré">Article défectueux retiré</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-guven-blue hover:bg-guven-blue-deep text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Enregistrer l'ajustement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
