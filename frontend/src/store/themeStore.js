import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark', // default dark

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      },

      initTheme: () => {
        const { theme } = get();
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
    }),
    { name: 'pie-theme' }
  )
);

export default useThemeStore;
