/**
 * 收藏夹状态管理
 */
import { create } from 'zustand';
import type { AiFavorite } from '@/types/favorite';
import * as favoriteService from '@/services/favoriteService';

interface FavoriteState {
  favorites: AiFavorite[];
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
  addFavorite: (content: string, role: string, conversationTitle?: string) => Promise<void>;
  deleteFavorite: (id: string) => Promise<void>;
  deleteAllFavorites: () => Promise<void>;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  isLoading: false,

  fetchFavorites: async () => {
    set({ isLoading: true });
    try {
      const favorites = await favoriteService.listFavorites();
      set({ favorites });
    } catch (e) {
      console.error('Failed to fetch favorites:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addFavorite: async (content, role, conversationTitle) => {
    try {
      const fav = await favoriteService.addFavorite(content, role, conversationTitle);
      set({ favorites: [fav, ...get().favorites] });
    } catch (e) {
      console.error('Failed to add favorite:', e);
    }
  },

  deleteFavorite: async (id) => {
    try {
      await favoriteService.deleteFavorite(id);
      set({ favorites: get().favorites.filter((f) => f.id !== id) });
    } catch (e) {
      console.error('Failed to delete favorite:', e);
    }
  },

  deleteAllFavorites: async () => {
    try {
      await favoriteService.deleteAllFavorites();
      set({ favorites: [] });
    } catch (e) {
      console.error('Failed to delete all favorites:', e);
    }
  },
}));
