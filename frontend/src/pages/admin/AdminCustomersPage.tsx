import React, { useEffect, useState } from 'react';
import { Users, Search, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const res: any = await api.get('/admin/customers');
        setCustomers(res || []);
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Répertoire des Clientes</h1>
        <p className="text-xs text-gray-500 mt-1">
          Historique des commandes et dépenses cumulées par cliente.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 text-guven-blue animate-spin mb-2" />
            <p className="text-xs">Chargement des clientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-sm">Aucune cliente enregistrée pour le moment.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filtered.map((c, idx) => (
                <div key={idx} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm">{c.name}</h4>
                    <span className="text-xs font-bold text-guven-blue bg-blue-50 px-2 py-0.5 rounded-full">
                      {c.totalOrders} commande(s)
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p className="font-mono">{c.phone}</p>
                    <p>{c.email}</p>
                    <p className="text-gray-400">{c.city || 'Tunisie'}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-xs">
                    <span className="text-gray-500 font-semibold">Total dépensé</span>
                    <span className="font-bold text-gray-900">{c.totalSpent.toFixed(3)} DT</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Cliente</th>
                    <th className="py-3.5 px-6">Téléphone</th>
                    <th className="py-3.5 px-6">Email</th>
                    <th className="py-3.5 px-6">Ville</th>
                    <th className="py-3.5 px-6 text-center">Commandes</th>
                    <th className="py-3.5 px-6 text-right">Dépenses Totales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="py-4 px-6 font-bold text-gray-900">{c.name}</td>
                      <td className="py-4 px-6 text-gray-600 font-mono">{c.phone}</td>
                      <td className="py-4 px-6 text-gray-600">{c.email}</td>
                      <td className="py-4 px-6 text-gray-600">{c.city || 'Tunisie'}</td>
                      <td className="py-4 px-6 text-center font-bold text-guven-blue">
                        {c.totalOrders}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-gray-900">
                        {c.totalSpent.toFixed(3)} DT
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
  );
};
