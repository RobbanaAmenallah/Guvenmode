-- ====================================================================
-- GÜVEN MODE — LUXURY WOMEN'S FASHION E-COMMERCE
-- MASTER PRODUCTION DATABASE SETUP & MIGRATIONS
-- Database: Supabase PostgreSQL
-- Project: ggxtshlqpdibwdgzhlmq (https://ggxtshlqpdibwdgzhlmq.supabase.co)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ====================================================================

-- Automatic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 3. PROFILES, ROLES & ADDRESSES
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT, -- 'Maison', 'Bureau', etc.
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Tunisie',
    region TEXT NOT NULL, -- Gouvernorat
    city TEXT NOT NULL,   -- Délégation / Ville
    postal_code TEXT,
    street_address TEXT NOT NULL,
    address_line_2 TEXT,
    delivery_instructions TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 4. CATALOG: CATEGORIES, COLLECTIONS, PRODUCTS, MEDIA & VARIANTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    composition TEXT,
    care_instructions TEXT,
    size_guide TEXT,
    base_price NUMERIC(10, 3) NOT NULL CHECK (base_price >= 0),
    compare_at_price NUMERIC(10, 3) CHECK (compare_at_price IS NULL OR compare_at_price >= base_price),
    currency TEXT NOT NULL DEFAULT 'TND',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    video_url TEXT, -- Dynamic video showcase
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_collections (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
);

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for storing multiple high-definition videos per product
CREATE TABLE IF NOT EXISTS public.product_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    poster_url TEXT,
    title TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    color_name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    size_label TEXT NOT NULL,
    price_override NUMERIC(10, 3),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, color_name, size_label)
);

-- ====================================================================
-- 5. INVENTORY & AUDIT MOVEMENTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE UNIQUE,
    quantity_on_hand INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_stock_positive_available CHECK (quantity_on_hand >= quantity_reserved)
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (
        movement_type IN ('initial', 'restock', 'adjustment', 'reservation', 'release', 'deduction', 'return')
    ),
    quantity_delta INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reserved_before INT NOT NULL,
    reserved_after INT NOT NULL,
    reason TEXT,
    reference_type TEXT, -- 'order', 'manual_adjustment', 'purchase_order'
    reference_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 6. CARTS & WISHLISTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(wishlist_id, product_id)
);

-- ====================================================================
-- 7. ORDERS & FINANCIALS (PII-SECURE)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_email TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned')
    ),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')
    ),
    payment_method TEXT NOT NULL DEFAULT 'cod',
    currency TEXT NOT NULL DEFAULT 'TND',
    subtotal_amount NUMERIC(10, 3) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_amount NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 3) NOT NULL CHECK (total_amount >= 0),
    shipping_address_snapshot JSONB NOT NULL,
    customer_note TEXT,
    admin_note TEXT,
    idempotency_key TEXT UNIQUE,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    size_snapshot TEXT NOT NULL,
    color_snapshot TEXT NOT NULL,
    image_url_snapshot TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    original_unit_price NUMERIC(10, 3) NOT NULL CHECK (original_unit_price >= 0),
    unit_discount NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (unit_discount >= 0),
    final_unit_price NUMERIC(10, 3) NOT NULL CHECK (final_unit_price >= 0),
    line_total NUMERIC(10, 3) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'cod',
    provider_reference TEXT,
    payment_method TEXT NOT NULL,
    amount NUMERIC(10, 3) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'TND',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')
    ),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tracking_number TEXT,
    carrier TEXT DEFAULT 'Transporteur Express Tunisie',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_transit', 'delivered', 'returned')
    ),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 8. PROMOTIONS & PRIVILEGE COUPONS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 3) NOT NULL CHECK (discount_value > 0),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    min_order_amount NUMERIC(10, 3) DEFAULT 0,
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    per_customer_limit INT DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotion_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    discount_amount NUMERIC(10, 3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 9. STORE SETTINGS, CMS & AUDIT LOGS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_type TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    image_path TEXT,
    button_text TEXT,
    button_url TEXT,
    content_json JSONB,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_path TEXT NOT NULL,
    mobile_image_path TEXT,
    target_url TEXT,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Tunisie',
    region TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 3) NOT NULL DEFAULT 7.000,
    free_shipping_threshold NUMERIC(10, 3) DEFAULT 180.000,
    estimated_min_days INT NOT NULL DEFAULT 1,
    estimated_max_days INT NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.promotion_products (
    promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.promotion_categories (
    promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 10. INDEXES FOR ULTRA-FAST SCALABILITY
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(base_price);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

CREATE INDEX IF NOT EXISTS idx_inventory_variant ON public.inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON public.inventory_movements(variant_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);

-- ====================================================================
-- 11. ATTACH AUTOMATIC UPDATED_AT TRIGGERS
-- ====================================================================

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trg_customer_addresses_updated_at BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_collections_updated_at ON public.collections;
CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_inventory_updated_at ON public.inventory;
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_promotions_updated_at ON public.promotions;
CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_content_pages_updated_at ON public.content_pages;
CREATE TRIGGER trg_content_pages_updated_at BEFORE UPDATE ON public.content_pages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_homepage_sections_updated_at ON public.homepage_sections;
CREATE TRIGGER trg_homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_banners_updated_at ON public.banners;
CREATE TRIGGER trg_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to notify admin automatically whenever a new order is placed
CREATE OR REPLACE FUNCTION public.handle_new_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (type, title, message, related_entity_id, created_at)
    VALUES (
        'order_created',
        'Nouvelle commande #' || NEW.order_number,
        NEW.customer_name || ' a passé commande pour ' || NEW.total_amount || ' DT',
        NEW.id,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_notification ON public.orders;
CREATE TRIGGER trg_order_notification AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_new_order_notification();

-- ====================================================================
-- 12. ROW LEVEL SECURITY (RLS) & ADVANCED ACCESS POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_categories ENABLE ROW LEVEL SECURITY;

-- 12.1 Public Read Catalog
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Public can view active collections" ON public.collections;
CREATE POLICY "Public can view active collections" ON public.collections FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products" ON public.products FOR SELECT USING (status = 'published' OR public.is_admin());
DROP POLICY IF EXISTS "Public can view product collections" ON public.product_collections;
CREATE POLICY "Public can view product collections" ON public.product_collections FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Public can view product videos" ON public.product_videos;
CREATE POLICY "Public can view product videos" ON public.product_videos FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Public can view active product variants" ON public.product_variants;
CREATE POLICY "Public can view active product variants" ON public.product_variants FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
CREATE POLICY "Public can view active promotions" ON public.promotions FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (TRUE);

-- 12.2 Customer & Profile Security
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users can manage own addresses" ON public.customer_addresses FOR ALL USING (auth.uid() = customer_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own cart" ON public.carts;
CREATE POLICY "Users can manage own cart" ON public.carts FOR ALL USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Users can manage own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can manage own wishlist items" ON public.wishlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.customer_id = auth.uid())
);

-- 12.3 Order Security
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id OR public.is_admin());
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR public.is_admin()))
);

-- 12.4 Full Admin & Service Role Rights
DROP POLICY IF EXISTS "Admins have full access to user_roles" ON public.user_roles;
CREATE POLICY "Admins have full access to user_roles" ON public.user_roles FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories" ON public.categories FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to collections" ON public.collections;
CREATE POLICY "Admins have full access to collections" ON public.collections FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to product_collections" ON public.product_collections;
CREATE POLICY "Admins have full access to product_collections" ON public.product_collections FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to product_images" ON public.product_images;
CREATE POLICY "Admins have full access to product_images" ON public.product_images FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to product_videos" ON public.product_videos;
CREATE POLICY "Admins have full access to product_videos" ON public.product_videos FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to product_variants" ON public.product_variants;
CREATE POLICY "Admins have full access to product_variants" ON public.product_variants FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to inventory" ON public.inventory;
CREATE POLICY "Admins have full access to inventory" ON public.inventory FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to inventory_movements" ON public.inventory_movements;
CREATE POLICY "Admins have full access to inventory_movements" ON public.inventory_movements FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders" ON public.orders FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to order_items" ON public.order_items;
CREATE POLICY "Admins have full access to order_items" ON public.order_items FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to order_status_history" ON public.order_status_history;
CREATE POLICY "Admins have full access to order_status_history" ON public.order_status_history FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to payments" ON public.payments;
CREATE POLICY "Admins have full access to payments" ON public.payments FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to shipments" ON public.shipments;
CREATE POLICY "Admins have full access to shipments" ON public.shipments FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to promotions" ON public.promotions;
CREATE POLICY "Admins have full access to promotions" ON public.promotions FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to promotion_redemptions" ON public.promotion_redemptions;
CREATE POLICY "Admins have full access to promotion_redemptions" ON public.promotion_redemptions FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to site_settings" ON public.site_settings;
CREATE POLICY "Admins have full access to site_settings" ON public.site_settings FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to newsletter_subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins have full access to newsletter_subscriptions" ON public.newsletter_subscriptions FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to notifications" ON public.notifications;
CREATE POLICY "Admins have full access to notifications" ON public.notifications FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins have full access to admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Admins have full access to admin_audit_logs" ON public.admin_audit_logs FOR ALL USING (public.is_admin());

-- Newsletter Insert
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscriptions;
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (TRUE);

-- 12.5 CMS & Logistics Policies
DROP POLICY IF EXISTS "Public can view published content pages" ON public.content_pages;
CREATE POLICY "Public can view published content pages" ON public.content_pages FOR SELECT USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active homepage sections" ON public.homepage_sections;
CREATE POLICY "Public can view active homepage sections" ON public.homepage_sections FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active shipping zones" ON public.shipping_zones;
CREATE POLICY "Public can view active shipping zones" ON public.shipping_zones FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active shipping methods" ON public.shipping_methods;
CREATE POLICY "Public can view active shipping methods" ON public.shipping_methods FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view promotion products" ON public.promotion_products;
CREATE POLICY "Public can view promotion products" ON public.promotion_products FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public can view promotion categories" ON public.promotion_categories;
CREATE POLICY "Public can view promotion categories" ON public.promotion_categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins have full access to content_pages" ON public.content_pages;
CREATE POLICY "Admins have full access to content_pages" ON public.content_pages FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admins have full access to homepage_sections" ON public.homepage_sections FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to banners" ON public.banners;
CREATE POLICY "Admins have full access to banners" ON public.banners FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to shipping_zones" ON public.shipping_zones;
CREATE POLICY "Admins have full access to shipping_zones" ON public.shipping_zones FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to shipping_methods" ON public.shipping_methods;
CREATE POLICY "Admins have full access to shipping_methods" ON public.shipping_methods FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to promotion_products" ON public.promotion_products;
CREATE POLICY "Admins have full access to promotion_products" ON public.promotion_products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to promotion_categories" ON public.promotion_categories;
CREATE POLICY "Admins have full access to promotion_categories" ON public.promotion_categories FOR ALL USING (public.is_admin());

-- ====================================================================
-- 13. SEED DATA WITH OFFICIAL GÜVEN MODE INFORMATION
-- ====================================================================

-- 13.1 Store Settings
INSERT INTO public.site_settings (key, value_json) VALUES
('general', '{
    "store_name": "GÜVEN MODE",
    "legal_name": "GÜVEN MODE SARL",
    "currency": "TND",
    "currency_symbol": "DT",
    "contact_email": "guvenmode@gmail.com",
    "phone": "+216 28 827 626",
    "whatsapp": "+216 28 827 626",
    "facebook_url": "https://www.facebook.com/search/top?q=guven%20mode",
    "instagram_url": "https://www.instagram.com/guven_mode/",
    "store_address": "Tunis, Tunisie",
    "business_hours": "Du Lundi au Samedi: 10h00 - 19h30"
}'::jsonb),
('shipping', '{
    "standard_fee": 7.000,
    "free_shipping_threshold": 180.000,
    "carrier": "Livraison Express Tunisie",
    "estimated_days": "24h à 72h ouvrables"
}'::jsonb),
('announcement', '{
    "text": "Nouvelle Collection Automne-Hiver | Livraison offerte dès 180 DT sur toute la Tunisie",
    "is_active": true,
    "link_url": "/boutique"
}'::jsonb),
('hero', '{
    "badge": "Collection Signature 2026",
    "title": "Votre style, votre signature.",
    "subtitle": "Découvrez une mode féminine pensée pour chaque instant. L''élégance raffinée et le confort absolu réunis dans nos créations exclusives.",
    "button_text": "Découvrir la collection",
    "button_url": "/boutique",
    "image_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW();

-- 13.2 Categories
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order) VALUES
('33333333-3333-3333-3333-333333333301', 'Robes', 'robes', 'Robes longues de soirée, modèles fluides ceinturés et créations cocktail.', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop', 1),
('33333333-3333-3333-3333-333333333302', 'Ensembles & Tailleurs', 'ensembles', 'Tailleurs pantalons structurés, ensembles deux pièces et coordonnées chics.', 'https://images.unsplash.com/photo-1548624149-f9b1859aa941?q=80&w=800&auto=format&fit=crop', 2),
('33333333-3333-3333-3333-333333333303', 'Chemisiers & Hauts', 'hauts', 'Blouses en crêpe de soie, tops drapés et chemises architecturales.', 'https://images.unsplash.com/photo-1551803091-e20673f15770?q=80&w=800&auto=format&fit=crop', 3),
('33333333-3333-3333-3333-333333333304', 'Manteaux & Vestes', 'vestes', 'Manteaux raffinés, blazers cintrés et vestes d''exception.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop', 4),
('33333333-3333-3333-3333-333333333305', 'Accessoires', 'accessoires', 'Sacs en cuir, étoles délicates et ceintures de finition.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop', 5)
ON CONFLICT (id) DO NOTHING;

-- 13.3 Collections
INSERT INTO public.collections (id, name, slug, description, cover_image_url) VALUES
('44444444-4444-4444-4444-444444444401', 'Nouvelle Saison', 'nouvelle-saison', 'La collection signature mêlant coupes architecturales et fluidité féminine.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop'),
('44444444-4444-4444-4444-444444444402', 'Capsule Cérémonie', 'capsule-ceremonie', 'Des pièces magistrales pour vos soirées inoubliables et réceptions.', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop'),
('44444444-4444-4444-4444-444444444403', 'L''Allure Bureau', 'allure-bureau', 'Le vestiaire professionnel réinventé : précision, confort et chic.', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1200&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- 13.4 Luxury Products (with Photos AND Videos)
INSERT INTO public.products (id, category_id, name, slug, sku, short_description, description, composition, care_instructions, base_price, compare_at_price, status, is_featured, video_url) VALUES
('66666666-6666-6666-6666-666666666601', '33333333-3333-3333-3333-333333333301', 'Robe Élégance Azur', 'robe-elegance-azur', 'GM-ROB-001', 'Robe midi fluide ceinturée arborant le bleu signature emblématique de la maison Güven Mode.', 'Incarnation parfaite de l''esprit Güven Mode, la robe Élégance Azur offre une silhouette élancée et aérienne. Confectionnée dans un crêpe de soie doux au tombé impeccable.', '100% Crêpe de Soie Haute Densité. Doublure 100% viscose respirante.', 'Nettoyage à sec professionnel recommandé ou lavage délicat à la main 30°C.', 189.000, 220.000, 'published', TRUE, 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-blue-dress-41130-large.mp4'),
('66666666-6666-6666-6666-666666666602', '33333333-3333-3333-3333-333333333302', 'Tailleur Pantalon Victoire', 'tailleur-pantalon-victoire', 'GM-ENS-002', 'Ensemble tailleur structuré composé d''une veste ceinturée et d''un pantalon palazzo à pinces.', 'Une coupe architecturale qui allie puissance et grâce féminine. Le tailleur Victoire sublime votre démarche en toute occasion.', '78% Laine froide peignée, 20% Soie, 2% Élasthanne.', 'Nettoyage à sec uniquement.', 289.000, 340.000, 'published', TRUE, 'https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-a-beige-suit-41132-large.mp4'),
('66666666-6666-6666-6666-666666666603', '33333333-3333-3333-3333-333333333301', 'Robe Longue Soie Plissée', 'robe-longue-soie-plissee', 'GM-ROB-003', 'Robe maxi de cérémonie en mousseline de soie vaporeuse plissée main.', 'Drapée avec virtuosité, cette robe de soirée déploie une envergure spectaculaire à chaque pas.', '100% Mousseline de Soie peignée.', 'Nettoyage à sec spécialisé.', 320.000, 390.000, 'published', TRUE, NULL),
('66666666-6666-6666-6666-666666666604', '33333333-3333-3333-3333-333333333303', 'Chemisier Drapé Constance', 'chemisier-drape-constance', 'GM-HAU-004', 'Chemisier fluide à col lavallière transformable en crêpe georgette de soie.', 'Un intemporel de haute facture doté de poignets boutonnés recouverts.', '100% Soie Georgette.', 'Lavage à froid délicat ou pressing.', 145.000, NULL, 'published', FALSE, NULL),
('66666666-6666-6666-6666-666666666605', '33333333-3333-3333-3333-333333333304', 'Manteau Ceinturé Royal Camel', 'manteau-ceinture-royal-camel', 'GM-MAN-005', 'Manteau long enveloppant ceinturé confectionné en drap de laine vierge double face.', 'Chaleur feutrée et allure impériale.', '90% Laine vierge, 10% Cachemire.', 'Nettoyage à sec professionnel.', 380.000, 450.000, 'published', TRUE, NULL),
('66666666-6666-6666-6666-666666666606', '33333333-3333-3333-3333-333333333301', 'Robe Fourreau Signature Noire', 'robe-fourreau-signature-noire', 'GM-ROB-006', 'La petite robe noire réinventée avec un décolleté asymétrique origami.', 'L''épure absolue et la sophistication dans chaque couture.', '95% Crêpe lourd stretch, 5% Élasthanne.', 'Lavage machine délicat 30°C.', 165.000, NULL, 'published', FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- 13.5 Product Images
INSERT INTO public.product_images (product_id, storage_path, alt_text, sort_order, is_primary) VALUES
('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop', 'Robe Élégance Azur - Face', 0, TRUE),
('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop', 'Robe Élégance Azur - Mouvement', 1, FALSE),
('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop', 'Robe Élégance Azur - Dos', 2, FALSE),
('66666666-6666-6666-6666-666666666602', 'https://images.unsplash.com/photo-1548624149-f9b1859aa941?q=80&w=1000&auto=format&fit=crop', 'Tailleur Victoire - Porté complet', 0, TRUE),
('66666666-6666-6666-6666-666666666602', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1000&auto=format&fit=crop', 'Tailleur Victoire - Veste', 1, FALSE),
('66666666-6666-6666-6666-666666666603', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop', 'Robe Soie Plissée - Porté', 0, TRUE),
('66666666-6666-6666-6666-666666666604', 'https://images.unsplash.com/photo-1551803091-e20673f15770?q=80&w=1000&auto=format&fit=crop', 'Chemisier Constance', 0, TRUE),
('66666666-6666-6666-6666-666666666605', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop', 'Manteau Camel - Face', 0, TRUE),
('66666666-6666-6666-6666-666666666606', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop', 'Robe Fourreau Noire', 0, TRUE);

-- 13.6 Product Videos
INSERT INTO public.product_videos (product_id, video_url, poster_url, title, sort_order, is_primary) VALUES
('66666666-6666-6666-6666-666666666601', 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-blue-dress-41130-large.mp4', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000', 'Vidéo Défilé - Robe Élégance Azur', 0, TRUE),
('66666666-6666-6666-6666-666666666602', 'https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-a-beige-suit-41132-large.mp4', 'https://images.unsplash.com/photo-1548624149-f9b1859aa941?q=80&w=1000', 'Vidéo Porté - Tailleur Victoire', 0, TRUE);

-- 13.7 Product Variants & Physical Inventory
-- Variants for P1 (Robe Élégance Azur)
INSERT INTO public.product_variants (id, product_id, sku, color_name, color_hex, size_label) VALUES
('77777777-7777-7777-7777-777777777101', '66666666-6666-6666-6666-666666666601', 'GM-ROB-001-BLU-36', 'Bleu Güven', '#1598C8', '36 (S)'),
('77777777-7777-7777-7777-777777777102', '66666666-6666-6666-6666-666666666601', 'GM-ROB-001-BLU-38', 'Bleu Güven', '#1598C8', '38 (M)'),
('77777777-7777-7777-7777-777777777103', '66666666-6666-6666-6666-666666666601', 'GM-ROB-001-BLU-40', 'Bleu Güven', '#1598C8', '40 (L)'),
('77777777-7777-7777-7777-777777777104', '66666666-6666-6666-6666-666666666601', 'GM-ROB-001-BLU-42', 'Bleu Güven', '#1598C8', '42 (XL)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold) VALUES
('77777777-7777-7777-7777-777777777101', 12, 0, 3),
('77777777-7777-7777-7777-777777777102', 8, 0, 3),
('77777777-7777-7777-7777-777777777103', 6, 0, 3),
('77777777-7777-7777-7777-777777777104', 4, 0, 2)
ON CONFLICT (variant_id) DO NOTHING;

-- Variants for P2 (Tailleur Victoire)
INSERT INTO public.product_variants (id, product_id, sku, color_name, color_hex, size_label) VALUES
('77777777-7777-7777-7777-777777777201', '66666666-6666-6666-6666-666666666602', 'GM-ENS-002-SAB-36', 'Sable Doré', '#E8DDD0', '36 (S)'),
('77777777-7777-7777-7777-777777777202', '66666666-6666-6666-6666-666666666602', 'GM-ENS-002-SAB-38', 'Sable Doré', '#E8DDD0', '38 (M)'),
('77777777-7777-7777-7777-777777777203', '66666666-6666-6666-6666-666666666602', 'GM-ENS-002-SAB-40', 'Sable Doré', '#E8DDD0', '40 (L)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold) VALUES
('77777777-7777-7777-7777-777777777201', 6, 0, 2),
('77777777-7777-7777-7777-777777777202', 5, 0, 2),
('77777777-7777-7777-7777-777777777203', 3, 0, 2)
ON CONFLICT (variant_id) DO NOTHING;

-- 13.8 Privilege Promotions
INSERT INTO public.promotions (id, name, code, discount_type, discount_value, starts_at, ends_at, min_order_amount, usage_limit, is_active) VALUES
('55555555-5555-5555-5555-555555555501', 'Bienvenue chez Güven', 'BIENVENUE10', 'percentage', 10.000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 year', 100.000, 1000, TRUE),
('55555555-5555-5555-5555-555555555502', 'Remise Privilège 20 TND', 'GUVEN20', 'fixed', 20.000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 year', 250.000, 500, TRUE),
('55555555-5555-5555-5555-555555555503', 'Code Spécial 2026', 'MODE2026', 'percentage', 15.000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 year', 150.000, 200, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 13.9 Content Pages
INSERT INTO public.content_pages (slug, title, content, seo_title, seo_description) VALUES
('a-propos', 'L''Histoire de la Maison GÜVEN MODE', 'Fondée avec la volonté de célébrer la femme contemporaine, GÜVEN MODE réinvente le vestiaire féminin haut de gamme...', 'L''Histoire de la Maison | GÜVEN MODE', 'Découvrez l''héritage et la confection artisanale des créations Güven Mode.'),
('contact', 'Contactez la Conciergerie', 'Téléphone : +216 28 827 626 | Email : guvenmode@gmail.com | Du Lundi au Samedi: 10h00 - 19h30', 'Contact & Conciergerie | GÜVEN MODE', 'Contactez notre service client en Tunisie.')
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- Completed Master Setup Migration
