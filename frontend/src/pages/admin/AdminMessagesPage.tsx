import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, MessageSquare, PhoneCall, CheckCircle2, 
  Clock, Trash2, Search, RefreshCw, Send, CheckCheck, 
  ExternalLink, UserCheck, MessageCircle, AlertCircle, Radio
} from 'lucide-react';
import { api } from '../../api/client.js';
import { supabase } from '../../lib/supabase.js';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  notes?: string;
  created_at: string;
}

export const AdminMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const fetchMessages = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res: any = await api.get('/admin/messages');
      const data = res.data || res;
      setMessages(data.messages || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);

    // ⚡ SUPABASE POSTGRESQL REALTIME WEBSOCKET SUBSCRIPTION
    const channel = supabase
      .channel('guven-realtime-messages-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('[Supabase Realtime] Changement détecté sur public.notifications:', payload);
          fetchMessages(false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_messages' },
        (payload) => {
          console.log('[Supabase Realtime] Changement détecté sur public.contact_messages:', payload);
          fetchMessages(false);
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    // Polling backup
    const interval = setInterval(() => fetchMessages(false), 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'unread' | 'read' | 'replied') => {
    try {
      setUpdatingId(id);
      await api.patch(`/admin/messages/${id}/status`, { status: newStatus });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      if (newStatus === 'read' || newStatus === 'replied') {
        setUnreadCount((c) => Math.max(0, c - 1));
      } else if (newStatus === 'unread') {
        setUnreadCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer définitivement cette demande client ?')) return;
    try {
      setUpdatingId(id);
      await api.delete(`/admin/messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Erreur suppression message:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Format phone number for tel: and wa.me (remove spaces, parentheses, add +216 if local)
  const sanitizePhoneForCall = (phone: string) => {
    return phone.replace(/[^\d+]/g, '');
  };

  const sanitizePhoneForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 8) {
      cleaned = '216' + cleaned; // Add Tunisia country code if 8 digits
    }
    return cleaned;
  };

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    if (filter === 'unread' && m.status !== 'unread') return false;
    if (filter === 'replied' && m.status !== 'replied') return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      m.phone.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      (m.subject && m.subject.toLowerCase().includes(term)) ||
      m.message.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-guven-blue/10 text-guven-blue flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-gray-900">
                Conciergerie & Messages Reçus
              </h1>
              <p className="text-xs text-gray-500">
                Consultez les demandes des clientes, appelez-les en 1 clic ou répondez par WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Supabase Realtime Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`} />
            <span>Supabase PostgreSQL • Temps Réel Actif</span>
          </div>

          <button
            onClick={() => fetchMessages(true)}
            disabled={loading}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-gray-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-guven-blue' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Messages</p>
            <p className="font-serif text-3xl font-bold text-gray-900 mt-1">{messages.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-guven-blue uppercase tracking-wider">Non Lus / En attente</p>
            <p className="font-serif text-3xl font-bold text-guven-blue mt-1">{unreadCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-guven-blue text-white flex items-center justify-center shadow-md">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Traités & Répondus</p>
            <p className="font-serif text-3xl font-bold text-emerald-700 mt-1">
              {messages.filter((m) => m.status === 'replied').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tous ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-white text-guven-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Non Lus</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-guven-blue text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('replied')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === 'replied'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Répondus ({messages.filter((m) => m.status === 'replied').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, téléphone, message..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-guven-blue focus:ring-1 focus:ring-guven-blue shadow-sm"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {loading && messages.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-guven-blue animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Chargement des messages de la conciergerie...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-serif text-base font-bold text-gray-800">Aucun message trouvé</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Aucune demande ne correspond à votre recherche.'
                : 'Toutes les demandes de vos clientes ont été traitées.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUnread = msg.status === 'unread';
            const isReplied = msg.status === 'replied';
            const callNumber = sanitizePhoneForCall(msg.phone);
            const waNumber = sanitizePhoneForWhatsApp(msg.phone);
            const waMessage = `Bonjour ${msg.name}, nous faisons suite à votre message adressé à la maison GÜVEN MODE concernant : "${msg.subject || 'votre demande'}". Comment pouvons-nous vous aider ?`;

            return (
              <div
                key={msg.id}
                className={`bg-white rounded-3xl border transition-all duration-200 p-5 sm:p-6 shadow-sm hover:shadow-md ${
                  isUnread
                    ? 'border-guven-blue/40 ring-1 ring-guven-blue/20 bg-blue-50/20'
                    : isReplied
                    ? 'border-emerald-200/60'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Message details */}
                  <div className="space-y-3 flex-1">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-serif text-lg font-bold text-gray-900">
                        {msg.name}
                      </span>

                      {/* Status Badge */}
                      {isUnread && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-guven-blue text-white shadow-xs">
                          Nouveau / Non lu
                        </span>
                      )}
                      {isReplied && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Répondu & Traité</span>
                        </span>
                      )}
                      {msg.status === 'read' && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                          Lu
                        </span>
                      )}

                      {/* Subject Pill */}
                      {msg.subject && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          {msg.subject}
                        </span>
                      )}

                      <span className="text-[11px] text-gray-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Customer Contact Direct Actions Box */}
                    <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                      {/* Phone Pill */}
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>{msg.phone || 'Non renseigné'}</span>
                      </div>

                      {/* CALL ACTION BUTTON */}
                      {msg.phone && (
                        <a
                          href={`tel:${callNumber}`}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                          title="Appeler directement ce numéro"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Appeler le client</span>
                        </a>
                      )}

                      {/* WHATSAPP ACTION BUTTON */}
                      {msg.phone && (
                        <a
                          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                          title="Ouvrir une discussion WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>WhatsApp Direct</span>
                        </a>
                      )}

                      {/* EMAIL ACTION BUTTON */}
                      {msg.email && (
                        <a
                          href={`mailto:${msg.email}?subject=Réponse GÜVEN MODE : ${encodeURIComponent(msg.subject || 'Votre demande')}`}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1.5 border border-gray-200 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-guven-blue" />
                          <span>{msg.email}</span>
                        </a>
                      )}
                    </div>

                    {/* Message Body */}
                    <div className="p-4 rounded-2xl bg-white border border-gray-100 text-xs sm:text-sm text-gray-800 leading-relaxed font-light whitespace-pre-line shadow-xs">
                      {msg.message}
                    </div>
                  </div>

                  {/* Right: Status Actions */}
                  <div className="flex lg:flex-col items-center gap-2 justify-end lg:justify-start flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    {msg.status !== 'replied' ? (
                      <button
                        onClick={() => handleUpdateStatus(msg.id, 'replied')}
                        disabled={updatingId === msg.id}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 transition-colors"
                        title="Marquer comme traité"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Marquer Répondu</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(msg.id, 'unread')}
                        disabled={updatingId === msg.id}
                        className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold flex items-center gap-1.5 border border-gray-200 transition-colors"
                        title="Marquer comme non lu"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Remettre en attente</span>
                      </button>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => handleUpdateStatus(msg.id, 'read')}
                        disabled={updatingId === msg.id}
                        className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium flex items-center gap-1.5 border border-gray-200 transition-colors"
                      >
                        <span>Marquer Lu</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(msg.id)}
                      disabled={updatingId === msg.id}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors ml-auto lg:ml-0"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
