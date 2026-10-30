import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, UserRole } from '../types/index.js';
import { useCartStore } from './useCartStore.js';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,

      login: (user, token) => {
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';
        localStorage.setItem('guven_auth_token', token);
        if (isAdmin) {
          localStorage.setItem('guven_admin_key', 'guven-admin-2026');
        }
        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin,
        });

        // Restore & merge permanent cart from Supabase
        useCartStore.getState().mergeWithBackend().catch(() => {});
      },

      logout: () => {
        localStorage.removeItem('guven_auth_token');
        localStorage.removeItem('guven_admin_key');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
        });
        useCartStore.getState().clearCart();
      },

      updateUser: (data) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...data } });
        }
      },
    }),
    {
      name: 'guven_auth',
    }
  )
);
