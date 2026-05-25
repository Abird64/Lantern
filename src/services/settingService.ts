/**
 * 设置服务 - 封装所有设置相关的 Tauri 命令调用
 */
import { tauriInvoke } from './tauri';
import type { Setting } from '@/types/setting';

/** 获取单个设置 */
export async function getSetting(key: string): Promise<Setting | null> {
  return tauriInvoke<Setting | null>('get_setting', { key });
}

/** 设置单个值 */
export async function setSetting(key: string, value: string): Promise<void> {
  return tauriInvoke<void>('set_setting', { key, value });
}

/** 获取所有设置 */
export async function listSettings(): Promise<Setting[]> {
  return tauriInvoke<Setting[]>('list_settings');
}

/** 删除设置 */
export async function deleteSetting(key: string): Promise<void> {
  return tauriInvoke<void>('delete_setting', { key });
}
