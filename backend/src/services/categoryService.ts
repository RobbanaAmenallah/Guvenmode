import { db } from '../data/dbStore.js';
import { Category, Collection } from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';
import { getSupabase } from '../config/supabase.js';

export class CategoryService {
  public static async getCategories(): Promise<Category[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        return data as Category[];
      }
    }
    return db.categories.filter(c => c.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }

  public static async getAllCategories(): Promise<Category[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        return data as Category[];
      }
    }
    return db.categories.sort((a, b) => a.sort_order - b.sort_order);
  }

  public static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return data as Category;
      }
    }
    return db.categories.find(c => c.slug === slug) || null;
  }

  public static async createCategory(data: Partial<Category>): Promise<Category> {
    const supabase = getSupabase();
    const id = data.id || uuidv4();
    const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cat-${Date.now()}`;

    const newCat: Category = {
      id,
      name: data.name || '',
      slug,
      description: data.description || '',
      image_url: data.image_url || '',
      parent_id: data.parent_id || null,
      sort_order: data.sort_order ?? 1,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('categories').insert(newCat);
      if (error) throw new Error(error.message);
      db.categories.push(newCat);
      return newCat;
    }

    db.categories.push(newCat);
    return newCat;
  }

  public static async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const supabase = getSupabase();
    if (supabase) {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.image_url !== undefined) updateData.image_url = data.image_url;
      if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase.from('categories').update(updateData).eq('id', id);
      if (error) throw new Error(error.message);

      const { data: updated, error: fetchErr } = await supabase.from('categories').select('*').eq('id', id).single();
      if (!fetchErr && updated) {
        const memIdx = db.categories.findIndex(c => c.id === id);
        if (memIdx !== -1) db.categories[memIdx] = updated as Category;
        return updated as Category;
      }
    }

    const cat = db.categories.find(c => c.id === id);
    if (!cat) throw new Error('Catégorie introuvable');
    Object.assign(cat, { ...data, updated_at: new Date().toISOString() });
    return cat;
  }

  public static async deleteCategory(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      return !error;
    }

    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    db.categories.splice(idx, 1);
    return true;
  }

  // Collections
  public static async getCollections(): Promise<Collection[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Collection[];
      }
    }
    return db.collections.filter(c => c.is_active);
  }

  public static async getAllCollections(): Promise<Collection[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Collection[];
      }
    }
    return db.collections;
  }

  public static async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return data as Collection;
      }
    }
    return db.collections.find(c => c.slug === slug) || null;
  }

  public static async createCollection(data: Partial<Collection>): Promise<Collection> {
    const supabase = getSupabase();
    const id = data.id || uuidv4();
    const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `col-${Date.now()}`;

    const newCol: Collection = {
      id,
      name: data.name || '',
      slug,
      description: data.description || '',
      cover_image_url: data.cover_image_url || '',
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('collections').insert(newCol);
      if (error) throw new Error(error.message);
      db.collections.push(newCol);
      return newCol;
    }

    db.collections.push(newCol);
    return newCol;
  }

  public static async updateCollection(id: string, data: Partial<Collection>): Promise<Collection> {
    const supabase = getSupabase();
    if (supabase) {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.cover_image_url !== undefined) updateData.cover_image_url = data.cover_image_url;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase.from('collections').update(updateData).eq('id', id);
      if (error) throw new Error(error.message);

      const { data: updated } = await supabase.from('collections').select('*').eq('id', id).single();
      if (updated) {
        const memIdx = db.collections.findIndex(c => c.id === id);
        if (memIdx !== -1) db.collections[memIdx] = updated as Collection;
        return updated as Collection;
      }
    }

    const col = db.collections.find(c => c.id === id);
    if (!col) throw new Error('Collection introuvable');
    Object.assign(col, { ...data, updated_at: new Date().toISOString() });
    return col;
  }

  public static async deleteCollection(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('collections').delete().eq('id', id);
      return !error;
    }

    const idx = db.collections.findIndex(c => c.id === id);
    if (idx === -1) return false;
    db.collections.splice(idx, 1);
    return true;
  }
}
