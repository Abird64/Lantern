/**
 * 技能服务 - 封装所有技能相关的 Tauri 命令调用
 */
import { tauriInvoke } from './tauri';
import type { Skill, TaskSkill, SetTaskSkillsInput } from '@/types/skill';

/** 获取所有技能 */
export async function listSkills(): Promise<Skill[]> {
  return tauriInvoke<Skill[]>('list_skills');
}

/** 获取任务的技能XP分配 */
export async function getTaskSkills(taskId: string): Promise<TaskSkill[]> {
  return tauriInvoke<TaskSkill[]>('get_task_skills', { taskId });
}

/** 设置任务的技能XP分配 */
export async function setTaskSkills(
  taskId: string,
  skills: SetTaskSkillsInput[]
): Promise<void> {
  return tauriInvoke<void>('set_task_skills', { taskId, skills });
}
