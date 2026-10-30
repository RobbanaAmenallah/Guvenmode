import { getSupabase } from '../config/supabase.js';
import { uuidv4 } from '../utils/uuid.js';
import { mapSupabaseProduct } from './productService.js';
import { Product, ProductVariant } from '../types/index.js';

export interface FormattedCartItem {
  variant_id: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
}

export class CartService {
  public static async getOrCreateCartId(customerId: string): Promise<string> {
    const supabase = getSupabase();
    if (!supabase) return uuidv4();

    const { data: existing } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (existing?.id) {
      return existing.id;
    }

    const newId = uuidv4();
    await supabase.from('carts').insert({
      id: newId,
      customer_id: customerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return newId;
  }

  public static async getCustomerCart(customerId: string): Promise<FormattedCartItem[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const cartId = await CartService.getOrCreateCartId(customerId);

    const { data: items, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        variant_id,
        variant:product_variants(
          *,
          product:products(
            *,
            category:categories(*),
            images:product_images(*),
            videos:product_videos(*)
          ),
          inventory:inventory(*)
        )
      `)
      .eq('cart_id', cartId);

    if (error || !items) return [];

    const formatted: FormattedCartItem[] = [];

    for (const item of items) {
      const v = (item as any).variant;
      if (!v || !v.product) continue;

      const prod = mapSupabaseProduct(v.product);
      const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
      const qHand = inv ? Number(inv.quantity_on_hand) || 0 : 0;
      const qRes = inv ? Number(inv.quantity_reserved) || 0 : 0;

      const variant: ProductVariant = {
        id: v.id,
        product_id: v.product_id,
        sku: v.sku,
        color_name: v.color_name,
        color_hex: v.color_hex,
        size_label: v.size_label,
        price_override: v.price_override != null ? Number(v.price_override) : null,
        is_active: v.is_active !== false,
        created_at: v.created_at,
        updated_at: v.updated_at,
        inventory: {
          quantity_on_hand: qHand,
          quantity_reserved: qRes,
          available_stock: Math.max(0, qHand - qRes),
          low_stock_threshold: inv ? Number(inv.low_stock_threshold) || 2 : 2
        }
      };

      formatted.push({
        variant_id: v.id,
        quantity: item.quantity,
        product: prod,
        variant
      });
    }

    return formatted;
  }

  public static async syncCustomerCart(
    customerId: string,
    items: { variantId: string; quantity: number }[]
  ): Promise<FormattedCartItem[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const cartId = await CartService.getOrCreateCartId(customerId);

    // Delete existing cart items
    await supabase.from('cart_items').delete().eq('cart_id', cartId);

    // Insert new items
    for (const item of items) {
      if (item.quantity > 0) {
        await supabase.from('cart_items').insert({
          id: uuidv4(),
          cart_id: cartId,
          variant_id: item.variantId,
          quantity: item.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Touch cart updated_at
    await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId);

    return CartService.getCustomerCart(customerId);
  }

  public static async mergeCustomerCart(
    customerId: string,
    guestItems: { variantId: string; quantity: number }[]
  ): Promise<FormattedCartItem[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const cartId = await CartService.getOrCreateCartId(customerId);

    // Get current items in database cart
    const { data: currentItems } = await supabase
      .from('cart_items')
      .select('variant_id, quantity')
      .eq('cart_id', cartId);

    const mergedMap = new Map<string, number>();

    // Add existing database items
    (currentItems || []).forEach(ci => {
      mergedMap.set(ci.variant_id, ci.quantity);
    });

    // Merge guest items (if already in cart, take max or sum up to available stock)
    for (const gi of guestItems) {
      const existing = mergedMap.get(gi.variantId) || 0;
      mergedMap.set(gi.variantId, Math.max(existing, gi.quantity));
    }

    const itemsToSync = Array.from(mergedMap.entries()).map(([variantId, quantity]) => ({
      variantId,
      quantity
    }));

    return CartService.syncCustomerCart(customerId, itemsToSync);
  }

  public static async clearCustomerCart(customerId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return true;

    const cartId = await CartService.getOrCreateCartId(customerId);
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
    return !error;
  }
}
