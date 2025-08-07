import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser:(user) => {
        const role = user?.user_metadata?.role || null;
        set({ user: { ...user, role } });
      },
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null });
      },
      initializeUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const role = user?.user_metadata?.role || null;
          set({ user: { ...user, role } });
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

/*export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => {
    const role = user?.user_metadata?.role || null;
    set({ user: { ...user, role } });
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  initializeUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const role = user?.user_metadata?.role || null;
      set({ user: { ...user, role } });
    }
  },
}));
*/


//Esquema anterior para autentificación
/*const localUser = JSON.parse(localStorage.getItem('user'));

export const useAuthStore = create((set) => ({
  user: localUser || null,
  login: (username, role) => {
    const user = { username, role };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
}));
*/