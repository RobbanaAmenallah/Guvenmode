import { 
  Product, Category, Collection, ProductVariant, 
  Order, OrderItem, OrderStatusHistory, Promotion, 
  ShippingMethod, SiteSettings, CustomerAddress, UserProfile 
} from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';

// In-Memory Relational Database Store reflecting Supabase Schema
export class DbStore {
  public categories: Category[] = [];
  public collections: Collection[] = [];
  public products: Product[] = [];
  public productCollections: { product_id: string; collection_id: string }[] = [];
  public inventoryMovements: any[] = [];
  public orders: Order[] = [];
  public promotions: Promotion[] = [];
  public shippingMethods: ShippingMethod[] = [];
  public siteSettings: Record<string, any> = {};
  public profiles: UserProfile[] = [];
  public addresses: CustomerAddress[] = [];
  public newsletter: { id: string; email: string; created_at: string }[] = [];
  public notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    related_entity_id?: string;
    read: boolean;
    created_at: string;
  }[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Settings
    this.siteSettings = {
      general: {
        store_name: "GÜVEN MODE",
        legal_name: "GÜVEN MODE SARL",
        currency: "TND",
        currency_symbol: "DT",
        contact_email: "guvenmode@gmail.com",
        phone: "+216 28 827 626",
        whatsapp: "+216 28 827 626",
        facebook_url: "https://www.facebook.com/search/top?q=guven%20mode",
        instagram_url: "https://www.instagram.com/guven_mode/",
        store_address: "Avenue Habib Bourguiba, Tunis, Tunisie",
        business_hours: "Du Lundi au Samedi: 10h00 - 19h30"
      },
      announcement: {
        text: "Nouvelle Collection Automne-Hiver | Livraison offerte à partir de 180 TND",
        is_active: true,
        link_url: "/boutique"
      },
      hero: {
        badge: "Collection 2026",
        title: "Votre style, votre signature.",
        subtitle: "Découvrez une mode féminine pensée pour chaque instant. L'élégance raffinée et le confort absolu réunis dans nos créations exclusives.",
        button_text: "Découvrir la collection",
        button_url: "/boutique",
        image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
      },
      policies: {
        delivery: "Livraison rapide sur toute la Tunisie sous 24h à 72h ouvrables. Paiement sécurisé à la livraison (Cash on Delivery).",
        returns: "Échanges et retours faciles sous 14 jours. Les articles doivent être retournés non portés avec leurs étiquettes d'origine."
      }
    };

    // 2. Shipping
    this.shippingMethods = [
      {
        id: '22222222-2222-2222-2222-222222222201',
        name: 'Livraison Express Grand Tunis',
        price: 7.000,
        free_shipping_threshold: 180.000,
        estimated_min_days: 1,
        estimated_max_days: 2,
        is_active: true
      },
      {
        id: '22222222-2222-2222-2222-222222222202',
        name: 'Livraison Standard Sahel & Cap Bon',
        price: 8.000,
        free_shipping_threshold: 200.000,
        estimated_min_days: 2,
        estimated_max_days: 3,
        is_active: true
      },
      {
        id: '22222222-2222-2222-2222-222222222203',
        name: 'Livraison Nationale (Aramex / Express)',
        price: 9.000,
        free_shipping_threshold: 220.000,
        estimated_min_days: 2,
        estimated_max_days: 4,
        is_active: true
      }
    ];

    // 3. Categories
    this.categories = [
      {
        id: '33333333-3333-3333-3333-333333333301',
        name: 'Robes',
        slug: 'robes',
        description: 'Robes de soirée, robes fluides et coupes couture pour chaque instant d\'élégance.',
        image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333302',
        name: 'Ensembles',
        slug: 'ensembles',
        description: 'Tailleurs pantalon, ensembles coordonnés et vestes structurées.',
        image_url: 'https://images.unsplash.com/photo-1548624149-f9b1859aa941?q=80&w=800&auto=format&fit=crop',
        sort_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333303',
        name: 'Chemisiers & Hauts',
        slug: 'hauts',
        description: 'Blouses satinées, soies fluides et chemisiers sophistiqués.',
        image_url: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?q=80&w=800&auto=format&fit=crop',
        sort_order: 3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333304',
        name: 'Manteaux & Vestes',
        slug: 'vestes',
        description: 'Manteaux raffinés, blazers cintrés et vestes d\'exception.',
        image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
        sort_order: 4,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333305',
        name: 'Accessoires',
        slug: 'accessoires',
        description: 'Sacs en cuir, étoles délicates et ceintures de finition.',
        image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
        sort_order: 5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // 4. Collections
    this.collections = [
      {
        id: '44444444-4444-4444-4444-444444444401',
        name: 'Nouvelle Saison',
        slug: 'nouvelle-saison',
        description: 'La collection signature mêlant coupes architecturales et fluidité féminine.',
        cover_image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '44444444-4444-4444-4444-444444444402',
        name: 'Capsule Cérémonie',
        slug: 'capsule-ceremonie',
        description: 'Des pièces magistrales pour vos soirées inoubliables et réceptions.',
        cover_image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '44444444-4444-4444-4444-444444444403',
        name: 'L\'Allure Bureau',
        slug: 'allure-bureau',
        description: 'Le vestiaire professionnel réinventé : précision, confort et chic.',
        cover_image_url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1200&auto=format&fit=crop',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // 5. Promotions
    this.promotions = [
      {
        id: '55555555-5555-5555-5555-555555555501',
        name: 'Bienvenue chez Güven',
        code: 'BIENVENUE10',
        discount_type: 'percentage',
        discount_value: 10,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 31536000000).toISOString(),
        min_order_amount: 100,
        usage_limit: 1000,
        usage_count: 3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '55555555-5555-5555-5555-555555555502',
        name: 'Remise Privilège 20 TND',
        code: 'GUVEN20',
        discount_type: 'fixed',
        discount_value: 20,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 31536000000).toISOString(),
        min_order_amount: 250,
        usage_limit: 500,
        usage_count: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // 6. Products with realistic variants & inventory
    const createVariants = (
      productId: string,
      skuPrefix: string,
      colors: { name: string; hex: string; code: string }[],
      sizes: { label: string; stock: number }[]
    ): ProductVariant[] => {
      const vars: ProductVariant[] = [];
      colors.forEach(col => {
        sizes.forEach(sz => {
          vars.push({
            id: uuidv4(),
            product_id: productId,
            sku: `${skuPrefix}-${col.code}-${sz.label.substring(0, 2)}`,
            color_name: col.name,
            color_hex: col.hex,
            size_label: sz.label,
            price_override: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            inventory: {
              quantity_on_hand: sz.stock,
              quantity_reserved: 0,
              available_stock: sz.stock,
              low_stock_threshold: 3
            }
          });
        });
      });
      return vars;
    };

    // Robe 1
    const p1Id = '66666666-6666-6666-6666-666666666601';
    const p1Variants = createVariants(
      p1Id,
      'GM-ROB-001',
      [
        { name: 'Bleu Güven', hex: '#1598C8', code: 'BLU' },
        { name: 'Noir Intense', hex: '#1A1A1A', code: 'BLK' }
      ],
      [
        { label: '36 (S)', stock: 10 },
        { label: '38 (M)', stock: 6 },
        { label: '40 (L)', stock: 3 },
        { label: '42 (XL)', stock: 2 }
      ]
    );

    // Product 2
    const p2Id = '66666666-6666-6666-6666-666666666602';
    const p2Variants = createVariants(
      p2Id,
      'GM-ENS-002',
      [
        { name: 'Sable Doré', hex: '#E8DDD0', code: 'SAB' },
        { name: 'Ivoire Pur', hex: '#FAF8F5', code: 'IVO' }
      ],
      [
        { label: '36 (S)', stock: 5 },
        { label: '38 (M)', stock: 4 },
        { label: '40 (L)', stock: 3 }
      ]
    );

    // Product 3
    const p3Id = '66666666-6666-6666-6666-666666666603';
    const p3Variants = createVariants(
      p3Id,
      'GM-ROB-003',
      [
        { name: 'Poudre Blush', hex: '#EAD9D8', code: 'BLS' },
        { name: 'Bleu Güven', hex: '#1598C8', code: 'BLU' }
      ],
      [
        { label: '36 (S)', stock: 4 },
        { label: '38 (M)', stock: 3 },
        { label: '40 (L)', stock: 2 }
      ]
    );

    // Product 4
    const p4Id = '66666666-6666-6666-6666-666666666604';
    const p4Variants = createVariants(
      p4Id,
      'GM-HAU-004',
      [
        { name: 'Blanc Soie', hex: '#FFFFFF', code: 'BLC' },
        { name: 'Poudre Blush', hex: '#EAD9D8', code: 'BLS' }
      ],
      [
        { label: '36 (S)', stock: 8 },
        { label: '38 (M)', stock: 6 },
        { label: '40 (L)', stock: 4 }
      ]
    );

    // Product 5
    const p5Id = '66666666-6666-6666-6666-666666666605';
    const p5Variants = createVariants(
      p5Id,
      'GM-MAN-005',
      [
        { name: 'Camel Royal', hex: '#C19A6B', code: 'CAM' },
        { name: 'Noir Profond', hex: '#1A1A1A', code: 'BLK' }
      ],
      [
        { label: '38 (M)', stock: 4 },
        { label: '40 (L)', stock: 3 },
        { label: '42 (XL)', stock: 2 }
      ]
    );

    // Product 6
    const p6Id = '66666666-6666-6666-6666-666666666606';
    const p6Variants = createVariants(
      p6Id,
      'GM-ROB-006',
      [
        { name: 'Noir Profond', hex: '#111111', code: 'NOI' }
      ],
      [
        { label: '36 (S)', stock: 7 },
        { label: '38 (M)', stock: 5 },
        { label: '40 (L)', stock: 4 }
      ]
    );

    this.products = [
      {
        id: p1Id,
        category_id: '33333333-3333-3333-3333-333333333301',
        name: 'Robe Élégance Azur',
        slug: 'robe-elegance-azur',
        sku: 'GM-ROB-001',
        short_description: 'Robe midi fluide ceinturée arborant le bleu signature emblématique de la maison Güven Mode.',
        description: 'Incarnation parfaite de l\'esprit Güven Mode, la robe Élégance Azur offre une silhouette élancée et aérienne. Confectionnée dans un crêpe de soie doux au tombé impeccable, elle se distingue par sa découpe cintrée délicate et son col tailleur subtilement modernisé.',
        composition: '100% Crêpe de Soie Haute Densité. Doublure 100% viscose respirante.',
        care_instructions: 'Nettoyage à sec professionnel recommandé ou lavage délicat à la main 30°C. Repassage doux sur l\'envers.',
        size_guide: 'Le mannequin mesure 1m76 et porte une taille 38 (M). Coupe fidèle à la taille.',
        base_price: 189.000,
        compare_at_price: 220.000,
        currency: 'TND',
        status: 'published',
        is_featured: true,
        seo_title: 'Robe Élégance Azur | GÜVEN MODE',
        seo_description: 'Découvrez la Robe Élégance Azur, pièce maîtresse de la maison GÜVEN MODE. Livraison dans toute la Tunisie.',
        images: [
          { id: uuidv4(), product_id: p1Id, storage_path: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop', alt_text: 'Robe Élégance Azur - Face', sort_order: 0, is_primary: true, created_at: new Date().toISOString() },
          { id: uuidv4(), product_id: p1Id, storage_path: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop', alt_text: 'Robe Élégance Azur - Mouvement', sort_order: 1, is_primary: false, created_at: new Date().toISOString() },
          { id: uuidv4(), product_id: p1Id, storage_path: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop', alt_text: 'Robe Élégance Azur - Dos', sort_order: 2, is_primary: false, created_at: new Date().toISOString() }
        ],
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-blue-dress-41130-large.mp4',
        variants: p1Variants,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: p2Id,
        category_id: '33333333-3333-3333-3333-333333333302',
        name: 'Tailleur Pantalon Victoire',
        slug: 'tailleur-pantalon-victoire',
        sku: 'GM-ENS-002',
        short_description: 'Ensemble tailleur structuré composé d\'une veste ceinturée et d\'un pantalon palazzo à pinces.',
        description: 'Une coupe architecturale qui allie puissance et grâce féminine. Le tailleur Victoire sublime votre démarche en toute occasion, de vos rendez-vous professionnels à vos dîners les plus raffinés.',
        composition: '78% Laine froide peignée, 20% Soie, 2% Élasthanne.',
        care_instructions: 'Nettoyage à sec uniquement.',
        size_guide: 'Coupe ajustée à la taille. Prenez votre taille habituelle.',
        base_price: 289.000,
        compare_at_price: 340.000,
        currency: 'TND',
        status: 'published',
        is_featured: true,
        seo_title: 'Tailleur Pantalon Victoire | GÜVEN MODE',
        seo_description: 'Tailleur femme haut de gamme deux pièces par GÜVEN MODE.',
        images: [
          { id: uuidv4(), product_id: p2Id, storage_path: 'https://images.unsplash.com/photo-1548624149-f9b1859aa941?q=80&w=1000&auto=format&fit=crop', alt_text: 'Tailleur Victoire - Porté complet', sort_order: 0, is_primary: true, created_at: new Date().toISOString() },
          { id: uuidv4(), product_id: p2Id, storage_path: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1000&auto=format&fit=crop', alt_text: 'Tailleur Victoire - Veste', sort_order: 1, is_primary: false, created_at: new Date().toISOString() }
        ],
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-a-beige-suit-41132-large.mp4',
        variants: p2Variants,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: p3Id,
        category_id: '33333333-3333-3333-3333-333333333301',
        name: 'Robe Longue Soie Plissée',
        slug: 'robe-longue-soie-plissee',
        sku: 'GM-ROB-003',
        short_description: 'Robe de soirée longue avec bustier drapé et jupe plissée soleil à l\'allure somptueuse.',
        description: 'Faites sensation lors de vos soirées de gala avec cette création d\'exception. Le plissé soleil ondule gracieusement à chacun de vos pas tandis que le bustier sculptant assure un maintien parfait.',
        composition: '100% Mousseline de Soie. Doublure satinée.',
        care_instructions: 'Nettoyage à sec spécialisé.',
        size_guide: 'Longueur totale: 148 cm. Guide des tailles disponible.',
        base_price: 320.000,
        compare_at_price: null,
        currency: 'TND',
        status: 'published',
        is_featured: true,
        seo_title: 'Robe Longue Soie Plissée | GÜVEN MODE',
        seo_description: 'Robe de soirée longue plissée soleil pour cérémonie et gala.',
        images: [
          { id: uuidv4(), product_id: p3Id, storage_path: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop', alt_text: 'Robe Longue Plissée', sort_order: 0, is_primary: true, created_at: new Date().toISOString() },
          { id: uuidv4(), product_id: p3Id, storage_path: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1000&auto=format&fit=crop', alt_text: 'Robe Longue Plissée Mouvement', sort_order: 1, is_primary: false, created_at: new Date().toISOString() }
        ],
        variants: p3Variants,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: p4Id,
        category_id: '33333333-3333-3333-3333-333333333303',
        name: 'Chemisier Satiné Lavallière',
        slug: 'chemisier-satine-lavalliere',
        sku: 'GM-HAU-004',
        short_description: 'Chemisier en satin soyeux avec col nœud lavallière et boutons bijoux recouverts.',
        description: 'Un classique intemporel revisité avec audace. Sa texture lumineuse capte subtilement la lumière pour apporter une touche d\'éclat immédiat à vos tenues.',
        composition: '95% Satin de Soie, 5% Élasthanne.',
        care_instructions: 'Lavage main à l\'eau tiède ou programme soie.',
        size_guide: 'Coupe droite fluide.',
        base_price: 125.000,
        compare_at_price: 145.000,
        currency: 'TND',
        status: 'published',
        is_featured: false,
        seo_title: 'Chemisier Satiné Nœud Lavallière | GÜVEN MODE',
        seo_description: 'Blouse femme satinée col lavallière par Güven Mode.',
        images: [
          { id: uuidv4(), product_id: p4Id, storage_path: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?q=80&w=1000&auto=format&fit=crop', alt_text: 'Chemisier Satiné Lavallière Ivoire', sort_order: 0, is_primary: true, created_at: new Date().toISOString() }
        ],
        variants: p4Variants,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: p5Id,
        category_id: '33333333-3333-3333-3333-333333333304',
        name: 'Manteau Laine Cachemire Majestueux',
        slug: 'manteau-laine-cachemire-majestueux',
        sku: 'GM-MAN-005',
        short_description: 'Manteau long croisé en drap de laine et cachemire avec ceinture amovible surpiquée.',
        description: 'Le summum du luxe hivernal. Chaud, enveloppant et impeccablement coupé, ce manteau structure la silhouette avec une nonchalance aristocratique.',
        composition: '80% Laine vierge, 20% Cachemire.',
        care_instructions: 'Nettoyage à sec pressing uniquement.',
        size_guide: 'Coupe oversize modérée.',
        base_price: 380.000,
        compare_at_price: 420.000,
        currency: 'TND',
        status: 'published',
        is_featured: true,
        seo_title: 'Manteau Laine et Cachemire Majestueux | GÜVEN MODE',
        seo_description: 'Manteau long luxe en laine vierge et cachemire.',
        images: [
          { id: uuidv4(), product_id: p5Id, storage_path: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop', alt_text: 'Manteau Laine Cachemire Porté', sort_order: 0, is_primary: true, created_at: new Date().toISOString() }
        ],
        variants: p5Variants,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: p6Id,
        category_id: '33333333-3333-3333-3333-333333333301',
        name: 'Robe Trapèze Noir Signature',
        slug: 'robe-trapeze-noir-signature',
        sku: 'GM-ROB-006',
        short_description: 'La petite robe noire réinventée avec une encolure bateau et une découpe dos subtile.',
        description: 'Indispensable vestimentaire par excellence, elle vous accompagne avec aisance du bureau jusqu\'au cocktail du soir. Matière infroissable au toucher velouté.',
        composition: '68% Viscose certifiée, 28% Polyamide, 4% Élasthanne.',
        care_instructions: 'Lavage en machine à 30°C programme délicat.',
        size_guide: 'Taille standard.',
        base_price: 165.000,
        compare_at_price: null,
        currency: 'TND',
        status: 'published',
        is_featured: false,
        seo_title: 'Robe Trapèze Noire Signature | GÜVEN MODE',
        seo_description: 'Petite robe noire raffinée et intemporelle Güven Mode.',
        images: [
          { id: uuidv4(), product_id: p6Id, storage_path: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=1000&auto=format&fit=crop', alt_text: 'Robe Trapèze Noir Signature', sort_order: 0, is_primary: true, created_at: new Date().toISOString() }
        ],
        variants: p6Variants,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Connect products with categories in memory
    this.products.forEach(p => {
      p.category = this.categories.find(c => c.id === p.category_id);
    });

    // 7. Seed an initial sample order so Admin Dashboard analytics and order lifecycle can be verified immediately
    const sampleVariant = this.products[0].variants[0];
    const initialOrderNumber = 'GM-2026-1001';
    const sampleOrderId = uuidv4();
    this.orders.push({
      id: sampleOrderId,
      order_number: initialOrderNumber,
      customer_id: null,
      guest_email: 'sarah.b@gmail.com',
      customer_name: 'Sarah Ben Mahmoud',
      customer_phone: '+216 24 555 888',
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'cod',
      currency: 'TND',
      subtotal_amount: 189.000,
      discount_amount: 0,
      shipping_amount: 7.000,
      tax_amount: 0,
      total_amount: 196.000,
      shipping_address_snapshot: {
        recipient_name: 'Sarah Ben Mahmoud',
        phone: '+216 24 555 888',
        region: 'Tunis',
        city: 'La Marsa',
        street_address: '14 Rue Sidi Abdelaziz',
        postal_code: '2078',
        notes: 'Appeler avant de livrer s.v.p.'
      },
      customer_note: 'Merci de soigner le paquet cadeau !',
      admin_note: null,
      idempotency_key: 'seed-order-1',
      placed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      items: [
        {
          id: uuidv4(),
          order_id: sampleOrderId,
          product_id: this.products[0].id,
          variant_id: sampleVariant.id,
          product_name_snapshot: this.products[0].name,
          sku_snapshot: sampleVariant.sku,
          size_snapshot: sampleVariant.size_label,
          color_snapshot: sampleVariant.color_name,
          image_url_snapshot: this.products[0].images[0].storage_path,
          quantity: 1,
          original_unit_price: 189.000,
          unit_discount: 0,
          final_unit_price: 189.000,
          line_total: 189.000,
          created_at: new Date().toISOString()
        }
      ],
      history: [
        {
          id: uuidv4(),
          order_id: sampleOrderId,
          old_status: 'none',
          new_status: 'pending',
          note: 'Commande reçue',
          created_at: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ]
    });
    // Reserve 1 item for this sample order
    sampleVariant.inventory!.quantity_reserved += 1;
    sampleVariant.inventory!.available_stock -= 1;

    this.notifications.push({
      id: uuidv4(),
      type: 'order_created',
      title: `Nouvelle commande ${initialOrderNumber}`,
      message: `Sarah Ben Mahmoud a passé une commande de 196.000 DT (La Marsa)`,
      related_entity_id: sampleOrderId,
      read: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    });
  }
}

export const db = new DbStore();
