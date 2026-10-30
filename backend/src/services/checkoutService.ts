import { db } from '../data/dbStore.js';
import { Order, OrderItem } from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';
import { getSupabase } from '../config/supabase.js';
import { mapSupabaseOrder } from './orderService.js';

export interface CheckoutInput {
  customerId?: string | null;
  guestEmail?: string | null;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    recipientName: string;
    phone: string;
    region: string;
    city: string;
    streetAddress: string;
    postalCode?: string;
    notes?: string;
  };
  shippingMethodId?: string;
  paymentMethod: string;
  items: { variantId: string; quantity: number }[];
  promoCode?: string;
  customerNote?: string;
  idempotencyKey?: string;
}

export class CheckoutService {
  public static async processCheckout(input: CheckoutInput): Promise<Order> {
    const supabase = getSupabase();

    // 1. Idempotency Check
    if (input.idempotencyKey && supabase) {
      const { data: existing } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('idempotency_key', input.idempotencyKey)
        .maybeSingle();

      if (existing) {
        return mapSupabaseOrder(existing);
      }
    }

    // 2. Validate input customer details
    if (!input.customerName || input.customerName.trim().length === 0) {
      throw new Error('Nom du client requis');
    }
    if (!input.customerPhone || input.customerPhone.trim().length === 0) {
      throw new Error('Numéro de téléphone requis');
    }
    if (!input.items || input.items.length === 0) {
      throw new Error('Le panier est vide');
    }

    // 3. Resolve items from Supabase or memory
    let subtotal = 0;
    const resolvedItems: {
      productId: string;
      productName: string;
      variantId: string;
      sku: string;
      size: string;
      color: string;
      imageUrl?: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    if (supabase) {
      const variantIds = input.items.map(i => i.variantId);
      const { data: dbVariants, error: vErr } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products(*, images:product_images(*)),
          inventory:inventory(*)
        `)
        .in('id', variantIds);

      if (vErr || !dbVariants) {
        throw new Error('Erreur de récupération des articles');
      }

      for (const item of input.items) {
        const v = dbVariants.find(va => va.id === item.variantId);
        if (!v || !v.product || v.product.status !== 'published') {
          throw new Error('Article introuvable ou indisponible');
        }

        const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
        const qHand = inv ? Number(inv.quantity_on_hand) || 0 : 0;
        const qRes = inv ? Number(inv.quantity_reserved) || 0 : 0;
        const available = Math.max(0, qHand - qRes);

        if (available < item.quantity) {
          throw new Error(
            `Stock insuffisant pour ${v.product.name} (${v.color_name} - ${v.size_label}). ` +
            `Disponible : ${available} pièce(s)`
          );
        }

        const unitPrice = v.price_override != null ? Number(v.price_override) : Number(v.product.base_price);
        const lineTotal = Number((unitPrice * item.quantity).toFixed(3));
        subtotal += lineTotal;

        const primaryImg = (v.product.images || []).find((img: any) => img.is_primary)?.storage_path || v.product.images?.[0]?.storage_path;

        resolvedItems.push({
          productId: v.product.id,
          productName: v.product.name,
          variantId: v.id,
          sku: v.sku,
          size: v.size_label,
          color: v.color_name,
          imageUrl: primaryImg,
          quantity: item.quantity,
          unitPrice,
          lineTotal
        });
      }
    } else {
      // Memory fallback
      for (const item of input.items) {
        let foundVariant: any = null;
        let foundProduct: any = null;
        for (const prod of db.products) {
          const v = prod.variants.find(va => va.id === item.variantId);
          if (v) { foundVariant = v; foundProduct = prod; break; }
        }
        if (!foundVariant || !foundProduct) throw new Error('Article introuvable');
        const unitPrice = foundVariant.price_override ?? foundProduct.base_price;
        const lineTotal = Number((unitPrice * item.quantity).toFixed(3));
        subtotal += lineTotal;
        resolvedItems.push({
          productId: foundProduct.id,
          productName: foundProduct.name,
          variantId: foundVariant.id,
          sku: foundVariant.sku,
          size: foundVariant.size_label,
          color: foundVariant.color_name,
          imageUrl: foundProduct.images?.[0]?.storage_path,
          quantity: item.quantity,
          unitPrice,
          lineTotal
        });
      }
    }

    subtotal = Number(subtotal.toFixed(3));

    // 4. Promotions / Discount calculation
    let discountAmount = 0;
    if (input.promoCode && input.promoCode.trim().length > 0) {
      const code = input.promoCode.trim().toUpperCase();
      let promo: any = null;

      if (supabase) {
        const { data: dbPromo } = await supabase
          .from('promotions')
          .select('*')
          .ilike('code', code)
          .eq('is_active', true)
          .maybeSingle();
        promo = dbPromo;
      } else {
        promo = db.promotions.find(p => p.code?.toUpperCase() === code && p.is_active);
      }

      if (!promo) {
        throw new Error('Code promo invalide');
      }

      const now = new Date();
      if (new Date(promo.starts_at) > now || (promo.ends_at && new Date(promo.ends_at) < now)) {
        throw new Error('Code promo expiré');
      }

      if (promo.min_order_amount && subtotal < Number(promo.min_order_amount)) {
        throw new Error(`Montant minimum de ${promo.min_order_amount} TND requis pour ce code promo`);
      }

      if (promo.discount_type === 'percentage') {
        discountAmount = Number(((subtotal * Number(promo.discount_value)) / 100).toFixed(3));
      } else {
        discountAmount = Math.min(Number(promo.discount_value), subtotal);
      }
    }

    // 5. Shipping calculation
    let shippingAmount = 7.000;
    if (subtotal >= 180.000) {
      shippingAmount = 0.000;
    }

    const totalAmount = Number((subtotal - discountAmount + shippingAmount).toFixed(3));

    // 6. Generate sequential order number
    let orderCount = 0;
    if (supabase) {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      orderCount = count || 0;
    } else {
      orderCount = db.orders.length;
    }

    const nextNum = 1000 + orderCount + 1;
    const orderNumber = `GM-${new Date().getFullYear()}-${nextNum}`;
    const orderId = uuidv4();

    const shippingSnapshot = {
      recipient_name: input.shippingAddress.recipientName,
      phone: input.shippingAddress.phone,
      region: input.shippingAddress.region,
      city: input.shippingAddress.city,
      street_address: input.shippingAddress.streetAddress,
      postal_code: input.shippingAddress.postalCode,
      notes: input.shippingAddress.notes
    };

    if (supabase) {
      // Insert into Supabase orders
      const { error: ordErr } = await supabase.from('orders').insert({
        id: orderId,
        order_number: orderNumber,
        customer_id: input.customerId || null,
        guest_email: input.guestEmail || null,
        customer_name: input.customerName.trim(),
        customer_phone: input.customerPhone.trim(),
        status: 'pending',
        payment_status: 'pending',
        payment_method: input.paymentMethod || 'cod',
        currency: 'TND',
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        tax_amount: 0,
        total_amount: totalAmount,
        shipping_address_snapshot: shippingSnapshot,
        customer_note: input.customerNote || null,
        idempotency_key: input.idempotencyKey || null,
        placed_at: new Date().toISOString()
      });

      if (ordErr) {
        console.error('Order creation error:', ordErr);
        throw new Error('Erreur lors de la création de la commande');
      }

      // Insert order items
      for (const item of resolvedItems) {
        await supabase.from('order_items').insert({
          id: uuidv4(),
          order_id: orderId,
          product_id: item.productId,
          variant_id: item.variantId,
          product_name_snapshot: item.productName,
          sku_snapshot: item.sku,
          size_snapshot: item.size,
          color_snapshot: item.color,
          image_url_snapshot: item.imageUrl,
          quantity: item.quantity,
          original_unit_price: item.unitPrice,
          unit_discount: 0,
          final_unit_price: item.unitPrice,
          line_total: item.lineTotal
        });

        // Update inventory reservation
        const { data: inv } = await supabase.from('inventory').select('*').eq('variant_id', item.variantId).maybeSingle();
        if (inv) {
          const newRes = (inv.quantity_reserved || 0) + item.quantity;
          await supabase.from('inventory').update({ quantity_reserved: newRes }).eq('variant_id', item.variantId);
        }
      }

      // Create Admin Notification
      await supabase.from('notifications').insert({
        id: uuidv4(),
        type: 'order_created',
        title: `Nouvelle commande ${orderNumber}`,
        message: `${input.customerName} a passé commande pour ${totalAmount.toFixed(3)} DT (${resolvedItems.length} article(s) - ${input.shippingAddress.city})`,
        related_entity_id: orderId,
        created_at: new Date().toISOString()
      });

      const finalOrder = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single();

      if (finalOrder.data) {
        return mapSupabaseOrder(finalOrder.data);
      }
    }

    // Memory fallback
    const memOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      customer_id: input.customerId || null,
      guest_email: input.guestEmail || null,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      status: 'pending',
      payment_status: 'pending',
      payment_method: input.paymentMethod || 'cod',
      currency: 'TND',
      subtotal_amount: subtotal,
      discount_amount: discountAmount,
      shipping_amount: shippingAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      shipping_address_snapshot: shippingSnapshot,
      customer_note: input.customerNote || null,
      admin_note: null,
      idempotency_key: input.idempotencyKey || null,
      placed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: resolvedItems.map(i => ({
        id: uuidv4(),
        order_id: orderId,
        product_id: i.productId,
        variant_id: i.variantId,
        product_name_snapshot: i.productName,
        sku_snapshot: i.sku,
        size_snapshot: i.size,
        color_snapshot: i.color,
        image_url_snapshot: i.imageUrl,
        quantity: i.quantity,
        original_unit_price: i.unitPrice,
        unit_discount: 0,
        final_unit_price: i.unitPrice,
        line_total: i.lineTotal,
        created_at: new Date().toISOString()
      }))
    };

    db.orders.unshift(memOrder);
    return memOrder;
  }
}
