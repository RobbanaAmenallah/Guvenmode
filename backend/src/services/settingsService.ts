import { db } from '../data/dbStore.js';
import { ShippingMethod } from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';
import { getSupabase } from '../config/supabase.js';

export class SettingsService {
  public static async getPublicSettings() {
    const supabase = getSupabase();
    if (supabase) {
      const { data: rows } = await supabase.from('site_settings').select('*');
      if (rows && rows.length > 0) {
        const settingsMap: Record<string, any> = {};
        rows.forEach(r => {
          settingsMap[r.key] = r.value_json;
        });

        const { data: shippingMethods } = await supabase.from('shipping_methods').select('*').eq('is_active', true);

        return {
          settings: {
            ...db.siteSettings,
            ...settingsMap
          },
          shippingMethods: shippingMethods && shippingMethods.length > 0 ? shippingMethods : db.shippingMethods.filter(s => s.is_active),
          currency: settingsMap.general?.currency || 'TND',
          currency_symbol: settingsMap.general?.currency_symbol || 'DT'
        };
      }
    }

    return {
      settings: db.siteSettings,
      shippingMethods: db.shippingMethods.filter(s => s.is_active),
      currency: 'TND',
      currency_symbol: 'DT'
    };
  }

  public static async getAllSettings() {
    const supabase = getSupabase();
    if (supabase) {
      const { data: rows } = await supabase.from('site_settings').select('*');
      if (rows && rows.length > 0) {
        const settingsMap: Record<string, any> = {};
        rows.forEach(r => {
          settingsMap[r.key] = r.value_json;
        });

        const { data: shippingMethods } = await supabase.from('shipping_methods').select('*');

        return {
          settings: {
            ...db.siteSettings,
            ...settingsMap
          },
          shippingMethods: shippingMethods && shippingMethods.length > 0 ? shippingMethods : db.shippingMethods
        };
      }
    }

    return {
      settings: db.siteSettings,
      shippingMethods: db.shippingMethods
    };
  }

  public static async updateSettings(key: string, value: any) {
    const supabase = getSupabase();
    if (supabase) {
      const { data: existing } = await supabase.from('site_settings').select('*').eq('key', key).maybeSingle();
      const updatedValue = {
        ...(existing?.value_json || db.siteSettings[key] || {}),
        ...value
      };

      await supabase.from('site_settings').upsert({
        key,
        value_json: updatedValue,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      db.siteSettings[key] = updatedValue;
      return updatedValue;
    }

    db.siteSettings[key] = {
      ...db.siteSettings[key],
      ...value
    };
    return db.siteSettings[key];
  }

  public static async updateShippingMethod(id: string, data: Partial<ShippingMethod>) {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('shipping_methods').update(data).eq('id', id);
    }
    const method = db.shippingMethods.find(m => m.id === id);
    if (method) Object.assign(method, data);
    return method;
  }

  public static async subscribeNewsletter(email: string) {
    if (!email || !email.includes('@')) {
      throw new Error('Adresse email invalide');
    }
    const cleanEmail = email.toLowerCase().trim();
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('newsletter_subscriptions').upsert({
        email: cleanEmail,
        consent_at: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'email' });
    }

    const exists = db.newsletter.find(n => n.email.toLowerCase() === cleanEmail);
    if (!exists) {
      db.newsletter.push({
        id: uuidv4(),
        email: cleanEmail,
        created_at: new Date().toISOString()
      });
    }

    return { success: true, message: 'Merci pour votre inscription à la newsletter Güven Mode !' };
  }
}
