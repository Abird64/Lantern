import { create } from 'zustand';
import * as settingService from '@/services/settingService';

interface SettingState {
  /** 内存缓存，key → value */
  cache: Record<string, string>;
  /** 是否已从后端加载 */
  loaded: boolean;
  /** 从后端加载所有设置 */
  loadAll: () => Promise<void>;
  /** 获取设置值（从缓存） */
  get: (key: string, fallback?: string) => string;
  /** 设置值（同时写缓存+后端） */
  set: (key: string, value: string) => Promise<void>;
  /** 删除设置 */
  remove: (key: string) => Promise<void>;
}

export const useSettingStore = create<SettingState>((set, get) => ({
  cache: {},
  loaded: false,

  loadAll: async () => {
    try {
      const settings = await settingService.listSettings();
      const cache: Record<string, string> = {};
      for (const s of settings) {
        cache[s.key] = s.value;
      }
      set({ cache, loaded: true });
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  },

  get: (key: string, fallback = '') => {
    const { cache } = get();
    return cache[key] ?? fallback;
  },

  set: async (key: string, value: string) => {
    // 先更新缓存
    set((state) => ({ cache: { ...state.cache, [key]: value } }));
    // 再写后端
    try {
      await settingService.setSetting(key, value);
    } catch (e) {
      console.error(`Failed to save setting "${key}":`, e);
    }
  },

  remove: async (key: string) => {
    set((state) => {
      const cache = { ...state.cache };
      delete cache[key];
      return { cache };
    });
    try {
      await settingService.deleteSetting(key);
    } catch (e) {
      console.error(`Failed to delete setting "${key}":`, e);
    }
  },
}));
