/**
 * 联系人类型定义
 */

export interface ContactMethod {
  id: string;
  contact_id: string;
  method_type: string;
  value: string;
}

export interface ContactMethodInput {
  method_type: string;
  value: string;
}

export interface Contact {
  id: string;
  name: string;
  nickname: string | null;
  group_name: string | null;
  avatar_path: string | null;
  birthday_calendar: string | null;
  birthday_year: number | null;
  birthday_month: number | null;
  birthday_day: number | null;
  contact_methods: ContactMethod[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContactInput {
  name: string;
  nickname?: string;
  group_name?: string;
  avatar_path?: string;
  birthday_calendar?: string;
  birthday_year?: number;
  birthday_month?: number;
  birthday_day?: number;
  contact_methods?: ContactMethodInput[];
  notes?: string;
}

export interface UpdateContactInput {
  name?: string;
  nickname?: string;
  group_name?: string;
  avatar_path?: string;
  birthday_calendar?: string;
  birthday_year?: number;
  birthday_month?: number;
  birthday_day?: number;
  contact_methods?: ContactMethodInput[];
  notes?: string;
}

export interface ListContactsInput {
  group_name?: string;
}
