-- ====================================================================
-- GÜVEN MODE - POSTGRESQL TRANSACTIONAL FUNCTIONS & RPCS
-- Atomic Inventory Reservation, Checkout, and Order Lifecycle
-- ====================================================================

-- 1. Helper function to generate sequential readable order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INT;
    new_order_num TEXT;
BEGIN
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM '[0-9]+')::INT), 1000) + 1
    INTO next_num
    FROM public.orders;

    new_order_num := 'GM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
    RETURN new_order_num;
END;
$$;

-- 2. Atomic Checkout Function with Row-Locking & Stock Reservation
CREATE OR REPLACE FUNCTION public.process_checkout_atomic(
    p_customer_id UUID,
    p_guest_email TEXT,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_shipping_address JSONB,
    p_shipping_amount NUMERIC(10, 3),
    p_payment_method TEXT,
    p_items JSONB, -- Array of { variant_id, quantity, expected_price }
    p_promo_code TEXT DEFAULT NULL,
    p_customer_note TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal NUMERIC(10, 3) := 0;
    v_discount NUMERIC(10, 3) := 0;
    v_total NUMERIC(10, 3) := 0;
    v_promo_id UUID := NULL;
    v_promo_type TEXT;
    v_promo_val NUMERIC(10, 3);
    v_promo_min NUMERIC(10, 3);
    v_item RECORD;
    v_variant RECORD;
    v_inv RECORD;
    v_line_total NUMERIC(10, 3);
    v_existing_order UUID;
BEGIN
    -- Check Idempotency if provided
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_order FROM public.orders WHERE idempotency_key = p_idempotency_key;
        IF v_existing_order IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_existing_order,
                'is_duplicate', true
            );
        END IF;
    END IF;

    -- Validate Customer Name & Phone
    IF p_customer_name IS NULL OR TRIM(p_customer_name) = '' THEN
        RAISE EXCEPTION 'Nom du client requis';
    END IF;
    IF p_customer_phone IS NULL OR TRIM(p_customer_phone) = '' THEN
        RAISE EXCEPTION 'Numéro de téléphone requis';
    END IF;

    -- Validate Promotion Code if provided
    IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
        SELECT id, discount_type, discount_value, min_order_amount
        INTO v_promo_id, v_promo_type, v_promo_val, v_promo_min
        FROM public.promotions
        WHERE code = UPPER(TRIM(p_promo_code))
          AND is_active = TRUE
          AND (starts_at <= NOW())
          AND (ends_at IS NULL OR ends_at >= NOW())
          AND (usage_limit IS NULL OR usage_count < usage_limit);

        IF v_promo_id IS NULL THEN
            RAISE EXCEPTION 'Code promo invalide ou expiré';
        END IF;
    END IF;

    -- Calculate subtotal and verify stock with row locking (SELECT ... FOR UPDATE)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(variant_id UUID, quantity INT)
    LOOP
        IF v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Quantité invalide pour un article';
        END IF;

        -- Lock and get product variant details
        SELECT pv.id, pv.product_id, pv.sku, pv.color_name, pv.size_label,
               COALESCE(pv.price_override, p.base_price) AS unit_price,
               p.name AS product_name,
               (SELECT storage_path FROM public.product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_img
        INTO v_variant
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item.variant_id AND pv.is_active = TRUE AND p.status = 'published';

        IF v_variant.id IS NULL THEN
            RAISE EXCEPTION 'Variante de produit introuvable ou indisponible';
        END IF;

        -- Lock inventory row FOR UPDATE to prevent race conditions
        SELECT id, quantity_on_hand, quantity_reserved
        INTO v_inv
        FROM public.inventory
        WHERE variant_id = v_item.variant_id
        FOR UPDATE;

        IF v_inv.id IS NULL THEN
            RAISE EXCEPTION 'Inventaire non configuré pour la référence %', v_variant.sku;
        END IF;

        -- Check available stock
        IF (v_inv.quantity_on_hand - v_inv.quantity_reserved) < v_item.quantity THEN
            RAISE EXCEPTION 'Stock insuffisant pour % (% - %). Disponible: % pièce(s)',
                v_variant.product_name, v_variant.color_name, v_variant.size_label,
                (v_inv.quantity_on_hand - v_inv.quantity_reserved);
        END IF;

        v_line_total := v_variant.unit_price * v_item.quantity;
        v_subtotal := v_subtotal + v_line_total;
    END LOOP;

    -- Apply promotion discount if conditions are met
    IF v_promo_id IS NOT NULL THEN
        IF v_promo_min IS NOT NULL AND v_subtotal < v_promo_min THEN
            RAISE EXCEPTION 'Montant minimum de commande de % TND requis pour utiliser ce code promo', v_promo_min;
        END IF;

        IF v_promo_type = 'percentage' THEN
            v_discount := ROUND((v_subtotal * (v_promo_val / 100.0)), 3);
        ELSE
            v_discount := LEAST(v_promo_val, v_subtotal);
        END IF;

        -- Increment usage count
        UPDATE public.promotions SET usage_count = usage_count + 1 WHERE id = v_promo_id;
    END IF;

    -- Final calculation
    v_total := v_subtotal - v_discount + COALESCE(p_shipping_amount, 0);
    v_order_number := public.generate_order_number();

    -- Create Order
    INSERT INTO public.orders (
        order_number,
        customer_id,
        guest_email,
        customer_name,
        customer_phone,
        status,
        payment_status,
        payment_method,
        currency,
        subtotal_amount,
        discount_amount,
        shipping_amount,
        total_amount,
        shipping_address_snapshot,
        customer_note,
        idempotency_key,
        placed_at
    ) VALUES (
        v_order_number,
        p_customer_id,
        p_guest_email,
        p_customer_name,
        p_customer_phone,
        'pending',
        'pending',
        p_payment_method,
        'TND',
        v_subtotal,
        v_discount,
        COALESCE(p_shipping_amount, 0),
        v_total,
        p_shipping_address,
        p_customer_note,
        p_idempotency_key,
        NOW()
    ) RETURNING id INTO v_order_id;

    -- Create Order Items, Reserve Inventory & Log movements
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(variant_id UUID, quantity INT)
    LOOP
        SELECT pv.id, pv.product_id, pv.sku, pv.color_name, pv.size_label,
               COALESCE(pv.price_override, p.base_price) AS unit_price,
               p.name AS product_name,
               (SELECT storage_path FROM public.product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_img
        INTO v_variant
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item.variant_id;

        v_line_total := v_variant.unit_price * v_item.quantity;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            product_name_snapshot,
            sku_snapshot,
            size_snapshot,
            color_snapshot,
            image_url_snapshot,
            quantity,
            original_unit_price,
            final_unit_price,
            line_total
        ) VALUES (
            v_order_id,
            v_variant.product_id,
            v_variant.id,
            v_variant.product_name,
            v_variant.sku,
            v_variant.size_label,
            v_variant.color_name,
            v_variant.primary_img,
            v_item.quantity,
            v_variant.unit_price,
            v_variant.unit_price,
            v_line_total
        );

        -- Update reserved stock
        SELECT quantity_on_hand, quantity_reserved INTO v_inv
        FROM public.inventory WHERE variant_id = v_item.variant_id;

        UPDATE public.inventory
        SET quantity_reserved = quantity_reserved + v_item.quantity,
            updated_at = NOW()
        WHERE variant_id = v_item.variant_id;

        -- Record inventory movement
        INSERT INTO public.inventory_movements (
            variant_id,
            movement_type,
            quantity_delta,
            quantity_before,
            quantity_after,
            reserved_before,
            reserved_after,
            reason,
            reference_type,
            reference_id,
            created_at
        ) VALUES (
            v_item.variant_id,
            'reservation',
            v_item.quantity,
            v_inv.quantity_on_hand,
            v_inv.quantity_on_hand,
            v_inv.quantity_reserved,
            v_inv.quantity_reserved + v_item.quantity,
            'Réservation commande ' || v_order_number,
            'order',
            v_order_id,
            NOW()
        );
    END LOOP;

    -- Record initial order status history
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        note
    ) VALUES (
        v_order_id,
        'none',
        'pending',
        'Commande créée par le client'
    );

    -- Insert initial payment record
    INSERT INTO public.payments (
        order_id,
        provider,
        payment_method,
        amount,
        currency,
        status
    ) VALUES (
        v_order_id,
        p_payment_method,
        p_payment_method,
        v_total,
        'TND',
        'pending'
    );

    -- Record promotion redemption if used
    IF v_promo_id IS NOT NULL THEN
        INSERT INTO public.promotion_redemptions (
            promotion_id,
            order_id,
            customer_id,
            discount_amount
        ) VALUES (
            v_promo_id,
            v_order_id,
            p_customer_id,
            v_discount
        );
    END IF;

    -- Clear cart if authenticated customer
    IF p_customer_id IS NOT NULL THEN
        DELETE FROM public.cart_items
        WHERE cart_id IN (SELECT id FROM public.carts WHERE customer_id = p_customer_id);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'shipping', COALESCE(p_shipping_amount, 0),
        'total', v_total
    );
END;
$$;

-- 3. Atomic Order Status Transition & Stock Fulfillment / Release
CREATE OR REPLACE FUNCTION public.update_order_status_atomic(
    p_order_id UUID,
    p_new_status TEXT,
    p_admin_id UUID,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_inv RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Commande introuvable';
    END IF;

    IF v_order.status = p_new_status THEN
        RETURN jsonb_build_object('success', true, 'message', 'Statut déjà identique');
    END IF;

    -- If transitioning to 'cancelled' from an unfulfilled state -> Release reservation
    IF p_new_status = 'cancelled' AND v_order.status NOT IN ('cancelled', 'shipped', 'delivered', 'returned') THEN
        FOR v_item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = p_order_id
        LOOP
            IF v_item.variant_id IS NOT NULL THEN
                SELECT quantity_on_hand, quantity_reserved INTO v_inv
                FROM public.inventory WHERE variant_id = v_item.variant_id FOR UPDATE;

                UPDATE public.inventory
                SET quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                    updated_at = NOW()
                WHERE variant_id = v_item.variant_id;

                INSERT INTO public.inventory_movements (
                    variant_id, movement_type, quantity_delta,
                    quantity_before, quantity_after,
                    reserved_before, reserved_after,
                    reason, reference_type, reference_id, created_by
                ) VALUES (
                    v_item.variant_id, 'release', -v_item.quantity,
                    v_inv.quantity_on_hand, v_inv.quantity_on_hand,
                    v_inv.quantity_reserved, GREATEST(0, v_inv.quantity_reserved - v_item.quantity),
                    'Annulation commande ' || v_order.order_number,
                    'order', p_order_id, p_admin_id
                );
            END IF;
        END LOOP;
        UPDATE public.orders SET cancelled_at = NOW() WHERE id = p_order_id;
    END IF;

    -- If transitioning to 'shipped' -> Deduct from on_hand and release reservation
    IF p_new_status = 'shipped' AND v_order.status NOT IN ('shipped', 'delivered', 'returned', 'cancelled') THEN
        FOR v_item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = p_order_id
        LOOP
            IF v_item.variant_id IS NOT NULL THEN
                SELECT quantity_on_hand, quantity_reserved INTO v_inv
                FROM public.inventory WHERE variant_id = v_item.variant_id FOR UPDATE;

                UPDATE public.inventory
                SET quantity_on_hand = GREATEST(0, quantity_on_hand - v_item.quantity),
                    quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                    updated_at = NOW()
                WHERE variant_id = v_item.variant_id;

                INSERT INTO public.inventory_movements (
                    variant_id, movement_type, quantity_delta,
                    quantity_before, quantity_after,
                    reserved_before, reserved_after,
                    reason, reference_type, reference_id, created_by
                ) VALUES (
                    v_item.variant_id, 'deduction', -v_item.quantity,
                    v_inv.quantity_on_hand, GREATEST(0, v_inv.quantity_on_hand - v_item.quantity),
                    v_inv.quantity_reserved, GREATEST(0, v_inv.quantity_reserved - v_item.quantity),
                    'Expédition commande ' || v_order.order_number,
                    'order', p_order_id, p_admin_id
                );
            END IF;
        END LOOP;
        UPDATE public.orders SET shipped_at = NOW() WHERE id = p_order_id;
    END IF;

    -- If delivered
    IF p_new_status = 'delivered' THEN
        UPDATE public.orders SET delivered_at = NOW() WHERE id = p_order_id;
        -- If payment was COD, update payment status to paid upon delivery
        IF v_order.payment_method = 'cod' AND v_order.payment_status = 'pending' THEN
            UPDATE public.orders SET payment_status = 'paid' WHERE id = p_order_id;
            UPDATE public.payments SET status = 'paid', paid_at = NOW() WHERE order_id = p_order_id;
        END IF;
    END IF;

    -- If confirmed
    IF p_new_status = 'confirmed' THEN
        UPDATE public.orders SET confirmed_at = NOW() WHERE id = p_order_id;
    END IF;

    -- Update order status
    UPDATE public.orders
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Log status history
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by,
        note
    ) VALUES (
        p_order_id,
        v_order.status,
        p_new_status,
        p_admin_id,
        p_note
    );

    RETURN jsonb_build_object('success', true, 'old_status', v_order.status, 'new_status', p_new_status);
END;
$$;

-- 4. Atomic Manual Stock Adjustment
CREATE OR REPLACE FUNCTION public.adjust_inventory_atomic(
    p_variant_id UUID,
    p_new_on_hand INT,
    p_admin_id UUID,
    p_reason TEXT DEFAULT 'Ajustement manuel'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv RECORD;
    v_delta INT;
BEGIN
    SELECT * INTO v_inv FROM public.inventory WHERE variant_id = p_variant_id FOR UPDATE;
    IF v_inv.id IS NULL THEN
        RAISE EXCEPTION 'Inventaire introuvable pour cette variante';
    END IF;

    IF p_new_on_hand < v_inv.quantity_reserved THEN
        RAISE EXCEPTION 'Le stock physique (%) ne peut pas être inférieur au stock actuellement réservé (%)',
            p_new_on_hand, v_inv.quantity_reserved;
    END IF;

    v_delta := p_new_on_hand - v_inv.quantity_on_hand;

    UPDATE public.inventory
    SET quantity_on_hand = p_new_on_hand,
        updated_at = NOW()
    WHERE variant_id = p_variant_id;

    INSERT INTO public.inventory_movements (
        variant_id,
        movement_type,
        quantity_delta,
        quantity_before,
        quantity_after,
        reserved_before,
        reserved_after,
        reason,
        reference_type,
        created_by
    ) VALUES (
        p_variant_id,
        'adjustment',
        v_delta,
        v_inv.quantity_on_hand,
        p_new_on_hand,
        v_inv.quantity_reserved,
        v_inv.quantity_reserved,
        p_reason,
        'manual_adjustment',
        p_admin_id
    );

    RETURN jsonb_build_object('success', true, 'quantity_on_hand', p_new_on_hand, 'delta', v_delta);
END;
$$;
