import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '../types/index.js';
import { api } from '../api/client.js';

const GUEST_CART_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CartState {
  items: CartItem[];
  savedAt: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItemsCount: () => number;
  checkGuestExpiration: () => void;
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
  mergeWithBackend: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedAt: Date.now(),
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      checkGuestExpiration: () => {
        const token = localStorage.getItem('guven_auth_token');
        if (!token) {
          const state = get();
          const elapsed = Date.now() - (state.savedAt || 0);
          if (elapsed > GUEST_CART_EXPIRATION_MS) {
            console.log('ℹ Panier internaute expiré (>24h). Réinitialisation.');
            set({ items: [], savedAt: Date.now() });
          }
        }
      },

      addItem: (product, variant, quantity = 1) => {
        get().checkGuestExpiration();

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variant_id === variant.id
          );

          const availableStock = variant.inventory
            ? variant.inventory.quantity_on_hand - variant.inventory.quantity_reserved
            : 10;

          let updatedItems = [...state.items];

          if (existingIndex > -1) {
            const currentQty = state.items[existingIndex].quantity;
            const newQty = Math.min(currentQty + quantity, availableStock);
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: newQty,
            };
          } else {
            const addedQty = Math.min(quantity, availableStock);
            updatedItems.push({
              variant_id: variant.id,
              product,
              variant,
              quantity: addedQty,
            });
          }

          return { items: updatedItems, savedAt: Date.now(), isCartOpen: true };
        });

        // If authenticated, sync with Supabase cart in background
        const token = localStorage.getItem('guven_auth_token');
        if (token) {
          get().syncWithBackend();
        }
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variantId),
          savedAt: Date.now()
        }));

        const token = localStorage.getItem('guven_auth_token');
        if (token) {
          get().syncWithBackend();
        }
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.variant_id !== variantId),
              savedAt: Date.now()
            };
          }

          return {
            items: state.items.map((i) => {
              if (i.variant_id === variantId) {
                const availableStock = i.variant.inventory
                  ? i.variant.inventory.quantity_on_hand - i.variant.inventory.quantity_reserved
                  : 10;
                return {
                  ...i,
                  quantity: Math.min(quantity, availableStock),
                };
              }
              return i;
            }),
            savedAt: Date.now()
          };
        });

        const token = localStorage.getItem('guven_auth_token');
        if (token) {
          get().syncWithBackend();
        }
      },

      clearCart: () => {
        set({ items: [], savedAt: Date.now() });
        const token = localStorage.getItem('guven_auth_token');
        if (token) {
          api.delete('/me/cart').catch(() => {});
        }
      },

      getSubtotal: () => {
        const items = get().items;
        const total = items.reduce((sum, item) => {
          const price = item.variant.price_override ?? item.product.base_price;
          return sum + price * item.quantity;
        }, 0);
        return Number(total.toFixed(3));
      },

      getTotalItemsCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      syncWithBackend: async () => {
        try {
          const itemsPayload = get().items.map(i => ({
            variantId: i.variant_id,
            quantity: i.quantity
          }));
          await api.post('/me/cart/sync', { items: itemsPayload });
        } catch (err) {
          console.error('Error syncing cart with Supabase:', err);
        }
      },

      loadFromBackend: async () => {
        try {
          const res: any = await api.get('/me/cart');
          if (res && Array.isArray(res.items)) {
            set({ items: res.items, savedAt: Date.now() });
          }
        } catch (err) {
          console.error('Error loading cart from Supabase:', err);
        }
      },

      mergeWithBackend: async () => {
        try {
          const currentItems = get().items.map(i => ({
            variantId: i.variant_id,
            quantity: i.quantity
          }));

          const res: any = await api.post('/me/cart/merge', { items: currentItems });
          if (res && Array.isArray(res.items)) {
            set({ items: res.items, savedAt: Date.now() });
          }
        } catch (err) {
          console.error('Error merging cart with Supabase:', err);
        }
      }
    }),
    {
      name: 'guven_cart',
      partialize: (state) => ({ items: state.items, savedAt: state.savedAt }),
    }
  )
);
