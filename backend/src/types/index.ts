export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role?: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label?: string;
  recipient_name: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  postal_code?: string;
  street_address: string;
  address_line_2?: string;
  delivery_instructions?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVideo {
  id: string;
  product_id: string;
  video_url: string;
  poster_url?: string;
  title?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  color_name: string;
  color_hex: string;
  size_label: string;
  price_override?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  inventory?: {
    quantity_on_hand: number;
    quantity_reserved: number;
    available_stock: number;
    low_stock_threshold: number;
  };
}

export interface Product {
  id: string;
  category_id?: string | null;
  category?: Category;
  name: string;
  slug: string;
  sku: string;
  short_description?: string;
  description?: string;
  composition?: string;
  care_instructions?: string;
  size_guide?: string;
  base_price: number;
  compare_at_price?: number | null;
  currency: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  seo_title?: string;
  seo_description?: string;
  images: ProductImage[];
  video_url?: string;
  videos?: ProductVideo[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  size_snapshot: string;
  color_snapshot: string;
  image_url_snapshot?: string;
  quantity: number;
  original_unit_price: number;
  unit_discount: number;
  final_unit_price: number;
  line_total: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string;
  new_status: string;
  changed_by?: string | null;
  note?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string | null;
  guest_email?: string | null;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  shipping_address_snapshot: {
    recipient_name: string;
    phone: string;
    region: string;
    city: string;
    street_address: string;
    postal_code?: string;
    notes?: string;
  };
  customer_note?: string | null;
  admin_note?: string | null;
  idempotency_key?: string | null;
  placed_at: string;
  confirmed_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  history?: OrderStatusHistory[];
}

export interface Promotion {
  id: string;
  name: string;
  code?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  starts_at: string;
  ends_at?: string | null;
  min_order_amount?: number;
  usage_limit?: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  zone_id?: string;
  name: string;
  price: number;
  free_shipping_threshold?: number;
  estimated_min_days: number;
  estimated_max_days: number;
  is_active: boolean;
}

export interface SiteSettings {
  store_name: string;
  legal_name?: string;
  currency: string;
  currency_symbol: string;
  contact_email: string;
  phone: string;
  whatsapp?: string;
  facebook_url?: string;
  instagram_url?: string;
  store_address: string;
  business_hours: string;
}
