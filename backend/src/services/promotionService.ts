import { db } from '../data/dbStore.js';
import { Promotion } from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';
import { getSupabase } from '../config/supabase.js';

export class PromotionService {
  public static async getActivePromotions(): Promise<Promotion[]> {
    const supabase = getSupabase();
    if (supabase) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now);

      if (!error && data) {
        return data.filter(p => !p.ends_at || new Date(p.ends_at) >= new Date()) as Promotion[];
      }
    }

    const now = new Date();
    return db.promotions.filter(p => 
      p.is_active &&
      new Date(p.starts_at) <= now &&
      (!p.ends_at || new Date(p.ends_at) >= now) &&
      (!p.usage_limit || p.usage_count < p.usage_limit)
    );
  }

  public static async getAllPromotions(): Promise<Promotion[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data as Promotion[];
      }
    }
    return db.promotions;
  }

  public static async validateCode(code: string, subtotal: number): Promise<{
    valid: boolean;
    promotion?: Promotion;
    discountAmount: number;
    message?: string;
  }> {
    const cleanCode = code.trim().toUpperCase();
    const supabase = getSupabase();
    let promo: any = null;

    if (supabase) {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .ilike('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        promo = data;
      }
    }

    if (!promo) {
      promo = db.promotions.find(
        p => p.code?.toUpperCase() === cleanCode && p.is_active
      );
    }

    if (!promo) {
      return { valid: false, discountAmount: 0, message: 'Code promotionnel introuvable ou inactif' };
    }

    const now = new Date();
    if (new Date(promo.starts_at) > now || (promo.ends_at && new Date(promo.ends_at) < now)) {
      return { valid: false, discountAmount: 0, message: 'Ce code promo a expiré' };
    }

    const minAmount = Number(promo.min_order_amount) || 0;
    if (minAmount > 0 && subtotal < minAmount) {
      return { 
        valid: false, 
        discountAmount: 0, 
        message: `Montant minimum de commande de ${minAmount} TND requis` 
      };
    }

    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return { valid: false, discountAmount: 0, message: 'Ce code promo a atteint sa limite d\'utilisation' };
    }

    let discount = 0;
    const val = Number(promo.discount_value) || 0;
    if (promo.discount_type === 'percentage') {
      discount = Number(((subtotal * val) / 100).toFixed(3));
    } else {
      discount = Math.min(val, subtotal);
    }

    return {
      valid: true,
      promotion: promo as Promotion,
      discountAmount: discount
    };
  }

  public static async createPromotion(data: Partial<Promotion>): Promise<Promotion> {
    const supabase = getSupabase();
    const id = data.id || uuidv4();
    const newPromo: Promotion = {
      id,
      name: data.name || 'Offre Spéciale',
      code: data.code ? data.code.toUpperCase().trim() : null,
      discount_type: data.discount_type || 'percentage',
      discount_value: Number(data.discount_value) || 10,
      starts_at: data.starts_at || new Date().toISOString(),
      ends_at: data.ends_at || null,
      min_order_amount: data.min_order_amount ? Number(data.min_order_amount) : 0,
      usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
      usage_count: 0,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      await supabase.from('promotions').insert(newPromo);
      return newPromo;
    }

    db.promotions.push(newPromo);
    return newPromo;
  }

  public static async updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('promotions').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
      const { data: updated } = await supabase.from('promotions').select('*').eq('id', id).single();
      if (updated) return updated as Promotion;
    }

    const p = db.promotions.find(pr => pr.id === id);
    if (!p) throw new Error('Promotion introuvable');
    Object.assign(p, { ...data, updated_at: new Date().toISOString() });
    return p;
  }

  public static async deletePromotion(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      return !error;
    }

    const idx = db.promotions.findIndex(p => p.id === id);
    if (idx === -1) return false;
    db.promotions.splice(idx, 1);
    return true;
  }
}
