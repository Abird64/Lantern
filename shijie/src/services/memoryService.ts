import { tauriInvoke } from './tauri';
import type { Memory } from '@/types/memory';

export async function listMemories(memoryType?: string): Promise<Memory[]> {
  return tauriInvoke<Memory[]>('list_memories', { memoryType: memoryType ?? null });
}

export async function deleteMemory(id: string): Promise<void> {
  return tauriInvoke<void>('delete_memory', { id });
}
