-- ====================================================================
-- GÜVEN MODE - ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Function to check if current user is an admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id
        AND role IN ('admin', 'super_admin')
    );
$$;

-- Enable RLS on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- PROFILES POLICIES
-- ====================================================================
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ====================================================================
-- USER ROLES POLICIES (Only admins can view/manage)
-- ====================================================================
CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin());

-- ====================================================================
-- ADDRESSES POLICIES
-- ====================================================================
CREATE POLICY "Users can manage own addresses"
    ON public.customer_addresses FOR ALL
    USING (auth.uid() = customer_id OR public.is_admin())
    WITH CHECK (auth.uid() = customer_id OR public.is_admin());

-- ====================================================================
-- PUBLIC CATALOG POLICIES
-- ====================================================================
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view active collections"
    ON public.collections FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage collections"
    ON public.collections FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view published products"
    ON public.products FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view product collections"
    ON public.product_collections FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage product collections"
    ON public.product_collections FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view product images"
    ON public.product_images FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage product images"
    ON public.product_images FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view active variants"
    ON public.product_variants FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage variants"
    ON public.product_variants FOR ALL
    USING (public.is_admin());

-- ====================================================================
-- INVENTORY (Public can read quantity for availability, only admins/backend mutate)
-- ====================================================================
CREATE POLICY "Public can read inventory availability"
    ON public.inventory FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage inventory"
    ON public.inventory FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can view inventory movements"
    ON public.inventory_movements FOR SELECT
    USING (public.is_admin());

-- ====================================================================
-- CARTS & WISHLISTS
-- ====================================================================
CREATE POLICY "Users can view own cart"
    ON public.carts FOR SELECT
    USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Users can manage own cart"
    ON public.carts FOR ALL
    USING (auth.uid() = customer_id OR public.is_admin())
    WITH CHECK (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Users can manage own cart items"
    ON public.cart_items FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Users can manage own wishlist"
    ON public.wishlists FOR ALL
    USING (auth.uid() = customer_id OR public.is_admin())
    WITH CHECK (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Users can manage own wishlist items"
    ON public.wishlist_items FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.customer_id = auth.uid())
        OR public.is_admin()
    );

-- ====================================================================
-- ORDERS & ITEMS
-- ====================================================================
CREATE POLICY "Customers view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Admins can manage all orders"
    ON public.orders FOR ALL
    USING (public.is_admin());

CREATE POLICY "Customers view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Admins manage order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

CREATE POLICY "Order status history viewable by order owner or admin"
    ON public.order_status_history FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_history.order_id AND orders.customer_id = auth.uid())
        OR public.is_admin()
    );

-- ====================================================================
-- PROMOTIONS, SHIPPING & CMS
-- ====================================================================
CREATE POLICY "Public can view active promotions"
    ON public.promotions FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage promotions"
    ON public.promotions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public view active shipping zones"
    ON public.shipping_zones FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public view active shipping methods"
    ON public.shipping_methods FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public view active CMS content"
    ON public.homepage_sections FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public view active banners"
    ON public.banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public view site settings"
    ON public.site_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Public view published pages"
    ON public.content_pages FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

CREATE POLICY "Anyone can subscribe to newsletter"
    ON public.newsletter_subscriptions FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Admins manage CMS and settings"
    ON public.site_settings FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins manage homepage sections"
    ON public.homepage_sections FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins manage banners"
    ON public.banners FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins manage audit logs"
    ON public.admin_audit_logs FOR ALL
    USING (public.is_admin());
