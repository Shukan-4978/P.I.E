import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.user, token: data.token, isLoading: false });
          return data;
        } catch (err) {
          const error = err.response?.data?.error || 'Login failed';
          set({ error, isLoading: false });
          throw new Error(error);
        }
      },

      register: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', formData);
          set({ user: data.user, token: data.token, isLoading: false });
          return data;
        } catch (err) {
          const error = err.response?.data?.error || 'Registration failed';
          set({ error, isLoading: false });
          throw new Error(error);
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
        // Clear any other session-related data if necessary
      },

      updateUser: (updates) => {
        set({ user: { ...get().user, ...updates } });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
        } catch (err) {
          set({ user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'pie-auth',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for automatic logout on browser/tab close
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export default useAuthStore;

