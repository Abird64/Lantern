import { tauriInvoke } from './tauri';
import type { Calendar } from '@/types/schedule';

export async function listCalendars(): Promise<Calendar[]> {
  return tauriInvoke<Calendar[]>('list_calendars');
}

export async function createCalendar(name: string, color: string): Promise<Calendar> {
  return tauriInvoke<Calendar>('create_calendar', { input: { name, color } });
}

export async function updateCalendar(id: string, name?: string, color?: string): Promise<Calendar> {
  return tauriInvoke<Calendar>('update_calendar', { id, input: { name, color } });
}

export async function deleteCalendar(id: string): Promise<{ success: boolean; deleted: number }> {
  return tauriInvoke('delete_calendar', { input: { id } });
}

export async function getDefaultCalendar(): Promise<Calendar> {
  return tauriInvoke<Calendar>('get_default_calendar');
}
