import { getSupabase } from '../config/supabase.js';
import { db } from '../data/dbStore.js';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// In-memory fallback cache only if database is unreachable
const memoryMessages: ContactMessage[] = [];

export class ContactService {
  /**
   * Submit a new contact message
   */
  public static async createMessage(data: {
    name: string;
    email: string;
    phone: string;
    subject?: string;
    message: string;
  }): Promise<ContactMessage> {
    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();
    const cleanSubject = data.subject?.trim() || 'Demande générale';
    const cleanMessage = data.message.trim();

    const newMessage: ContactMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'msg-' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage,
      status: 'unread',
      created_at: new Date().toISOString()
    };

    // Store in local memory
    memoryMessages.unshift(newMessage);

    const supabase = getSupabase();
    if (supabase) {
      try {
        // 1. Try dedicated contact_messages table
        const { data: inserted, error: tableError } = await supabase
          .from('contact_messages')
          .insert({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            subject: cleanSubject,
            message: cleanMessage,
            status: 'unread'
          })
          .select('*')
          .single();

        if (!tableError && inserted) {
          newMessage.id = inserted.id;
        } else {
          // 2. Fallback: store in notifications table with type 'contact_message'
          await supabase.from('notifications').insert({
            type: 'contact_message',
            title: `Message de ${cleanName} (${cleanPhone})`,
            message: JSON.stringify({
              name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              subject: cleanSubject,
              message: cleanMessage,
              status: 'unread'
            })
          });
        }

        // Also add admin notification alert
        await supabase.from('notifications').insert({
          type: 'contact_alert',
          title: `Nouveau message reçu : ${cleanName}`,
          message: `Téléphone: ${cleanPhone} | ${cleanSubject}: ${cleanMessage.substring(0, 100)}...`
        });
      } catch (err) {
        console.warn('[ContactService] Supabase sync warning (stored in memory):', err);
      }
    }

    return newMessage;
  }

  /**
   * Get all contact messages with optional filter and search
   */
  public static async getMessages(options: {
    status?: string;
    search?: string;
  } = {}): Promise<{ messages: ContactMessage[]; unreadCount: number }> {
    const supabase = getSupabase();
    let resultMessages: ContactMessage[] = [];

    if (supabase) {
      try {
        // Try reading from contact_messages
        const { data: dbRows, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && dbRows && dbRows.length > 0) {
          resultMessages = dbRows.map((r: any) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            subject: r.subject || 'Demande générale',
            message: r.message,
            status: r.status || 'unread',
            notes: r.notes,
            created_at: r.created_at,
            updated_at: r.updated_at
          }));
        } else {
          // Fallback: check notifications table for type 'contact_message'
          const { data: notifRows } = await supabase
            .from('notifications')
            .select('*')
            .eq('type', 'contact_message')
            .order('created_at', { ascending: false });

          if (notifRows && notifRows.length > 0) {
            const parsed = notifRows.map((n: any) => {
              try {
                const parsedData = JSON.parse(n.message);
                return {
                  id: n.id,
                  name: parsedData.name || n.title,
                  email: parsedData.email || '',
                  phone: parsedData.phone || '',
                  subject: parsedData.subject || 'Demande',
                  message: parsedData.message || n.message,
                  status: n.read_at ? ('read' as const) : ('unread' as const),
                  created_at: n.created_at
                };
              } catch {
                return {
                  id: n.id,
                  name: n.title,
                  email: '',
                  phone: '',
                  subject: 'Message',
                  message: n.message,
                  status: n.read_at ? ('read' as const) : ('unread' as const),
                  created_at: n.created_at
                };
              }
            });
            // Merge with unique IDs
            const existingIds = new Set(resultMessages.map(m => m.id));
            for (const p of parsed) {
              if (!existingIds.has(p.id)) {
                resultMessages.unshift(p);
                existingIds.add(p.id);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[ContactService] Error fetching from Supabase, using memory:', err);
        resultMessages = [...memoryMessages];
      }
    } else {
      resultMessages = [...memoryMessages];
    }

    // Sort descending by date
    resultMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filter by status if provided
    let filtered = resultMessages;
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter(m => m.status === options.status);
    }

    // Filter by search query if provided
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.subject && m.subject.toLowerCase().includes(q)) ||
          m.message.toLowerCase().includes(q)
      );
    }

    const unreadCount = resultMessages.filter(m => m.status === 'unread').length;

    return {
      messages: filtered,
      unreadCount
    };
  }

  /**
   * Update message status
   */
  public static async updateStatus(id: string, status: 'unread' | 'read' | 'replied'): Promise<boolean> {
    const memMsg = memoryMessages.find(m => m.id === id);
    if (memMsg) {
      memMsg.status = status;
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('contact_messages')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);

        await supabase
          .from('notifications')
          .update({ read_at: status !== 'unread' ? new Date().toISOString() : null })
          .eq('id', id);
      } catch (err) {
        console.warn('[ContactService] Supabase update status error:', err);
      }
    }

    return true;
  }

  /**
   * Delete message
   */
  public static async deleteMessage(id: string): Promise<boolean> {
    const idx = memoryMessages.findIndex(m => m.id === id);
    if (idx !== -1) {
      memoryMessages.splice(idx, 1);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('contact_messages').delete().eq('id', id);
        await supabase.from('notifications').delete().eq('id', id);
      } catch (err) {
        console.warn('[ContactService] Supabase delete error:', err);
      }
    }

    return true;
  }
}
