import { db } from '../data/dbStore.js';
import { Order, OrderStatus } from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';
import { getSupabase } from '../config/supabase.js';

export function mapSupabaseOrder(o: any): Order {
  const items = (o.items || []).map((i: any) => ({
    id: i.id,
    order_id: i.order_id,
    product_id: i.product_id,
    variant_id: i.variant_id,
    product_name_snapshot: i.product_name_snapshot || i.product_name || 'Article',
    sku_snapshot: i.sku_snapshot || i.sku || 'SKU',
    size_snapshot: i.size_snapshot || 'TU',
    color_snapshot: i.color_snapshot || 'Standard',
    image_url_snapshot: i.image_url_snapshot || undefined,
    quantity: Number(i.quantity) || 1,
    original_unit_price: Number(i.original_unit_price || i.price) || 0,
    unit_discount: Number(i.unit_discount) || 0,
    final_unit_price: Number(i.final_unit_price || i.price) || 0,
    line_total: Number(i.line_total || i.subtotal) || 0,
    created_at: i.created_at || new Date().toISOString()
  }));

  const addr = o.shipping_address_snapshot || o.shipping_address || {};

  return {
    id: o.id,
    order_number: o.order_number,
    customer_id: o.customer_id,
    guest_email: o.guest_email || o.customer_email,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    status: o.status as OrderStatus,
    payment_status: o.payment_status,
    payment_method: o.payment_method || 'cod',
    currency: o.currency || 'TND',
    subtotal_amount: Number(o.subtotal_amount) || 0,
    discount_amount: Number(o.discount_amount) || 0,
    shipping_amount: Number(o.shipping_amount ?? o.shipping_fee) || 0,
    tax_amount: Number(o.tax_amount) || 0,
    total_amount: Number(o.total_amount) || 0,
    shipping_address_snapshot: {
      recipient_name: addr.recipient_name || o.customer_name,
      phone: addr.phone || o.customer_phone,
      region: addr.region || 'Tunis',
      city: addr.city || 'Tunis',
      street_address: addr.street_address || '',
      postal_code: addr.postal_code,
      notes: addr.notes
    },
    customer_note: o.customer_note,
    admin_note: o.admin_note,
    idempotency_key: o.idempotency_key,
    placed_at: o.placed_at || o.created_at,
    confirmed_at: o.confirmed_at,
    shipped_at: o.shipped_at,
    delivered_at: o.delivered_at,
    cancelled_at: o.cancelled_at,
    created_at: o.created_at,
    updated_at: o.updated_at,
    items
  };
}

export class OrderService {
  public static async getOrders(filters?: {
    status?: string;
    payment_status?: string;
    search?: string;
    customer_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.payment_status && filters.payment_status !== 'all') {
        query = query.eq('payment_status', filters.payment_status);
      }

      const { data, count, error } = await query;
      if (!error && data) {
        let orders = data.map(mapSupabaseOrder);
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          orders = orders.filter(o =>
            o.order_number.toLowerCase().includes(q) ||
            o.customer_name.toLowerCase().includes(q) ||
            o.customer_phone.includes(q) ||
            (o.guest_email && o.guest_email.toLowerCase().includes(q))
          );
        }

        const total = count || orders.length;
        const offset = filters?.offset || 0;
        const limit = filters?.limit || 50;
        return { orders: orders.slice(offset, offset + limit), total };
      }
    }

    // Fallback store
    let result = [...db.orders];
    if (filters?.customer_id) result = result.filter(o => o.customer_id === filters.customer_id);
    if (filters?.status && filters.status !== 'all') result = result.filter(o => o.status === filters.status);
    if (filters?.payment_status && filters.payment_status !== 'all') result = result.filter(o => o.payment_status === filters.payment_status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
      );
    }

    const total = result.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    return { orders: result.slice(offset, offset + limit), total };
  }

  public static async getOrderById(id: string): Promise<Order | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseOrder(data);
      }
    }

    return db.orders.find(o => o.id === id) || null;
  }

  public static async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .ilike('order_number', orderNumber)
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseOrder(data);
      }
    }

    return db.orders.find(o => o.order_number.toUpperCase() === orderNumber.toUpperCase()) || null;
  }

  public static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    adminId?: string,
    note?: string
  ): Promise<Order> {
    const supabase = getSupabase();
    if (supabase) {
      const updatePayload: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      if (newStatus === 'confirmed') updatePayload.confirmed_at = new Date().toISOString();
      if (newStatus === 'shipped') updatePayload.shipped_at = new Date().toISOString();
      if (newStatus === 'delivered') {
        updatePayload.delivered_at = new Date().toISOString();
        updatePayload.payment_status = 'paid';
      }
      if (newStatus === 'cancelled') updatePayload.cancelled_at = new Date().toISOString();

      await supabase.from('orders').update(updatePayload).eq('id', orderId);

      // Add status history entry
      await supabase.from('order_status_history').insert({
        id: uuidv4(),
        order_id: orderId,
        old_status: 'status_changed',
        new_status: newStatus,
        changed_by: adminId || null,
        note: note || `Statut mis à jour vers ${newStatus}`
      });

      const updated = await OrderService.getOrderById(orderId);
      if (updated) return updated;
    }

    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Commande introuvable');
    order.status = newStatus;
    order.updated_at = new Date().toISOString();
    return order;
  }

  public static async updateAdminNote(id: string, note: string): Promise<Order> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('orders').update({ admin_note: note, updated_at: new Date().toISOString() }).eq('id', id);
      const updated = await OrderService.getOrderById(id);
      if (updated) return updated;
    }
    const order = db.orders.find(o => o.id === id);
    if (!order) throw new Error('Commande introuvable');
    order.admin_note = note;
    order.updated_at = new Date().toISOString();
    return order;
  }

  public static async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const supabase = getSupabase();
    if (supabase) {
      const updateData: any = {};
      if (data.customer_name) updateData.customer_name = data.customer_name;
      if (data.customer_phone) updateData.customer_phone = data.customer_phone;
      if (data.guest_email) updateData.guest_email = data.guest_email;
      if (data.status) updateData.status = data.status;
      if (data.payment_status) updateData.payment_status = data.payment_status;
      if (data.admin_note !== undefined) updateData.admin_note = data.admin_note;
      updateData.updated_at = new Date().toISOString();

      await supabase.from('orders').update(updateData).eq('id', id);
      const updated = await OrderService.getOrderById(id);
      if (updated) return updated;
    }
    const order = db.orders.find(o => o.id === id);
    if (!order) throw new Error('Commande introuvable');
    Object.assign(order, { ...data, updated_at: new Date().toISOString() });
    return order;
  }
}
