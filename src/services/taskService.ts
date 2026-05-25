/**
 * 任务服务 - 封装所有任务相关的 Tauri 命令调用
 */
import { tauriInvoke } from './tauri';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksInput,
  CompleteResult,
} from '@/types/task';

/** 创建任务 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  return tauriInvoke<Task>('create_task', { input });
}

/** 获取单个任务 */
export async function getTask(id: string): Promise<Task> {
  return tauriInvoke<Task>('get_task', { id });
}

/** 列出任务 */
export async function listTasks(input?: ListTasksInput): Promise<Task[]> {
  return tauriInvoke<Task[]>('list_tasks', { input: input ?? null });
}

/** 更新任务 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task> {
  return tauriInvoke<Task>('update_task', { id, input });
}

/** 删除任务 */
export async function deleteTask(
  id: string,
  cascade = false
): Promise<{ success: boolean; deleted: number }> {
  return tauriInvoke('delete_task', { input: { id, cascade } });
}

/** 完成任务 */
export async function completeTask(id: string): Promise<CompleteResult> {
  return tauriInvoke<CompleteResult>('complete_task', { id });
}

/** 取消完成任务（撤回XP） */
export async function uncompleteTask(id: string): Promise<void> {
  return tauriInvoke<void>('uncomplete_task', { id });
}

/** 搜索任务 */
export async function searchTasks(query: string): Promise<Task[]> {
  return tauriInvoke<Task[]>('search_tasks', { input: { query } });
}

/** 列出子任务 */
export async function listSubtasks(parentId: string): Promise<Task[]> {
  return tauriInvoke<Task[]>('list_tasks', { input: { parent_id: parentId } });
}
