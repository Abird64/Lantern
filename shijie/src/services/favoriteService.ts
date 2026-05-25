/**
 * 收藏服务 - AI 对话收藏夹
 */
import { tauriInvoke } from './tauri';
import type { AiFavorite } from '@/types/favorite';

export async function addFavorite(
  content: string,
  role: string,
  conversationTitle?: string,
): Promise<AiFavorite> {
  return tauriInvoke<AiFavorite>('add_favorite', {
    content,
    role,
    conversationTitle,
  });
}

export async function listFavorites(): Promise<AiFavorite[]> {
  return tauriInvoke<AiFavorite[]>('list_favorites');
}

export async function deleteFavorite(id: string): Promise<void> {
  return tauriInvoke<void>('delete_favorite', { id });
}

export async function deleteAllFavorites(): Promise<void> {
  return tauriInvoke<void>('delete_all_favorites');
}
