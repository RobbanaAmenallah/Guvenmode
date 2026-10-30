-- ====================================================================
-- GÜVEN MODE - SEED DATA
-- Luxury Women's Fashion Catalog & Store Settings
-- ====================================================================

-- 1. Site Settings
INSERT INTO public.site_settings (key, value_json, updated_at) VALUES
('general', '{
    "store_name": "GÜVEN MODE",
    "legal_name": "GÜVEN MODE SARL",
    "currency": "TND",
    "currency_symbol": "DT",
    "contact_email": "contact@guvenmode.tn",
    "phone": "+216 29 000 000",
    "whatsapp": "+216 29 000 000",
    "facebook_url": "https://www.facebook.com/profile.php?id=100064032068005",
    "instagram_url": "https://www.instagram.com/guvenmode",
    "store_address": "Avenue Habib Bourguiba, Tunis, Tunisie",
    "business_hours": "Du Lundi au Samedi: 10h00 - 19h30"
}'::jsonb, NOW()),
('announcement', '{
    "text": "Nouvelle Collection Automne-Hiver | Livraison offerte à partir de 180 TND",
    "is_active": true,
    "link_url": "/boutique"
}'::jsonb, NOW()),
('hero', '{
    "badge": "Collection 2026",
    "title": "Votre style, votre signature.",
    "subtitle": "Découvrez une mode féminine pensée pour chaque instant. L''élégance raffinée et le confort absolu réunis dans nos créations exclusives.",
    "button_text": "Découvrir la collection",
    "button_url": "/boutique",
    "image_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
}'::jsonb, NOW()),
('policies', '{
    "delivery": "Livraison rapide sur toute la Tunisie sous 24h à 72h ouvrables. Paiement sécurisé à la livraison (Cash on Delivery).",
    "returns": "Échanges et retours faciles sous 14 jours. Les articles doivent être retournés non portés avec leurs étiquettes d''origine."
}'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW();

-- 2. Shipping Zones & Methods
INSERT INTO public.shipping_zones (id, name, country, region, is_active) VALUES
('11111111-1111-1111-1111-111111111101', 'Grand Tunis', 'Tunisie', 'Tunis, Ariana, Ben Arous, Manouba', true),
('11111111-1111-1111-1111-111111111102', 'Sahel & Cap Bon', 'Tunisie', 'Sousse, Monastir, Mahdia, Nabeul', true),
('11111111-1111-1111-1111-111111111103', 'Toute la Tunisie (National)', 'Tunisie', 'Autres Gouvernorats', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shipping_methods (id, zone_id, name, price, free_shipping_threshold, estimated_min_days, estimated_max_days, is_active) VALUES
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Livraison Express Grand Tunis', 7.000, 180.000, 1, 2, true),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'Livraison Standard Sahel & Cap Bon', 8.000, 200.000, 2, 3, true),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 'Livraison Nationale (Aramex / Rapide-Poste)', 9.000, 220.000, 2, 4, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Categories
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order, is_active) VALUES
('33333333-3333-3333-3333-333333333301', 'Robes', 'robes', 'Robes de soirée, robes fluides et coupes couture pour chaque occasion.', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop', 1, true),
('33333333-3333-3333-3333-333333333302', 'Ensembles', 'ensembles', 'Tailleurs pantalon, ensembles coordonnés et vestes structurées.', 'https://images.unsplash.com/photo-1548624149-f9b1859aa941?q=80&w=800&auto=format&fit=crop', 2, true),
('33333333-3333-3333-3333-333333333303', 'Chemisiers & Hauts', 'hauts', 'Blouses satinées, soies fluides et chemisiers sophistiqués.', 'https://images.unsplash.com/photo-1534126511673-b6899657816a?q=80&w=800&auto=format&fit=crop', 3, true),
('33333333-3333-3333-3333-333333333304', 'Manteaux & Vestes', 'vestes', 'Manteaux raffinés, blazers cintrés et trenchs contemporains.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop', 4, true),
('33333333-3333-3333-3333-333333333305', 'Accessoires', 'accessoires', 'Sacs en cuir, étoles délicates et ceintures de finition.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Collections
INSERT INTO public.collections (id, name, slug, description, cover_image_url, is_active) VALUES
('44444444-4444-4444-4444-444444444401', 'Nouvelle Saison', 'nouvelle-saison', 'La collection signature de cette saison mêlant coupes architecturales et fluidité.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop', true),
('44444444-4444-4444-4444-444444444402', 'Capsule Cérémonie', 'capsule-ceremonie', 'Des pièces magistrales pour vos soirées inoubliables et réceptions.', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop', true),
('44444444-4444-4444-4444-444444444403', 'L''Allure Bureau', 'allure-bureau', 'Le vestiaire professionnel réinventé : précision, confort et féminité.', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1200&auto=format&fit=crop', true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Promotions
INSERT INTO public.promotions (id, name, code, discount_type, discount_value, starts_at, ends_at, min_order_amount, usage_limit, is_active) VALUES
('55555555-5555-5555-5555-555555555501', 'Bienvenue chez Güven', 'BIENVENUE10', 'percentage', 10.000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 year', 100.000, 1000, true),
('55555555-5555-5555-5555-555555555502', 'Remise Privilège 20 TND', 'GUVEN20', 'fixed', 20.000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 year', 250.000, 500, true)
ON CONFLICT (code) DO NOTHING;

-- 6. Products
INSERT INTO public.products (
    id, category_id, name, slug, sku, short_description, description,
    composition, care_instructions, size_guide, base_price, compare_at_price,
    currency, status, is_featured, seo_title, seo_description
) VALUES
(
    '66666666-6666-6666-6666-666666666601',
    '33333333-3333-3333-3333-333333333301',
    'Robe Élégance Azur',
    'robe-elegance-azur',
    'GM-ROB-001',
    'Robe midi fluide ceinturée arborant le bleu signature emblématique de la maison Güven Mode.',
    'Incarnation parfaite de l''esprit Güven Mode, la robe Élégance Azur offre une silhouette élancée et aérienne. Confectionnée dans un crêpe de soie doux au tombé impeccable, elle se distingue par sa découpe cintrée délicate et son col tailleur subtilement modernisé.',
    '100% Crêpe de Soie Haute Densité. Doublure 100% viscose respirante.',
    'Nettoyage à sec professionnel recommandé ou lavage délicat à la main 30°C. Repassage doux sur l''envers.',
    'Le mannequin mesure 1m76 et porte une taille 38 (M). Coupe fidèle à la taille.',
    189.000,
    220.000,
    'TND',
    'published',
    true,
    'Robe Élégance Azur | GÜVEN MODE',
    'Découvrez la Robe Élégance Azur, pièce maîtresse de la maison GÜVEN MODE. Livraison dans toute la Tunisie.'
),
(
    '66666666-6666-6666-6666-666666666602',
    '33333333-3333-3333-3333-333333333302',
    'Tailleur Pantalon Victoire',
    'tailleur-pantalon-victoire',
    'GM-ENS-002',
    'Ensemble tailleur structuré composé d''une veste ceinturée et d''un pantalon palazzo à pinces.',
    'Une coupe architecturale qui allie puissance et grâce féminine. Le tailleur Victoire sublime votre démarche en toute occasion, de vos rendez-vous professionnels à vos dîners les plus raffinés.',
    '78% Laine froide peignée, 20% Soie, 2% Élasthanne.',
    'Nettoyage à sec uniquement.',
    'Coupe ajustée à la taille. Prenez votre taille habituelle.',
    289.000,
    340.000,
    'TND',
    'published',
    true,
    'Tailleur Pantalon Victoire | GÜVEN MODE',
    'Tailleur femme haut de gamme deux pièces par GÜVEN MODE.'
),
(
    '66666666-6666-6666-6666-666666666603',
    '33333333-3333-3333-3333-333333333301',
    'Robe Longue Soie Plissée',
    'robe-longue-soie-plissee',
    'GM-ROB-003',
    'Robe de soirée longue avec bustier drapé et jupe plissée soleil à l''allure somptueuse.',
    'Faites sensation lors de vos soirées de gala avec cette création d''exception. Le plissé soleil ondule gracieusement à chacun de vos pas tandis que le bustier sculptant assure un maintien parfait.',
    '100% Mousseline de Soie. Doublure satinée.',
    'Nettoyage à sec spécialisé.',
    'Longueur totale: 148 cm. Guide des tailles disponible.',
    320.000,
    NULL,
    'TND',
    'published',
    true,
    'Robe Longue Soie Plissée | GÜVEN MODE',
    'Robe de soirée longue plissée soleil pour cérémonie et gala.'
),
(
    '66666666-6666-6666-6666-666666666604',
    '33333333-3333-3333-3333-333333333303',
    'Chemisier Satiné Lavallière',
    'chemisier-satine-lavalliere',
    'GM-HAU-004',
    'Chemisier en satin soyeux avec col nœud lavallière et boutons bijoux recouverts.',
    'Un classique intemporel revisité avec audace. Sa texture lumineuse capte subtilement la lumière pour apporter une touche d''éclat immédiat à vos tenues.',
    '95% Satin de Soie, 5% Élasthanne.',
    'Lavage main à l''eau tiède ou programme soie en machine.',
    'Coupe droite fluide.',
    125.000,
    145.000,
    'TND',
    'published',
    false,
    'Chemisier Satiné Nœud Lavallière | GÜVEN MODE',
    'Blouse femme satinée col lavallière par Güven Mode.'
),
(
    '66666666-6666-6666-6666-666666666605',
    '33333333-3333-3333-3333-333333333304',
    'Manteau Laine Cachemire Majestueux',
    'manteau-laine-cachemire-majestueux',
    'GM-MAN-005',
    'Manteau long croisé en drap de laine et cachemire avec ceinture amovible surpiquée.',
    'Le summum du luxe hivernal. Chaud, enveloppant et impeccablement coupé, ce manteau structure la silhouette avec une nonchalance aristocratique.',
    '80% Laine vierge, 20% Cachemire.',
    'Nettoyage à sec pressing uniquement.',
    'Coupe oversize modérée.',
    380.000,
    420.000,
    'TND',
    'published',
    true,
    'Manteau Laine et Cachemire Majestueux | GÜVEN MODE',
    'Manteau long luxe en laine vierge et cachemire.'
),
(
    '66666666-6666-6666-6666-666666666606',
    '33333333-3333-3333-3333-333333333301',
    'Robe Trapèze Noir Signature',
    'robe-trapeze-noir-signature',
    'GM-ROB-006',
    'La petite robe noire réinventée avec une encolure bateau et une découpe dos subtile.',
    'Indispensable vestimentaire par excellence, elle vous accompagne avec aisance du bureau jusqu''au cocktail du soir. Matière infroissable au toucher velouté.',
    '68% Viscose certifiée, 28% Polyamide, 4% Élasthanne.',
    'Lavage en machine à 30°C programme délicat.',
    'Taille standard.',
    165.000,
    NULL,
    'TND',
    'published',
    false,
    'Robe Trapèze Noire Signature | GÜVEN MODE',
    'Petite robe noire raffinée et intemporelle Güven Mode.'
)
ON CONFLICT (slug) DO NOTHING;

-- 7. Product Images
INSERT INTO public.product_images (product_id, storage_path, alt_text, sort_order, is_primary) VALUES
-- Robe Élégance Azur
('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop', 'Robe Élégance Azur - Vue de face', 0, true),
('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop', 'Robe Élégance Azur - Détail mouvement', 1, false),
('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop', 'Robe Élégance Azur - Vue dos et ceinture', 2, false),

-- Tailleur Pantalon Victoire
('66666666-6666-6666-6666-666666666602', 'https://images.unsplash.com/photo-1548624149-f9b1859aa941?q=80&w=1000&auto=format&fit=crop', 'Tailleur Pantalon Victoire - Porté complet', 0, true),
('66666666-6666-6666-6666-666666666602', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1000&auto=format&fit=crop', 'Tailleur Victoire - Détail veste et revers', 1, false),

-- Robe Longue Soie Plissée
('66666666-6666-6666-6666-666666666603', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop', 'Robe Longue Plissée - Vue d''ensemble', 0, true),
('66666666-6666-6666-6666-666666666603', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1000&auto=format&fit=crop', 'Robe Longue Plissée - Vue mouvement', 1, false),

-- Chemisier Satiné
('66666666-6666-6666-6666-666666666604', 'https://images.unsplash.com/photo-1534126511673-b6899657816a?q=80&w=1000&auto=format&fit=crop', 'Chemisier Satiné Lavallière Ivoire', 0, true),

-- Manteau Majestueux
('66666666-6666-6666-6666-666666666605', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop', 'Manteau Laine Cachemire Porté', 0, true),

-- Robe Trapèze Noir
('66666666-6666-6666-6666-666666666606', 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=1000&auto=format&fit=crop', 'Robe Trapèze Noir Signature', 0, true)
ON CONFLICT DO NOTHING;

-- 8. Product Variants & Inventory Setup
-- Helper function to safely insert variants with initial inventory
DO $$
DECLARE
    v_prod RECORD;
    v_var_id UUID;
    v_sizes TEXT[] := ARRAY['36 (S)', '38 (M)', '40 (L)', '42 (XL)'];
    v_size TEXT;
    v_stock INT;
BEGIN
    -- Robe Élégance Azur Variants (Bleu Güven & Noir)
    FOR v_size IN SELECT unnest(v_sizes)
    LOOP
        v_stock := CASE
            WHEN v_size = '36 (S)' THEN 10
            WHEN v_size = '38 (M)' THEN 6
            WHEN v_size = '40 (L)' THEN 3
            ELSE 2
        END;

        -- Bleu Güven Variant
        INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, size_label, is_active)
        VALUES ('66666666-6666-6666-6666-666666666601', 'GM-ROB-001-BLU-' || SUBSTRING(v_size FROM 1 FOR 2), 'Bleu Güven', '#1598C8', v_size, true)
        ON CONFLICT (product_id, color_name, size_label) DO UPDATE SET is_active = true
        RETURNING id INTO v_var_id;

        INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
        VALUES (v_var_id, v_stock, 0, 3)
        ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = v_stock;

        -- Noir Intense Variant
        INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, size_label, is_active)
        VALUES ('66666666-6666-6666-6666-666666666601', 'GM-ROB-001-BLK-' || SUBSTRING(v_size FROM 1 FOR 2), 'Noir Intense', '#1A1A1A', v_size, true)
        ON CONFLICT (product_id, color_name, size_label) DO UPDATE SET is_active = true
        RETURNING id INTO v_var_id;

        INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
        VALUES (v_var_id, v_stock + 2, 0, 3)
        ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = v_stock + 2;
    END LOOP;

    -- Tailleur Victoire Variants (Sable Doré & Ivoire)
    FOR v_size IN SELECT unnest(v_sizes)
    LOOP
        INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, size_label, is_active)
        VALUES ('66666666-6666-6666-6666-666666666602', 'GM-ENS-002-SAB-' || SUBSTRING(v_size FROM 1 FOR 2), 'Sable Doré', '#E8DDD0', v_size, true)
        ON CONFLICT (product_id, color_name, size_label) DO UPDATE SET is_active = true
        RETURNING id INTO v_var_id;

        INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
        VALUES (v_var_id, 5, 0, 2)
        ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = 5;

        INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, size_label, is_active)
        VALUES ('66666666-6666-6666-6666-666666666602', 'GM-ENS-002-IVO-' || SUBSTRING(v_size FROM 1 FOR 2), 'Ivoire Pur', '#FAF8F5', v_size, true)
        ON CONFLICT (product_id, color_name, size_label) DO UPDATE SET is_active = true
        RETURNING id INTO v_var_id;

        INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
        VALUES (v_var_id, 4, 0, 2)
        ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = 4;
    END LOOP;

    -- Robe Longue Soie Plissée (Poudre Blush & Noir)
    FOR v_size IN SELECT unnest(v_sizes)
    LOOP
        INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, size_label, is_active)
        VALUES ('66666666-6666-6666-6666-666666666603', 'GM-ROB-003-BLU-' || SUBSTRING(v_size FROM 1 FOR 2), 'Poudre Blush', '#EAD9D8', v_size, true)
        ON CONFLICT (product_id, color_name, size_label) DO UPDATE SET is_active = true
        RETURNING id INTO v_var_id;

        INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
        VALUES (v_var_id, 3, 0, 2)
        ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = 3;
    END LOOP;

    -- Chemisier Satiné
    FOR v_size IN SELECT unnest(v_sizes)
    LOOP
        INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, size_label, is_active)
        VALUES ('66666666-6666-6666-6666-666666666604', 'GM-HAU-004-IVO-' || SUBSTRING(v_size FROM 1 FOR 2), 'Blanc Soie', '#FFFFFF', v_size, true)
        ON CONFLICT (product_id, color_name, size_label) DO UPDATE SET is_active = true
        RETURNING id INTO v_var_id;

        INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
        VALUES (v_var_id, 8, 0, 3)
        ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = 8;
    END LOOP;

    -- Manteau Laine
    FOR v_size IN SELECT unnest(v_sizes)
    LOOP
        INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, size_label, is_active)
        VALUES ('66666666-6666-6666-6666-666666666605', 'GM-MAN-005-CAM-' || SUBSTRING(v_size FROM 1 FOR 2), 'Camel Royal', '#C19A6B', v_size, true)
        ON CONFLICT (product_id, color_name, size_label) DO UPDATE SET is_active = true
        RETURNING id INTO v_var_id;

        INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
        VALUES (v_var_id, 4, 0, 2)
        ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = 4;
    END LOOP;

    -- Robe Trapèze
    FOR v_size IN SELECT unnest(v_sizes)
    LOOP
        INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, size_label, is_active)
        VALUES ('66666666-6666-6666-6666-666666666606', 'GM-ROB-006-NOI-' || SUBSTRING(v_size FROM 1 FOR 2), 'Noir Profond', '#111111', v_size, true)
        ON CONFLICT (product_id, color_name, size_label) DO UPDATE SET is_active = true
        RETURNING id INTO v_var_id;

        INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
        VALUES (v_var_id, 7, 0, 3)
        ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = 7;
    END LOOP;
END $$;

-- 9. Link Products to Collections
INSERT INTO public.product_collections (product_id, collection_id) VALUES
('66666666-6666-6666-6666-666666666601', '44444444-4444-4444-4444-444444444401'),
('66666666-6666-6666-6666-666666666602', '44444444-4444-4444-4444-444444444401'),
('66666666-6666-6666-6666-666666666602', '44444444-4444-4444-4444-444444444403'),
('66666666-6666-6666-6666-666666666603', '44444444-4444-4444-4444-444444444402'),
('66666666-6666-6666-6666-666666666604', '44444444-4444-4444-4444-444444444403'),
('66666666-6666-6666-6666-666666666605', '44444444-4444-4444-4444-444444444401'),
('66666666-6666-6666-6666-666666666606', '44444444-4444-4444-4444-444444444401')
ON CONFLICT (product_id, collection_id) DO NOTHING;
