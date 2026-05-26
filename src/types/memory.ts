export type MemoryType =
  | 'identity' | 'interest' | 'taste' | 'habit' | 'personality'
  | 'relationship' | 'status' | 'goal' | 'event' | 'other';

export interface Memory {
  id: string;
  content: string;
  memory_type: MemoryType;
  source_text: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  identity: '身份信息',
  interest: '兴趣爱好',
  taste: '口味偏好',
  habit: '日常习惯',
  personality: '性格特点',
  relationship: '人际关系',
  status: '当前状态',
  goal: '近期目标',
  event: '重要事件',
  other: '其他',
};

export const MEMORY_TYPE_ICONS: Record<MemoryType, string> = {
  identity: '🪪',
  interest: '🎯',
  taste: '🍰',
  habit: '🔄',
  personality: '🧠',
  relationship: '👥',
  status: '📍',
  goal: '🎯',
  event: '📅',
  other: '📌',
};
