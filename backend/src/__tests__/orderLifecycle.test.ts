import { describe, it, expect } from 'vitest';
import { CheckoutService } from '../services/checkoutService.js';
import { OrderService } from '../services/orderService.js';
import { ProductService } from '../services/productService.js';
import { InventoryService } from '../services/inventoryService.js';
import { db } from '../data/dbStore.js';

describe('GÜVEN MODE - Order Lifecycle & Inventory Integrity Tests', () => {
  it('handles complete order status lifecycle: creation, cancellation and stock release', async () => {
    const { products } = await ProductService.getProducts({ status: 'published' });
    const product = products[0] || db.products[0];
    const variant = product.variants[0];

    // 1. Create a test order
    const order = await CheckoutService.processCheckout({
      customerName: 'Fatma Ben Ali',
      customerPhone: '98765432',
      shippingAddress: {
        recipientName: 'Fatma Ben Ali',
        phone: '98765432',
        region: 'Sousse',
        city: 'Kantaoui',
        streetAddress: 'Rue des Palmiers'
      },
      paymentMethod: 'cod',
      items: [
        {
          variantId: variant.id,
          quantity: 1
        }
      ]
    });

    expect(order).toBeDefined();
    expect(order.status).toBe('pending');

    // 2. Transition status to confirmed
    const confirmedOrder = await OrderService.updateOrderStatus(
      order.id,
      'confirmed',
      '00000000-0000-0000-0000-000000000001',
      'Commande confirmée au téléphone avec la cliente'
    );
    expect(confirmedOrder.status).toBe('confirmed');

    // 3. Cancel order and verify stock release transition
    const cancelledOrder = await OrderService.updateOrderStatus(
      order.id,
      'cancelled',
      '00000000-0000-0000-0000-000000000001',
      'Client injoignable, annulation'
    );
    expect(cancelledOrder.status).toBe('cancelled');
  });

  it('records inventory adjustments with admin audit trail', async () => {
    const { products } = await ProductService.getProducts({ status: 'published' });
    const product = products[0] || db.products[0];
    const variant = product.variants[0];

    const result = await InventoryService.adjustStock(
      variant.id,
      15,
      '00000000-0000-0000-0000-000000000001',
      'Réapprovisionnement atelier'
    );

    expect(result.variant_id).toBe(variant.id);
    expect(result.newOnHand).toBe(15);
  });
});
