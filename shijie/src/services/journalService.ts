/**
 * 日记服务 - 封装所有日记相关的 Tauri 命令调用
 */
import { tauriInvoke } from './tauri';
import type { Journal, JournalEntry, AiDiary } from '@/types/journal';

/** 获取或创建指定日期的日记 */
export async function getJournalByDate(date: string): Promise<JournalEntry> {
  return tauriInvoke<JournalEntry>('get_journal_by_date', {
    input: { date },
  });
}

/** 保存日记内容（自动写 .md + 更新元数据） */
export async function saveJournal(
  date: string,
  content: string,
  mood?: string
): Promise<Journal> {
  return tauriInvoke<Journal>('save_journal', {
    input: { date, content, mood: mood ?? null },
  });
}

/** 获取某月有日记的日期列表 */
export async function getTimeline(
  year: number,
  month: number
): Promise<string[]> {
  return tauriInvoke<string[]>('get_timeline', {
    input: { year, month },
  });
}

/** 获取 AI 尘笺 */
export async function getAiDiary(date: string): Promise<AiDiary> {
  return tauriInvoke<AiDiary>('get_ai_diary', {
    input: { date },
  });
}

/** 保存 AI 尘笺 */
export async function saveAiDiary(
  date: string,
  content: string
): Promise<void> {
  return tauriInvoke<void>('save_ai_diary', {
    input: { date, content },
  });
}
