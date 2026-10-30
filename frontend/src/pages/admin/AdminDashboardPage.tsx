import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, ShoppingBag, Clock, CheckCircle2, 
  AlertTriangle, ArrowRight, Loader2, Sparkles, DollarSign 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { api } from '../../api/client.js';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res: any = await api.get('/admin/dashboard');
        setData(res);
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500 space-y-3">
        <Loader2 className="w-8 h-8 text-guven-blue animate-spin" />
        <p className="text-xs uppercase font-semibold tracking-wider">Chargement des indicateurs réels...</p>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const salesChart = data?.salesChart || [];
  const topSelling = data?.topSelling || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-xs text-gray-500 mt-1">
            Indicateurs en temps réel calculés directement depuis la base de données.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Données Synchronisées
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Chiffre d'Affaires Net
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(kpi.totalRevenue || 0).toFixed(3)} <span className="text-sm font-semibold text-gray-500">DT</span>
          </p>
          <p className="text-[11px] text-gray-500">
            Hors commandes annulées
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Commandes
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-guven-blue flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {kpi.totalOrders || 0}
          </p>
          <p className="text-[11px] text-gray-500">
            {kpi.pendingOrders || 0} en attente de traitement
          </p>
        </div>

        {/* Shipped & Delivered */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Commandes Livrées
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {kpi.deliveredOrders || 0}
          </p>
          <p className="text-[11px] text-gray-500">
            {kpi.shippedOrders || 0} actuellement en livraison
          </p>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Alertes de Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {(kpi.lowStockCount || 0) + (kpi.outOfStockCount || 0)}
          </p>
          <p className="text-[11px] text-gray-500">
            {kpi.lowStockCount || 0} stock faible • {kpi.outOfStockCount || 0} rupture
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Évolution des Ventes</h3>
              <p className="text-xs text-gray-500">Revenus générés sur les 7 derniers jours</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
              Devise : TND (DT)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1598C8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1598C8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} DT`} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(3)} DT`, 'Ventes']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#1598C8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">Meilleures Ventes</h3>
          {topSelling.length === 0 ? (
            <p className="text-xs text-gray-500 py-12 text-center">Aucune vente enregistrée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {topSelling.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-500">{item.quantity} pièce(s) vendue(s)</p>
                  </div>
                  <span className="text-xs font-bold text-guven-blue">
                    {item.revenue.toFixed(3)} DT
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Dernières Commandes</h3>
            <p className="text-xs text-gray-500">Commandes reçues récemment nécessitant une attention</p>
          </div>
          <Link
            to="/admin/commandes"
            className="text-xs font-bold text-guven-blue hover:underline flex items-center gap-1"
          >
            <span>Voir toutes les commandes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-gray-100">
          {recentOrders.map((order: any) => (
            <div key={order.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {order.order_number}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  <p className="text-[11px] text-gray-400">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{order.total_amount.toFixed(3)} DT</p>
                  <Link
                    to="/admin/commandes"
                    className="text-[11px] font-semibold text-guven-blue hover:underline inline-block mt-0.5"
                  >
                    Gérer →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-6">Référence</th>
                <th className="py-3 px-6">Cliente</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Montant</th>
                <th className="py-3 px-6">Statut</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-gray-900">{order.customer_name}</p>
                    <p className="text-[11px] text-gray-500">{order.customer_phone}</p>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-900">
                    {order.total_amount.toFixed(3)} DT
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to="/admin/commandes"
                      className="text-xs font-semibold text-guven-blue hover:underline"
                    >
                      Gérer →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
