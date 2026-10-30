import React, { useEffect, useState } from 'react';
import { 
  Search, Eye, CheckCircle2, Clock, Truck, 
  XCircle, Printer, X, Loader2, Save, Edit3, ArrowLeft
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Order, OrderStatus } from '../../types/index.js';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Full order editing state
  const [isEditingFullOrder, setIsEditingFullOrder] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editGuestEmail, setEditGuestEmail] = useState('');
  const [editStreetAddress, setEditStreetAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editShippingAmount, setEditShippingAmount] = useState('7.000');
  const [editDiscountAmount, setEditDiscountAmount] = useState('0');
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>('pending');
  const [editCustomerNote, setEditCustomerNote] = useState('');
  const [savingOrderEdit, setSavingOrderEdit] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
      if (searchQuery) queryParams.set('search', searchQuery);

      const res: any = await api.get(`/admin/orders?${queryParams.toString()}`);
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus, searchQuery]);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setAdminNoteInput(order.admin_note || '');
    setIsEditingFullOrder(false);

    // Seed edit form values
    setEditCustomerName(order.customer_name);
    setEditCustomerPhone(order.customer_phone);
    setEditGuestEmail(order.guest_email || '');
    const addr = order.shipping_address_snapshot as any;
    setEditStreetAddress(addr?.street_address || addr?.streetAddress || '');
    setEditCity(addr?.city || '');
    setEditRegion(addr?.region || '');
    setEditPostalCode(addr?.postal_code || addr?.postalCode || '');
    setEditShippingAmount(order.shipping_amount.toFixed(3));
    setEditDiscountAmount(order.discount_amount.toFixed(3));
    setEditPaymentStatus(order.payment_status || 'pending');
    setEditCustomerNote(order.customer_note || '');
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(true);
      const updated: Order = await api.patch(`/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        note: `Passage au statut ${newStatus} depuis le tableau de bord`
      });

      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedOrder) return;
    try {
      setSavingNote(true);
      const updated: Order = await api.patch(`/admin/orders/${selectedOrder.id}/note`, {
        note: adminNoteInput
      });
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveFullOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setSavingOrderEdit(true);
      const payload = {
        customer_name: editCustomerName,
        customer_phone: editCustomerPhone,
        guest_email: editGuestEmail || undefined,
        shipping_address_snapshot: {
          recipient_name: editCustomerName,
          phone: editCustomerPhone,
          street_address: editStreetAddress,
          city: editCity,
          region: editRegion,
          postal_code: editPostalCode,
          country: 'TN'
        },
        shipping_amount: Number(editShippingAmount),
        discount_amount: Number(editDiscountAmount),
        payment_status: editPaymentStatus,
        customer_note: editCustomerNote,
        admin_note: adminNoteInput
      };

      const updated: Order = await api.patch(`/admin/orders/${selectedOrder.id}`, payload);
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setIsEditingFullOrder(false);
    } catch (err: any) {
      alert(`Erreur modification: ${err.message}`);
    } finally {
      setSavingOrderEdit(false);
    }
  };

  const statusTabs = [
    { label: 'Toutes', value: 'all' },
    { label: 'En attente', value: 'pending' },
    { label: 'Confirmées', value: 'confirmed' },
    { label: 'En préparation', value: 'preparing' },
    { label: 'Expédiées', value: 'shipped' },
    { label: 'Livrées', value: 'delivered' },
    { label: 'Annulées', value: 'cancelled' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Confirmée</span>;
      case 'preparing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">En préparation</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">Expédiée</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Livrée</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">Annulée</span>;
      case 'pending':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">En attente</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-xs text-gray-500 mt-1">
            Suivi du cycle de vie des commandes, réservations de stock, expéditions et modifications administratives complètes.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-4 pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              selectedStatus === tab.value
                ? 'border-guven-blue text-guven-blue'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par référence, cliente, téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* Orders Container (Responsive: Cards on Mobile, Table on Desktop) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 text-guven-blue animate-spin mb-2" />
            <p className="text-xs">Chargement des commandes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-sm">Aucune commande trouvée.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View (Visible on small screens) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {orders.map((order) => (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
                      {order.order_number}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-gray-900">{order.customer_name}</p>
                    <p className="text-gray-500">{order.customer_phone}</p>
                    <p className="text-gray-600">
                      {order.shipping_address_snapshot?.city}, {order.shipping_address_snapshot?.region}
                    </p>
                    <p className="text-gray-400 text-[11px]">
                      Passée le {new Date(order.created_at).toLocaleDateString('fr-FR')} • {order.items.reduce((s, i) => s + i.quantity, 0)} pièce(s)
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="font-bold text-sm text-guven-blue">
                      {order.total_amount.toFixed(3)} DT
                    </span>
                    <button
                      onClick={() => handleOpenDetail(order)}
                      className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-guven-blue hover:text-white text-gray-700 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Détails & Modifier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Référence</th>
                    <th className="py-3.5 px-6">Cliente</th>
                    <th className="py-3.5 px-6">Téléphone</th>
                    <th className="py-3.5 px-6">Ville</th>
                    <th className="py-3.5 px-6">Articles</th>
                    <th className="py-3.5 px-6">Total</th>
                    <th className="py-3.5 px-6">Statut</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {order.customer_name}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {order.customer_phone}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {order.shipping_address_snapshot?.city}, {order.shipping_address_snapshot?.region}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} pièce(s)
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900">
                        {order.total_amount.toFixed(3)} DT
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-guven-blue hover:text-white text-gray-700 font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Détails & Modifier</span>
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

      {/* Order Details & Actions Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative border border-gray-200 space-y-6 printable-area">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-200">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-guven-blue">
                  {isEditingFullOrder ? 'Modification Administrative de Commande' : 'Détail de Commande'}
                </span>
                <h3 className="font-mono text-xl sm:text-2xl font-bold text-gray-900">
                  {selectedOrder.order_number}
                </h3>
                <p className="text-xs text-gray-500">
                  Passée le {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingFullOrder(!isEditingFullOrder)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors no-print ${
                    isEditingFullOrder
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-guven-blue/10 text-guven-blue hover:bg-guven-blue hover:text-white'
                  }`}
                  title="Modifier les détails de la commande"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">{isEditingFullOrder ? 'Fermer l\'édition' : 'Modifier tout'}</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 no-print"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* If in Full Editing Mode */}
            {isEditingFullOrder ? (
              <form onSubmit={handleSaveFullOrder} className="space-y-4 text-xs no-print">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <strong>Mode Administrateur :</strong> Vous pouvez modifier toutes les coordonnées de la cliente, les montants financiers, le statut de paiement et les notes.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nom de la cliente *</label>
                    <input
                      type="text"
                      required
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Téléphone *</label>
                    <input
                      type="text"
                      required
                      value={editCustomerPhone}
                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email cliente</label>
                  <input
                    type="email"
                    value={editGuestEmail}
                    onChange={(e) => setEditGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">Adresse de livraison (Rue, Imm...)</label>
                    <input
                      type="text"
                      value={editStreetAddress}
                      onChange={(e) => setEditStreetAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Code Postal</label>
                    <input
                      type="text"
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Ville / Délégation</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Gouvernorat</label>
                    <input
                      type="text"
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Frais de livraison (DT)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={editShippingAmount}
                      onChange={(e) => setEditShippingAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Remise spéciale (DT)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={editDiscountAmount}
                      onChange={(e) => setEditDiscountAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Statut Paiement</label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none bg-white"
                    >
                      <option value="pending">En attente de paiement (COD)</option>
                      <option value="paid">Payé / Encaissé</option>
                      <option value="refunded">Remboursé</option>
                      <option value="failed">Échec / Impayé</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Instructions / Note cliente</label>
                  <input
                    type="text"
                    value={editCustomerNote}
                    onChange={(e) => setEditCustomerNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingFullOrder(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingOrderEdit}
                    className="px-5 py-2 bg-guven-blue hover:bg-guven-blue-deep text-white font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {savingOrderEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Enregistrer les modifications</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Status Transition Control Bar */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 no-print">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Statut actuel :</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    {selectedOrder.status === 'pending' && (
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('confirmed')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmer la commande</span>
                      </button>
                    )}
                    {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('preparing')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Mettre en préparation</span>
                      </button>
                    )}
                    {selectedOrder.status === 'preparing' && (
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('shipped')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Expédier (Déduire Stock)</span>
                      </button>
                    )}
                    {selectedOrder.status === 'shipped' && (
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('delivered')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marquer Livrée (Paiement Encaissé)</span>
                      </button>
                    )}
                    {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('cancelled')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Annuler (Libérer Stock)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer & Address Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-gray-50 p-4 rounded-2xl">
                    <h4 className="font-bold text-gray-900 mb-2">Informations Cliente</h4>
                    <p><strong>Nom :</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Téléphone :</strong> {selectedOrder.customer_phone}</p>
                    <p><strong>Email :</strong> {selectedOrder.guest_email || 'Non renseigné'}</p>
                    <p><strong>Paiement :</strong> <span className="font-semibold text-guven-blue uppercase">{selectedOrder.payment_status || 'COD'}</span></p>
                  </div>
                  <div className="space-y-1 bg-gray-50 p-4 rounded-2xl">
                    <h4 className="font-bold text-gray-900 mb-2">Adresse de Livraison</h4>
                    <p>{selectedOrder.shipping_address_snapshot?.street_address || (selectedOrder.shipping_address_snapshot as any)?.streetAddress}</p>
                    <p>{selectedOrder.shipping_address_snapshot?.city}, {selectedOrder.shipping_address_snapshot?.region}</p>
                    {(selectedOrder.shipping_address_snapshot?.postal_code || (selectedOrder.shipping_address_snapshot as any)?.postalCode) && (
                      <p>CP: {selectedOrder.shipping_address_snapshot?.postal_code || (selectedOrder.shipping_address_snapshot as any)?.postalCode}</p>
                    )}
                    {selectedOrder.customer_note && (
                      <p className="text-amber-700 italic pt-1">Note cliente : "{selectedOrder.customer_note}"</p>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Articles Commandés</h4>
                  <div className="space-y-2 divide-y divide-gray-200">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {item.image_url_snapshot && (
                            <img
                              src={item.image_url_snapshot}
                              alt={item.product_name_snapshot}
                              className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{item.product_name_snapshot}</p>
                            <p className="text-gray-500 text-[11px]">
                              {item.color_snapshot} • Taille {item.size_snapshot} • SKU: {item.sku_snapshot}
                            </p>
                            <p className="text-gray-600">
                              {item.quantity} × {item.final_unit_price.toFixed(3)} DT
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900">
                          {item.line_total.toFixed(3)} DT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="p-4 rounded-2xl bg-gray-50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total articles</span>
                    <span>{selectedOrder.subtotal_amount.toFixed(3)} DT</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Remise accordée</span>
                      <span>-{selectedOrder.discount_amount.toFixed(3)} DT</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de livraison</span>
                    <span>{selectedOrder.shipping_amount.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total à encaisser</span>
                    <span className="text-guven-blue text-base">{selectedOrder.total_amount.toFixed(3)} DT</span>
                  </div>
                </div>

                {/* Internal Admin Note */}
                <div className="space-y-2 no-print">
                  <label className="block text-xs font-bold text-gray-700">Note interne administrative</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Cliente contactée par téléphone, validation confirmée..."
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                    />
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote}
                      className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </button>
                  </div>
                </div>

                {/* Packing Slip Print Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200 no-print">
                  <button
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimer le Bon de Livraison</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
