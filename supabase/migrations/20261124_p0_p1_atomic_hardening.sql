-- ====================================================================
-- GÜVEN MODE - P0 & P1 HARDENING MIGRATION
-- Atomic Inventory, Order Number Sequence, Search Path Hardening
-- ====================================================================

-- 1. Hardening search_path on public.is_admin() (P1 Security)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN
        EXECUTE 'ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;';
    END IF;
END $$;

-- 2. Sequence for Order Numbers to eliminate concurrent collisions (P0)
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001 INCREMENT BY 1;

-- Initialize sequence beyond current maximum order number if orders exist
DO $$
DECLARE
    v_max_num INT;
BEGIN
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM '[0-9]+')::INT), 1000)
    INTO v_max_num
    FROM public.orders;

    IF v_max_num >= 1000 THEN
        PERFORM setval('public.order_number_seq', v_max_num);
    END IF;
END $$;

-- 3. Deterministic order number generator using the sequence
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    next_val BIGINT;
BEGIN
    SELECT nextval('public.order_number_seq') INTO next_val;
    RETURN 'GM' || next_val::TEXT;
END;
$$;

-- 4. Function to release reserved stock on order cancellation (P0)
CREATE OR REPLACE FUNCTION public.release_order_stock(
    p_order_id UUID,
    p_admin_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT 'Annulation de commande'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
    v_inv RECORD;
BEGIN
    FOR v_item IN 
        SELECT variant_id, quantity 
        FROM public.order_items 
        WHERE order_id = p_order_id AND variant_id IS NOT NULL
    LOOP
        SELECT id, quantity_on_hand, quantity_reserved
        INTO v_inv
        FROM public.inventory
        WHERE variant_id = v_item.variant_id
        FOR UPDATE;

        IF v_inv.id IS NOT NULL THEN
            UPDATE public.inventory
            SET quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                updated_at = NOW()
            WHERE id = v_inv.id;

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
                created_by,
                created_at
            ) VALUES (
                v_item.variant_id,
                'release',
                v_item.quantity,
                v_inv.quantity_on_hand,
                v_inv.quantity_on_hand,
                v_inv.quantity_reserved,
                GREATEST(0, v_inv.quantity_reserved - v_item.quantity),
                p_reason,
                'order',
                p_order_id,
                p_admin_id,
                NOW()
            );
        END IF;
    END LOOP;
END;
$$;

-- 5. Function to deduct physical stock on shipment/delivery (P0)
CREATE OR REPLACE FUNCTION public.deduct_order_stock_on_shipment(
    p_order_id UUID,
    p_admin_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT 'Expédition commande'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
    v_inv RECORD;
BEGIN
    FOR v_item IN 
        SELECT variant_id, quantity 
        FROM public.order_items 
        WHERE order_id = p_order_id AND variant_id IS NOT NULL
    LOOP
        SELECT id, quantity_on_hand, quantity_reserved
        INTO v_inv
        FROM public.inventory
        WHERE variant_id = v_item.variant_id
        FOR UPDATE;

        IF v_inv.id IS NOT NULL THEN
            UPDATE public.inventory
            SET quantity_on_hand = GREATEST(0, quantity_on_hand - v_item.quantity),
                quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                updated_at = NOW()
            WHERE id = v_inv.id;

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
                created_by,
                created_at
            ) VALUES (
                v_item.variant_id,
                'deduction',
                -v_item.quantity,
                v_inv.quantity_on_hand,
                GREATEST(0, v_inv.quantity_on_hand - v_item.quantity),
                v_inv.quantity_reserved,
                GREATEST(0, v_inv.quantity_reserved - v_item.quantity),
                p_reason,
                'order',
                p_order_id,
                p_admin_id,
                NOW()
            );
        END IF;
    END LOOP;
END;
$$;

-- 6. Atomic order status transition orchestrator (P0)
CREATE OR REPLACE FUNCTION public.update_order_status_atomic(
    p_order_id UUID,
    p_new_status TEXT,
    p_admin_id UUID DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_old_status TEXT;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Commande introuvable';
    END IF;

    v_old_status := v_order.status;

    IF v_old_status = p_new_status THEN
        RETURN jsonb_build_object('success', true, 'message', 'Statut déjà identique', 'order_id', p_order_id);
    END IF;

    -- Stock adjustment logic based on status transition
    IF p_new_status = 'cancelled' AND v_old_status NOT IN ('cancelled', 'shipped', 'delivered', 'returned') THEN
        PERFORM public.release_order_stock(p_order_id, p_admin_id, COALESCE(p_note, 'Commande annulée'));
    ELSIF p_new_status IN ('shipped', 'delivered') AND v_old_status NOT IN ('shipped', 'delivered', 'cancelled', 'returned') THEN
        PERFORM public.deduct_order_stock_on_shipment(p_order_id, p_admin_id, COALESCE(p_note, 'Commande expédiée'));
    END IF;

    -- Update order status and appropriate timestamp
    UPDATE public.orders
    SET status = p_new_status,
        updated_at = NOW(),
        confirmed_at = CASE WHEN p_new_status = 'confirmed' AND confirmed_at IS NULL THEN NOW() ELSE confirmed_at END,
        shipped_at = CASE WHEN p_new_status = 'shipped' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
        cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN NOW() ELSE cancelled_at END,
        payment_status = CASE WHEN p_new_status = 'delivered' AND payment_method = 'cod' THEN 'paid' ELSE payment_status END
    WHERE id = p_order_id;

    -- Insert into order_status_history
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by,
        note,
        created_at
    ) VALUES (
        p_order_id,
        v_old_status,
        p_new_status,
        p_admin_id,
        COALESCE(p_note, 'Statut mis à jour vers ' || p_new_status),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$;
