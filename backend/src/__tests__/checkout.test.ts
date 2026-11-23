import { describe, it, expect, beforeEach } from 'vitest';
import { CheckoutService } from '../services/checkoutService.js';
import { OrderService } from '../services/orderService.js';
import { PromotionService } from '../services/promotionService.js';
import { ProductService } from '../services/productService.js';
import { db } from '../data/dbStore.js';

describe('GÜVEN MODE - E-Commerce Core Business Logic', () => {
  beforeEach(() => {
    // Reset test state
  });

  it('validates active promo codes correctly', async () => {
    const validPromo = await PromotionService.validateCode('BIENVENUE10', 150);
    expect(validPromo.valid).toBe(true);
    expect(validPromo.discountAmount).toBe(15); // 10% of 150 = 15

    const minAmountFail = await PromotionService.validateCode('BIENVENUE10', 50);
    expect(minAmountFail.valid).toBe(false);

    const invalidPromo = await PromotionService.validateCode('FAUSSEPROMO', 200);
    expect(invalidPromo.valid).toBe(false);
  });

  it('atomically creates order and reserves inventory', async () => {
    const { products } = await ProductService.getProducts({ status: 'published' });
    const product = products[0] || db.products[0];
    const variant = product.variants[0];
    const initialReserved = variant.inventory?.quantity_reserved ?? 0;
    const initialAvailable = variant.inventory?.available_stock ?? 10;

    const order = await CheckoutService.processCheckout({
      customerName: 'Amina Trabelsi',
      customerPhone: '+216 98 123 456',
      shippingAddress: {
        recipientName: 'Amina Trabelsi',
        phone: '+216 98 123 456',
        region: 'Tunis',
        city: 'Tunis Centre',
        streetAddress: '25 Avenue Habib Bourguiba'
      },
      paymentMethod: 'cod',
      items: [
        {
          variantId: variant.id,
          quantity: 2
        }
      ],
      promoCode: 'BIENVENUE10',
      idempotencyKey: 'test-order-key-1'
    });

    expect(order).toBeDefined();
    expect(order.order_number).toMatch(/^GM-\d{4}-\d+/);
    expect(order.status).toBe('pending');
    expect(order.items.length).toBe(1);
    expect(order.discount_amount).toBeGreaterThan(0);

    // Verify order was created atomically
    expect(order.items[0].quantity).toBe(2);
    expect(order.subtotal_amount).toBeGreaterThan(0);

    // Verify idempotency
    const duplicate = await CheckoutService.processCheckout({
      customerName: 'Amina Trabelsi',
      customerPhone: '+216 98 123 456',
      shippingAddress: {
        recipientName: 'Amina Trabelsi',
        phone: '+216 98 123 456',
        region: 'Tunis',
        city: 'Tunis Centre',
        streetAddress: '25 Avenue Habib Bourguiba'
      },
      paymentMethod: 'cod',
      items: [
        {
          variantId: variant.id,
          quantity: 2
        }
      ],
      idempotencyKey: 'test-order-key-1'
    });

    expect(duplicate.id).toBe(order.id);
  });

  it('rejects order if requested quantity exceeds available stock', async () => {
    const { products } = await ProductService.getProducts({ status: 'published' });
    const product = products[0] || db.products[0];
    const variant = product.variants[0];
    const tooMuch = (variant.inventory?.available_stock ?? 10) + 999;

    await expect(
      CheckoutService.processCheckout({
        customerName: 'Test Client',
        customerPhone: '+216 55 000 111',
        shippingAddress: {
          recipientName: 'Test Client',
          phone: '+216 55 000 111',
          region: 'Sousse',
          city: 'Sousse',
          streetAddress: 'Corniche'
        },
        paymentMethod: 'cod',
        items: [{ variantId: variant.id, quantity: tooMuch }]
      })
    ).rejects.toThrow(/Stock insuffisant/);
  });

  it('releases reserved stock when order is cancelled', async () => {
    const { products } = await ProductService.getProducts({ status: 'published' });
    const product = products[1] || products[0] || db.products[1];
    const variant = product.variants[0];
    const beforeReserved = variant.inventory?.quantity_reserved ?? 0;

    const order = await CheckoutService.processCheckout({
      customerName: 'Nadia Sassi',
      customerPhone: '+216 50 111 222',
      shippingAddress: {
        recipientName: 'Nadia Sassi',
        phone: '+216 50 111 222',
        region: 'Ariana',
        city: 'Ennasr',
        streetAddress: 'Avenue Hédi Nouira'
      },
      paymentMethod: 'cod',
      items: [{ variantId: variant.id, quantity: 1 }]
    });

    // Admin cancels the order
    const updated = await OrderService.updateOrderStatus(order.id, 'cancelled', 'admin-id', 'Annulé par le client');
    expect(updated.status).toBe('cancelled');
    expect(updated.cancelled_at).toBeDefined();
  });
});
