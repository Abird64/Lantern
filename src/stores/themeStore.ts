import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageTheme } from '@/styles/theme';

export type ThemeMode = 'colorful' | 'uniform';

interface ThemeState {
  mode: ThemeMode;
  uniformTheme: string;
  /** 用户自定义主题 */
  customThemes: PageTheme[];
  setMode: (mode: ThemeMode) => void;
  setUniformTheme: (id: string) => void;
  addCustomTheme: (theme: PageTheme) => void;
  updateCustomTheme: (id: string, theme: PageTheme) => void;
  deleteCustomTheme: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'colorful',
      uniformTheme: 'lantern',
      customThemes: [],
      setMode: (mode) => set({ mode }),
      setUniformTheme: (id) => set({ uniformTheme: id, mode: 'uniform' }),
      addCustomTheme: (theme) =>
        set((s) => ({ customThemes: [...s.customThemes, theme] })),
      updateCustomTheme: (id, theme) =>
        set((s) => ({
          customThemes: s.customThemes.map((t) => (t.id === id ? theme : t)),
        })),
      deleteCustomTheme: (id) =>
        set((s) => ({
          customThemes: s.customThemes.filter((t) => t.id !== id),
          // 如果当前统一主题是被删的自定义主题，回退到 lantern
          uniformTheme: s.uniformTheme === id ? 'lantern' : s.uniformTheme,
        })),
    }),
    { name: 'shijie-theme' },
  ),
);
