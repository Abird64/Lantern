/**
 * 联系人类型定义
 */

export interface Contact {
  id: string;
  name: string;
  nickname: string | null;
  group_name: string | null;
  avatar_path: string | null;
  birthday: string | null;
  contact_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContactInput {
  name: string;
  nickname?: string;
  group_name?: string;
  avatar_path?: string;
  birthday?: string;
  contact_info?: string;
  notes?: string;
}

export interface UpdateContactInput {
  name?: string;
  nickname?: string;
  group_name?: string;
  avatar_path?: string;
  birthday?: string;
  contact_info?: string;
  notes?: string;
}

export interface ListContactsInput {
  group_name?: string;
}
