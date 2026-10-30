import { db } from '../data/dbStore.js';
import { Product, ProductVariant } from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';
import { getSupabase } from '../config/supabase.js';

export interface ProductFilterQuery {
  category?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'featured';
  page?: number;
  limit?: number;
  status?: string;
}

export function mapSupabaseProduct(p: any): Product {
  const images = (p.images || [])
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((img: any) => ({
      id: img.id,
      product_id: img.product_id,
      storage_path: img.storage_path,
      alt_text: img.alt_text,
      sort_order: img.sort_order || 0,
      is_primary: !!img.is_primary,
      created_at: img.created_at || new Date().toISOString()
    }));

  const videos = (p.videos || [])
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((v: any) => ({
      id: v.id,
      product_id: v.product_id,
      video_url: v.video_url,
      poster_url: v.poster_url,
      title: v.title,
      sort_order: v.sort_order || 0,
      is_primary: !!v.is_primary,
      created_at: v.created_at || new Date().toISOString()
    }));

  const variants = (p.variants || []).map((v: any) => {
    const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
    const qHand = inv ? Number(inv.quantity_on_hand) || 0 : 0;
    const qRes = inv ? Number(inv.quantity_reserved) || 0 : 0;
    return {
      id: v.id,
      product_id: v.product_id,
      sku: v.sku,
      color_name: v.color_name,
      color_hex: v.color_hex,
      size_label: v.size_label,
      price_override: v.price_override != null ? Number(v.price_override) : null,
      is_active: v.is_active !== false,
      created_at: v.created_at || new Date().toISOString(),
      updated_at: v.updated_at || new Date().toISOString(),
      inventory: {
        quantity_on_hand: qHand,
        quantity_reserved: qRes,
        available_stock: Math.max(0, qHand - qRes),
        low_stock_threshold: inv ? Number(inv.low_stock_threshold) || 2 : 2
      }
    };
  });

  return {
    id: p.id,
    category_id: p.category_id,
    category: p.category ? {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
      description: p.category.description,
      image_url: p.category.image_url,
      sort_order: p.category.sort_order || 0,
      is_active: p.category.is_active !== false,
      created_at: p.category.created_at,
      updated_at: p.category.updated_at
    } : undefined,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    short_description: p.short_description || '',
    description: p.description || '',
    composition: p.composition || '',
    care_instructions: p.care_instructions || '',
    size_guide: p.size_guide || '',
    base_price: Number(p.base_price) || 0,
    compare_at_price: p.compare_at_price != null ? Number(p.compare_at_price) : null,
    currency: p.currency || 'TND',
    status: p.status || 'published',
    is_featured: !!p.is_featured,
    video_url: p.video_url || undefined,
    seo_title: p.seo_title,
    seo_description: p.seo_description,
    images,
    videos,
    variants,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString()
  };
}

export class ProductService {
  public static async getProducts(filters: ProductFilterQuery = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const supabase = getSupabase();

    if (supabase) {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          videos:product_videos(*),
          variants:product_variants(
            *,
            inventory:inventory(*)
          )
        `);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      } else if (!filters.status) {
        query = query.eq('status', 'published');
      }

      if (filters.featured !== undefined) {
        query = query.eq('is_featured', filters.featured);
      }

      const { data, error } = await query;

      if (!error && data) {
        let list: Product[] = data.map(mapSupabaseProduct);

        // In-memory filters for complex criteria
        if (filters.category) {
          list = list.filter(p => p.category?.slug === filters.category || p.category_id === filters.category);
        }

        if (filters.onSale) {
          list = list.filter(p => p.compare_at_price && p.compare_at_price > p.base_price);
        }

        if (filters.minPrice !== undefined) {
          list = list.filter(p => p.base_price >= filters.minPrice!);
        }

        if (filters.maxPrice !== undefined) {
          list = list.filter(p => p.base_price <= filters.maxPrice!);
        }

        if (filters.size) {
          list = list.filter(p =>
            p.variants.some(v => v.size_label.toLowerCase().includes(filters.size!.toLowerCase()))
          );
        }

        if (filters.color) {
          list = list.filter(p =>
            p.variants.some(v => v.color_name.toLowerCase().includes(filters.color!.toLowerCase()))
          );
        }

        if (filters.inStock) {
          list = list.filter(p =>
            p.variants.some(v => v.inventory && v.inventory.available_stock > 0)
          );
        }

        if (filters.search && filters.search.trim().length > 0) {
          const q = filters.search.trim().toLowerCase();
          list = list.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.short_description && p.short_description.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            p.sku.toLowerCase().includes(q) ||
            (p.composition && p.composition.toLowerCase().includes(q))
          );
        }

        // Sorting
        switch (filters.sort) {
          case 'price_asc':
            list.sort((a, b) => a.base_price - b.base_price);
            break;
          case 'price_desc':
            list.sort((a, b) => b.base_price - a.base_price);
            break;
          case 'featured':
            list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
            break;
          case 'newest':
          default:
            list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
        }

        const total = list.length;
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
        const totalPages = Math.ceil(total / limit) || 1;
        const offset = (page - 1) * limit;
        const paginated = list.slice(offset, offset + limit);

        return {
          products: paginated,
          total,
          page,
          totalPages
        };
      }
    }

    // Fallback if Supabase offline
    let list = [...db.products];
    if (filters.status && filters.status !== 'all') {
      list = list.filter(p => p.status === filters.status);
    } else {
      list = list.filter(p => p.status === 'published');
    }

    const total = list.length;
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      products: list.slice(offset, offset + limit),
      total,
      page,
      totalPages
    };
  }

  public static async getProductBySlug(slug: string): Promise<Product | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          videos:product_videos(*),
          variants:product_variants(
            *,
            inventory:inventory(*)
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseProduct(data);
      }
    }

    return db.products.find(p => p.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  public static async getProductById(id: string): Promise<Product | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          videos:product_videos(*),
          variants:product_variants(
            *,
            inventory:inventory(*)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseProduct(data);
      }
    }

    return db.products.find(p => p.id === id) || null;
  }

  public static async createProduct(data: Partial<Product>): Promise<Product> {
    const supabase = getSupabase();
    const id = data.id || uuidv4();
    const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;
    const sku = data.sku || `GM-PROD-${Math.floor(100 + Math.random() * 900)}`;

    if (supabase) {
      const prodRecord = {
        id,
        category_id: data.category_id || null,
        name: data.name || 'Nouveau Produit',
        slug,
        sku,
        short_description: data.short_description || '',
        description: data.description || '',
        composition: data.composition || '',
        care_instructions: data.care_instructions || '',
        size_guide: data.size_guide || '',
        base_price: Number(data.base_price) || 0,
        compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
        currency: data.currency || 'TND',
        status: data.status || 'published',
        is_featured: !!data.is_featured,
        video_url: data.video_url || null,
        seo_title: data.seo_title || data.name,
        seo_description: data.seo_description || data.short_description
      };

      await supabase.from('products').insert(prodRecord);

      // Insert images
      if (data.images && data.images.length > 0) {
        for (let i = 0; i < data.images.length; i++) {
          const img = data.images[i];
          await supabase.from('product_images').insert({
            id: img.id || uuidv4(),
            product_id: id,
            storage_path: img.storage_path,
            alt_text: img.alt_text || data.name,
            sort_order: i,
            is_primary: i === 0
          });
        }
      }

      // Insert variants and inventory
      if (data.variants && data.variants.length > 0) {
        for (const v of data.variants) {
          const vId = v.id || uuidv4();
          await supabase.from('product_variants').insert({
            id: vId,
            product_id: id,
            sku: v.sku || `${sku}-${v.size_label}`,
            color_name: v.color_name || 'Standard',
            color_hex: v.color_hex || '#000000',
            size_label: v.size_label || 'TU',
            price_override: v.price_override ? Number(v.price_override) : null,
            is_active: true
          });

          const stock = v.inventory?.quantity_on_hand ?? 5;
          await supabase.from('inventory').insert({
            id: uuidv4(),
            variant_id: vId,
            quantity_on_hand: stock,
            quantity_reserved: 0,
            low_stock_threshold: 2
          });
        }
      }

      // Insert video
      if (data.video_url) {
        await supabase.from('product_videos').insert({
          id: uuidv4(),
          product_id: id,
          video_url: data.video_url,
          title: data.name || 'Vidéo Présentation',
          sort_order: 0,
          is_primary: true
        });
      }

      const created = await ProductService.getProductById(id);
      if (created) {
        db.products.unshift(created);
        return created;
      }
    }

    // Fallback store
    const newProd: Product = {
      id,
      category_id: data.category_id || null,
      category: db.categories.find(c => c.id === data.category_id),
      name: data.name || 'Nouveau Produit',
      slug,
      sku,
      short_description: data.short_description || '',
      description: data.description || '',
      composition: data.composition || '',
      care_instructions: data.care_instructions || '',
      size_guide: data.size_guide || '',
      base_price: Number(data.base_price) || 0,
      compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
      currency: data.currency || 'TND',
      status: data.status || 'published',
      is_featured: !!data.is_featured,
      seo_title: data.seo_title || data.name,
      seo_description: data.seo_description || data.short_description,
      images: data.images || [],
      video_url: data.video_url || undefined,
      videos: data.videos || [],
      variants: data.variants || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.products.unshift(newProd);
    return newProd;
  }

  public static async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const supabase = getSupabase();
    if (supabase) {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.category_id !== undefined) updateData.category_id = data.category_id;
      if (data.short_description !== undefined) updateData.short_description = data.short_description;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.composition !== undefined) updateData.composition = data.composition;
      if (data.care_instructions !== undefined) updateData.care_instructions = data.care_instructions;
      if (data.size_guide !== undefined) updateData.size_guide = data.size_guide;
      if (data.base_price !== undefined) updateData.base_price = Number(data.base_price);
      if (data.compare_at_price !== undefined) updateData.compare_at_price = data.compare_at_price ? Number(data.compare_at_price) : null;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.is_featured !== undefined) updateData.is_featured = !!data.is_featured;
      if (data.video_url !== undefined) updateData.video_url = data.video_url;

      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();
        await supabase.from('products').update(updateData).eq('id', id);
      }

      // Update images
      if (data.images !== undefined) {
        await supabase.from('product_images').delete().eq('product_id', id);
        if (Array.isArray(data.images) && data.images.length > 0) {
          for (let i = 0; i < data.images.length; i++) {
            const img = data.images[i];
            await supabase.from('product_images').insert({
              id: img.id || uuidv4(),
              product_id: id,
              storage_path: img.storage_path,
              alt_text: img.alt_text || data.name || 'GÜVEN MODE',
              sort_order: img.sort_order !== undefined ? img.sort_order : i,
              is_primary: img.is_primary !== undefined ? img.is_primary : (i === 0)
            });
          }
        }
      }

      // Update video in product_videos
      if (data.video_url !== undefined) {
        await supabase.from('product_videos').delete().eq('product_id', id);
        if (data.video_url) {
          await supabase.from('product_videos').insert({
            id: uuidv4(),
            product_id: id,
            video_url: data.video_url,
            title: data.name || 'Vidéo Présentation',
            sort_order: 0,
            is_primary: true
          });
        }
      }

      // Update variants and inventory
      if (data.variants !== undefined && Array.isArray(data.variants)) {
        for (let i = 0; i < data.variants.length; i++) {
          const v = data.variants[i];
          const stock = Number(v.inventory?.quantity_on_hand) || 0;

          if (v.id) {
            await supabase.from('product_variants').update({
              sku: v.sku,
              color_name: v.color_name,
              color_hex: v.color_hex,
              size_label: v.size_label,
              price_override: v.price_override ? Number(v.price_override) : null,
              is_active: true,
              updated_at: new Date().toISOString()
            }).eq('id', v.id);

            const { data: inv } = await supabase.from('inventory').select('id').eq('variant_id', v.id);
            if (inv && inv.length > 0) {
              await supabase.from('inventory').update({
                quantity_on_hand: stock
              }).eq('variant_id', v.id);
            } else {
              await supabase.from('inventory').insert({
                id: uuidv4(),
                variant_id: v.id,
                quantity_on_hand: stock,
                quantity_reserved: 0,
                low_stock_threshold: 2
              });
            }
          } else {
            const newVarId = uuidv4();
            await supabase.from('product_variants').insert({
              id: newVarId,
              product_id: id,
              sku: v.sku || `GM-VAR-${id.substring(0, 4)}-${i + 1}`,
              color_name: v.color_name || 'Standard',
              color_hex: v.color_hex || '#1598C8',
              size_label: v.size_label || 'TU',
              price_override: v.price_override ? Number(v.price_override) : null,
              is_active: true
            });

            await supabase.from('inventory').insert({
              id: uuidv4(),
              variant_id: newVarId,
              quantity_on_hand: stock,
              quantity_reserved: 0,
              low_stock_threshold: 2
            });
          }
        }
      }

      const updated = await ProductService.getProductById(id);
      if (updated) {
        const memIdx = db.products.findIndex(p => p.id === id);
        if (memIdx !== -1) {
          db.products[memIdx] = updated;
        }
        return updated;
      }
    }

    const prod = db.products.find(p => p.id === id);
    if (!prod) throw new Error('Produit introuvable');
    Object.assign(prod, { ...data, updated_at: new Date().toISOString() });
    return prod;
  }

  public static async deleteProduct(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    }

    const idx = db.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    db.products.splice(idx, 1);
    return true;
  }
}
