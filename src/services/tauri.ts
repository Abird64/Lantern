/**
 * Tauri invoke 封装
 * 统一处理前端与 Rust 后端的通信
 */
import { invoke } from '@tauri-apps/api/core';

/** 检测是否在 Tauri 环境中运行 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function tauriInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauri()) {
    throw new Error(
      `无法调用 "${cmd}"：当前在浏览器中运行，请使用 npx tauri dev 启动应用`
    );
  }
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    console.error(`Tauri invoke failed: ${cmd}`, error);
    throw error;
  }
}
