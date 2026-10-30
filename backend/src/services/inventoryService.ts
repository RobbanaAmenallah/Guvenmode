import { db } from '../data/dbStore.js';
import { uuidv4 } from '../utils/uuid.js';
import { getSupabase } from '../config/supabase.js';
import { ProductService } from './productService.js';

export interface InventoryItemView {
  variant_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  sku: string;
  color_name: string;
  color_hex: string;
  size_label: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  available_stock: number;
  low_stock_threshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export class InventoryService {
  public static async getInventoryList(): Promise<InventoryItemView[]> {
    const supabase = getSupabase();

    if (supabase) {
      const { products } = await ProductService.getProducts({ status: 'all', limit: 500 });
      const list: InventoryItemView[] = [];

      for (const prod of products) {
        const primaryImg = prod.images.find(img => img.is_primary)?.storage_path || prod.images[0]?.storage_path || '';
        for (const v of prod.variants) {
          const inv = v.inventory || {
            quantity_on_hand: 0,
            quantity_reserved: 0,
            available_stock: 0,
            low_stock_threshold: 2
          };

          const available = inv.available_stock;
          let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          if (available <= 0) status = 'out_of_stock';
          else if (available <= inv.low_stock_threshold) status = 'low_stock';

          list.push({
            variant_id: v.id,
            product_id: prod.id,
            product_name: prod.name,
            product_image: primaryImg,
            sku: v.sku,
            color_name: v.color_name,
            color_hex: v.color_hex,
            size_label: v.size_label,
            quantity_on_hand: inv.quantity_on_hand,
            quantity_reserved: inv.quantity_reserved,
            available_stock: available,
            low_stock_threshold: inv.low_stock_threshold,
            status
          });
        }
      }

      return list;
    }

    // Memory fallback
    const list: InventoryItemView[] = [];
    for (const prod of db.products) {
      const primaryImg = prod.images.find(img => img.is_primary)?.storage_path || prod.images[0]?.storage_path || '';
      for (const v of prod.variants) {
        const inv = v.inventory || {
          quantity_on_hand: 0,
          quantity_reserved: 0,
          available_stock: 0,
          low_stock_threshold: 3
        };
        const available = inv.quantity_on_hand - inv.quantity_reserved;
        let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
        if (available <= 0) status = 'out_of_stock';
        else if (available <= inv.low_stock_threshold) status = 'low_stock';

        list.push({
          variant_id: v.id,
          product_id: prod.id,
          product_name: prod.name,
          product_image: primaryImg,
          sku: v.sku,
          color_name: v.color_name,
          color_hex: v.color_hex,
          size_label: v.size_label,
          quantity_on_hand: inv.quantity_on_hand,
          quantity_reserved: inv.quantity_reserved,
          available_stock: available,
          low_stock_threshold: inv.low_stock_threshold,
          status
        });
      }
    }
    return list;
  }

  public static async adjustStock(
    variantId: string,
    newOnHand: number,
    adminId?: string,
    reason: string = 'Ajustement manuel'
  ): Promise<{ variant_id: string; newOnHand: number; delta: number }> {
    const supabase = getSupabase();

    if (supabase) {
      const { data: inv } = await supabase.from('inventory').select('*').eq('variant_id', variantId).maybeSingle();
      if (!inv) throw new Error('Stock introuvable pour cette variante');

      const prevHand = Number(inv.quantity_on_hand) || 0;
      const prevRes = Number(inv.quantity_reserved) || 0;

      if (newOnHand < prevRes) {
        throw new Error(`Le stock physique (${newOnHand}) ne peut pas être inférieur au stock réservé (${prevRes})`);
      }

      const delta = newOnHand - prevHand;
      await supabase.from('inventory').update({ quantity_on_hand: newOnHand }).eq('variant_id', variantId);

      // Record movement
      await supabase.from('inventory_movements').insert({
        id: uuidv4(),
        variant_id: variantId,
        movement_type: delta >= 0 ? 'restock' : 'adjustment',
        quantity_delta: delta,
        quantity_before: prevHand,
        quantity_after: newOnHand,
        reserved_before: prevRes,
        reserved_after: prevRes,
        reason,
        reference_type: 'manual_adjustment',
        created_at: new Date().toISOString()
      });

      return { variant_id: variantId, newOnHand, delta };
    }

    // Memory fallback
    for (const prod of db.products) {
      const v = prod.variants.find(va => va.id === variantId);
      if (v && v.inventory) {
        const prevHand = v.inventory.quantity_on_hand;
        const delta = newOnHand - prevHand;
        v.inventory.quantity_on_hand = newOnHand;
        v.inventory.available_stock = newOnHand - v.inventory.quantity_reserved;
        return { variant_id: variantId, newOnHand, delta };
      }
    }

    throw new Error('Variante introuvable');
  }

  public static async getMovements(variantId?: string) {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(50);
      if (variantId) query = query.eq('variant_id', variantId);
      const { data } = await query;
      if (data) return data;
    }
    return db.inventoryMovements;
  }
}
