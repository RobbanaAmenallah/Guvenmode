import { getSupabase } from '../config/supabase.js';

const supabase = getSupabase();

if (!supabase) {
  console.error('Supabase client not initialized!');
  process.exit(1);
}

async function seed() {
  console.log('Seeding full catalog into Supabase...');

  // 1. Ensure inventory and variants for existing products P3, P4, P5, P6
  const existingVariants = [
    // P3: Robe Longue Soie Plissée (66666666-6666-6666-6666-666666666603)
    { id: '77777777-7777-7777-7777-777777777301', product_id: '66666666-6666-6666-6666-666666666603', sku: 'GM-ROB-003-CRE-36', color_name: 'Crème Nacre', color_hex: '#FAF8F5', size_label: '36 (S)', stock: 5 },
    { id: '77777777-7777-7777-7777-777777777302', product_id: '66666666-6666-6666-6666-666666666603', sku: 'GM-ROB-003-CRE-38', color_name: 'Crème Nacre', color_hex: '#FAF8F5', size_label: '38 (M)', stock: 8 },
    { id: '77777777-7777-7777-7777-777777777303', product_id: '66666666-6666-6666-6666-666666666603', sku: 'GM-ROB-003-CRE-40', color_name: 'Crème Nacre', color_hex: '#FAF8F5', size_label: '40 (L)', stock: 4 },

    // P4: Chemisier Drapé Constance (66666666-6666-6666-6666-666666666604)
    { id: '77777777-7777-7777-7777-777777777401', product_id: '66666666-6666-6666-6666-666666666604', sku: 'GM-TOP-004-BLC-36', color_name: 'Blanc Soie', color_hex: '#FFFFFF', size_label: '36 (S)', stock: 10 },
    { id: '77777777-7777-7777-7777-777777777402', product_id: '66666666-6666-6666-6666-666666666604', sku: 'GM-TOP-004-BLC-38', color_name: 'Blanc Soie', color_hex: '#FFFFFF', size_label: '38 (M)', stock: 12 },
    { id: '77777777-7777-7777-7777-777777777403', product_id: '66666666-6666-6666-6666-666666666604', sku: 'GM-TOP-004-BLC-40', color_name: 'Blanc Soie', color_hex: '#FFFFFF', size_label: '40 (L)', stock: 7 },

    // P5: Manteau Ceinturé Royal Camel (66666666-6666-6666-6666-666666666605)
    { id: '77777777-7777-7777-7777-777777777501', product_id: '66666666-6666-6666-6666-666666666605', sku: 'GM-MAN-005-CAM-38', color_name: 'Camel Royal', color_hex: '#C19A6B', size_label: '38 (M)', stock: 6 },
    { id: '77777777-7777-7777-7777-777777777502', product_id: '66666666-6666-6666-6666-666666666605', sku: 'GM-MAN-005-CAM-40', color_name: 'Camel Royal', color_hex: '#C19A6B', size_label: '40 (L)', stock: 5 },
    { id: '77777777-7777-7777-7777-777777777503', product_id: '66666666-6666-6666-6666-666666666605', sku: 'GM-MAN-005-CAM-42', color_name: 'Camel Royal', color_hex: '#C19A6B', size_label: '42 (XL)', stock: 3 },

    // P6: Robe Fourreau Signature Noire (66666666-6666-6666-6666-666666666606)
    { id: '77777777-7777-7777-7777-777777777601', product_id: '66666666-6666-6666-6666-666666666606', sku: 'GM-ROB-006-NOI-36', color_name: 'Noir Intense', color_hex: '#1A1A1A', size_label: '36 (S)', stock: 9 },
    { id: '77777777-7777-7777-7777-777777777602', product_id: '66666666-6666-6666-6666-666666666606', sku: 'GM-ROB-006-NOI-38', color_name: 'Noir Intense', color_hex: '#1A1A1A', size_label: '38 (M)', stock: 11 },
    { id: '77777777-7777-7777-7777-777777777603', product_id: '66666666-6666-6666-6666-666666666606', sku: 'GM-ROB-006-NOI-40', color_name: 'Noir Intense', color_hex: '#1A1A1A', size_label: '40 (L)', stock: 8 }
  ];

  for (const v of existingVariants) {
    const { stock, ...variantData } = v;
    await supabase.from('product_variants').upsert(variantData, { onConflict: 'id' });
    await supabase.from('inventory').upsert({
      variant_id: v.id,
      quantity_on_hand: stock,
      quantity_reserved: 0,
      low_stock_threshold: 2
    }, { onConflict: 'variant_id' });
  }

  // 2. New Flagship Products
  const newProducts = [
    {
      id: '66666666-6666-6666-6666-666666666607',
      category_id: '33333333-3333-3333-3333-333333333301', // Robes
      name: 'Robe de Soirée Émeraude Impériale',
      slug: 'robe-soiree-emeraude-imperiale',
      sku: 'GM-ROB-007',
      short_description: 'Robe longue en satin de soie vert émeraude avec col bénitier et dos drapé sculpté.',
      description: 'Une pièce maîtresse digne des plus grands défilés. Confectionnée dans un satin de soie lourd au tombé majestueux, cette robe épouse gracieusement les courbes féminines avec un décolleté plongeant subtil et une fente latérale élégante.',
      composition: '92% Soie Mulberry, 8% Élasthanne. Doublure 100% Soie.',
      care_instructions: 'Nettoyage à sec spécialisé chez un maître teinturier.',
      size_guide: 'Coupe ajustée. Si vous hésitez entre deux tailles, choisissez la taille supérieure.',
      base_price: 340.000,
      compare_at_price: 390.000,
      currency: 'TND',
      status: 'published',
      is_featured: true,
      video_url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-in-a-green-dress-standing-in-a-field-41134-large.mp4',
      images: [
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop'
      ],
      variants: [
        { id: '77777777-7777-7777-7777-777777777701', sku: 'GM-ROB-007-EME-36', color_name: 'Vert Émeraude', color_hex: '#004B23', size_label: '36 (S)', stock: 5 },
        { id: '77777777-7777-7777-7777-777777777702', sku: 'GM-ROB-007-EME-38', color_name: 'Vert Émeraude', color_hex: '#004B23', size_label: '38 (M)', stock: 7 },
        { id: '77777777-7777-7777-7777-777777777703', sku: 'GM-ROB-007-EME-40', color_name: 'Vert Émeraude', color_hex: '#004B23', size_label: '40 (L)', stock: 4 }
      ]
    },
    {
      id: '66666666-6666-6666-6666-666666666608',
      category_id: '33333333-3333-3333-3333-333333333302', // Ensembles
      name: 'Tailleur Élysée Rose Poudré',
      slug: 'tailleur-elysee-rose-poudre',
      sku: 'GM-ENS-008',
      short_description: 'Ensemble blazer cintré et pantalon palazzo taille haute en crêpe fluide haute couture.',
      description: 'L\'incarnation de la douceur et du pouvoir féminin. Le blazer croisé structuré par des épaulettes délicates s\'associe à un pantalon palazzo au mouvement aérien, parfait pour une réception raffinée ou une journée d\'affaires remarquable.',
      composition: '75% Viscose noble, 22% Laine froide, 3% Élasthanne.',
      care_instructions: 'Lavage à sec recommandé. Repassage doux à la vapeur.',
      size_guide: 'Taille normalement. Prenez votre taille habituelle.',
      base_price: 295.000,
      compare_at_price: null,
      currency: 'TND',
      status: 'published',
      is_featured: true,
      video_url: null,
      images: [
        'https://images.unsplash.com/photo-1548624149-f9b1859aa941?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop'
      ],
      variants: [
        { id: '77777777-7777-7777-7777-777777777801', sku: 'GM-ENS-008-POU-36', color_name: 'Rose Poudré', color_hex: '#EAD9D8', size_label: '36 (S)', stock: 6 },
        { id: '77777777-7777-7777-7777-777777777802', sku: 'GM-ENS-008-POU-38', color_name: 'Rose Poudré', color_hex: '#EAD9D8', size_label: '38 (M)', stock: 9 },
        { id: '77777777-7777-7777-7777-777777777803', sku: 'GM-ENS-008-POU-40', color_name: 'Rose Poudré', color_hex: '#EAD9D8', size_label: '40 (L)', stock: 5 },
        { id: '77777777-7777-7777-7777-777777777804', sku: 'GM-ENS-008-POU-42', color_name: 'Rose Poudré', color_hex: '#EAD9D8', size_label: '42 (XL)', stock: 3 }
      ]
    },
    {
      id: '66666666-6666-6666-6666-666666666609',
      category_id: '33333333-3333-3333-3333-333333333303', // Chemisiers
      name: 'Blouse Nacre Manches Volantées',
      slug: 'blouse-nacre-manches-volantees',
      sku: 'GM-TOP-009',
      short_description: 'Blouse vaporeuse en mousseline de soie ivoire avec col cravate amovible et poignets bijoux.',
      description: 'Légère comme un souffle, cette blouse capture la lumière méditerranéenne grâce à ses reflets nacrés. Se porte nouée au col pour une allure aristocratique ou ouverte de façon décontractée chic.',
      composition: '100% Mousseline de soie naturelle.',
      care_instructions: 'Lavage main délicat à froid ou nettoyage à sec.',
      size_guide: 'Coupe fluide légèrement ample.',
      base_price: 135.000,
      compare_at_price: 160.000,
      currency: 'TND',
      status: 'published',
      is_featured: false,
      video_url: null,
      images: [
        'https://images.unsplash.com/photo-1551803091-e20673f15770?q=80&w=1200&auto=format&fit=crop'
      ],
      variants: [
        { id: '77777777-7777-7777-7777-777777777901', sku: 'GM-TOP-009-NAC-36', color_name: 'Ivoire Nacre', color_hex: '#FAF8F5', size_label: '36 (S)', stock: 8 },
        { id: '77777777-7777-7777-7777-777777777902', sku: 'GM-TOP-009-NAC-38', color_name: 'Ivoire Nacre', color_hex: '#FAF8F5', size_label: '38 (M)', stock: 10 },
        { id: '77777777-7777-7777-7777-777777777903', sku: 'GM-TOP-009-NAC-40', color_name: 'Ivoire Nacre', color_hex: '#FAF8F5', size_label: '40 (L)', stock: 6 }
      ]
    },
    {
      id: '66666666-6666-6666-6666-666666666610',
      category_id: '33333333-3333-3333-3333-333333333305', // Accessoires
      name: 'Sac Iconique Cuir Güven N°1',
      slug: 'sac-iconique-cuir-guven-n1',
      sku: 'GM-ACC-010',
      short_description: 'Sac à main en cuir de veau grainé pleine fleur avec fermoir signature en laiton doré.',
      description: 'Façonné artisanalement selon la grande tradition maroquinière. Doté d\'une bandoulière amovible et d\'un compartiment intérieur doublé de suédine, il complète toute silhouette avec une élégance intemporelle.',
      composition: '100% Cuir de veau pleine fleur italien. Bijouterie laiton doré à l\'or fin.',
      care_instructions: 'Protéger de l\'humidité prolongée. Appliquer un lait nourrissant pour cuir.',
      size_guide: 'Dimensions: 28cm x 20cm x 11cm.',
      base_price: 260.000,
      compare_at_price: null,
      currency: 'TND',
      status: 'published',
      is_featured: true,
      video_url: null,
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop'
      ],
      variants: [
        { id: '77777777-7777-7777-7777-777777778001', sku: 'GM-ACC-010-COG-UNI', color_name: 'Cognac Doré', color_hex: '#9E5B32', size_label: 'Taille Unique', stock: 6 },
        { id: '77777777-7777-7777-7777-777777778002', sku: 'GM-ACC-010-NOI-UNI', color_name: 'Noir Ébène', color_hex: '#151515', size_label: 'Taille Unique', stock: 7 }
      ]
    }
  ];

  for (const prod of newProducts) {
    const { images, variants, ...prodData } = prod;
    await supabase.from('products').upsert(prodData, { onConflict: 'id' });

    // Images
    for (let i = 0; i < images.length; i++) {
      await supabase.from('product_images').upsert({
        id: prod.id.replace('6666', '8888').slice(0, -2) + (i < 10 ? '0' + i : i),
        product_id: prod.id,
        storage_path: images[i],
        sort_order: i,
        is_primary: i === 0
      }, { onConflict: 'id' });
    }

    // Variants & Inventory
    for (const v of variants) {
      const { stock, ...vData } = v;
      await supabase.from('product_variants').upsert({
        ...vData,
        product_id: prod.id
      }, { onConflict: 'id' });

      await supabase.from('inventory').upsert({
        variant_id: v.id,
        quantity_on_hand: stock,
        quantity_reserved: 0,
        low_stock_threshold: 2
      }, { onConflict: 'variant_id' });
    }
  }

  // 3. Real Initial Customer Orders in Supabase
  const sampleOrders = [
    {
      id: '99999999-9999-9999-9999-999999999901',
      order_number: 'GM-2026-0842',
      customer_name: 'Syrine Ben Amor',
      customer_email: 'syrine.benamor@gmail.com',
      customer_phone: '+216 98 450 120',
      shipping_address: {
        recipient_name: 'Syrine Ben Amor',
        street_address: 'Avenue Habib Bourguiba, Les Berges du Lac 2',
        city: 'Tunis',
        region: 'Tunis',
        postal_code: '1053',
        country: 'Tunisie',
        phone: '+216 98 450 120'
      },
      status: 'delivered',
      payment_status: 'paid',
      payment_method: 'cod',
      currency: 'TND',
      subtotal_amount: 189.000,
      discount_amount: 0.000,
      shipping_fee: 0.000,
      total_amount: 189.000,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: '99999999-9999-9999-9999-999999999902',
      order_number: 'GM-2026-0843',
      customer_name: 'Meriem Trabelsi',
      customer_email: 'meriem.trabelsi@yahoo.fr',
      customer_phone: '+216 55 312 879',
      shipping_address: {
        recipient_name: 'Meriem Trabelsi',
        street_address: 'Route Touristique Kantaoui',
        city: 'Sousse',
        region: 'Sousse',
        postal_code: '4089',
        country: 'Tunisie',
        phone: '+216 55 312 879'
      },
      status: 'shipped',
      payment_status: 'pending',
      payment_method: 'cod',
      currency: 'TND',
      subtotal_amount: 289.000,
      discount_amount: 20.000,
      shipping_fee: 0.000,
      total_amount: 269.000,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: '99999999-9999-9999-9999-999999999903',
      order_number: 'GM-2026-0844',
      customer_name: 'Inès Karray',
      customer_email: 'ines.karray@gmail.com',
      customer_phone: '+216 21 784 963',
      shipping_address: {
        recipient_name: 'Inès Karray',
        street_address: 'Boulevard 14 Janvier, Route de Gremda km 2',
        city: 'Sfax',
        region: 'Sfax',
        postal_code: '3027',
        country: 'Tunisie',
        phone: '+216 21 784 963'
      },
      status: 'processing',
      payment_status: 'pending',
      payment_method: 'cod',
      currency: 'TND',
      subtotal_amount: 135.000,
      discount_amount: 0.000,
      shipping_fee: 7.000,
      total_amount: 142.000,
      created_at: new Date().toISOString()
    }
  ];

  for (const o of sampleOrders) {
    await supabase.from('orders').upsert(o, { onConflict: 'id' });
  }

  // Order items
  const sampleItems = [
    {
      id: '11111111-1111-1111-1111-111111111101',
      order_id: '99999999-9999-9999-9999-999999999901',
      product_id: '66666666-6666-6666-6666-666666666601',
      variant_id: '77777777-7777-7777-7777-777777777102',
      product_name: 'Robe Élégance Azur',
      sku: 'GM-ROB-001-BLU-38',
      price: 189.000,
      quantity: 1,
      subtotal: 189.000
    },
    {
      id: '11111111-1111-1111-1111-111111111102',
      order_id: '99999999-9999-9999-9999-999999999902',
      product_id: '66666666-6666-6666-6666-666666666602',
      variant_id: '77777777-7777-7777-7777-777777777202',
      product_name: 'Tailleur Pantalon Victoire',
      sku: 'GM-ENS-002-SAB-38',
      price: 289.000,
      quantity: 1,
      subtotal: 289.000
    },
    {
      id: '11111111-1111-1111-1111-111111111103',
      order_id: '99999999-9999-9999-9999-999999999903',
      product_id: '66666666-6666-6666-6666-666666666609',
      variant_id: '77777777-7777-7777-7777-777777777902',
      product_name: 'Blouse Nacre Manches Volantées',
      sku: 'GM-TOP-009-NAC-38',
      price: 135.000,
      quantity: 1,
      subtotal: 135.000
    }
  ];

  for (const item of sampleItems) {
    await supabase.from('order_items').upsert(item, { onConflict: 'id' });
  }

  // 4. Notifications in Supabase
  const sampleNotifications = [
    {
      id: '22222222-2222-2222-2222-222222222201',
      type: 'order_created',
      title: 'Nouvelle commande #GM-2026-0844',
      message: 'Inès Karray a passé commande pour 142.000 DT (Sfax)',
      created_at: new Date().toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222202',
      type: 'order_created',
      title: 'Nouvelle commande #GM-2026-0843',
      message: 'Meriem Trabelsi a passé commande pour 269.000 DT (Sousse)',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  for (const notif of sampleNotifications) {
    await supabase.from('notifications').upsert(notif, { onConflict: 'id' });
  }

  console.log('✓ Successfully seeded full real catalog and live orders into Supabase PostgreSQL!');
}

seed().catch(err => {
  console.error('Seed failure:', err);
  process.exit(1);
});
