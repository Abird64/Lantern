/** 对应后端 ai_repo::Conversation */
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/** 对应后端 ai_repo::Message */
export interface AiMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls: string | null;
  tool_call_id: string | null;
  created_at: string;
}

// ========== 工具调用相关类型 ==========

/** AI 返回的单个 tool_call */
export interface ToolCallDef {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string; // JSON string of params
  };
}

/** create_task 工具的参数（从 arguments JSON 解析） */
export interface CreateTaskParams {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low' | 'none';
  scheduled_at?: string;
  deadline?: string;
  estimated_minutes?: number;
  notes?: string;
  tags?: string;
}

/** 解析消息中的 tool_calls JSON */
export function parseToolCalls(json: string | null): ToolCallDef[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/** complete_task / delete_task / search_tasks 共用的查询参数 */
export interface QueryParams {
  query: string;
}

/** 解析 tool_call 的 arguments 为 create_task 参数 */
export function parseCreateTaskArgs(tc: ToolCallDef): CreateTaskParams {
  try {
    return JSON.parse(tc.function.arguments);
  } catch {
    return { title: '' };
  }
}

/** search_tasks 工具的参数 */
export interface SearchTasksParams {
  query?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

/** 解析 tool_call 的 arguments 为查询参数 */
export function parseQueryArgs(tc: ToolCallDef): QueryParams {
  try {
    return JSON.parse(tc.function.arguments);
  } catch {
    return { query: '' };
  }
}

/** 解析 tool_call 的 arguments 为搜索参数 */
export function parseSearchArgs(tc: ToolCallDef): SearchTasksParams {
  try {
    return JSON.parse(tc.function.arguments);
  } catch {
    return {};
  }
}

/** 通用参数解析：把 arguments JSON 转为 Record */
export function parseGenericArgs(tc: ToolCallDef): Record<string, unknown> {
  try {
    return JSON.parse(tc.function.arguments);
  } catch {
    return {};
  }
}

/** 工具名 → 人类可读标签 */
export const TOOL_LABELS: Record<string, { group: string; label: string; color: string }> = {
  // 任务
  create_task:       { group: '创建', label: '创建任务', color: '#58A968' },
  complete_task:     { group: '执行', label: '完成任务', color: '#7CB342' },
  delete_task:       { group: '删除', label: '删除任务', color: '#E65C5C' },
  search_tasks:      { group: '查询', label: '查看任务', color: '#6B9BD2' },
  update_task:       { group: '修改', label: '修改任务', color: '#E8B959' },
  // 日程
  create_schedule:   { group: '创建', label: '创建日程', color: '#58A968' },
  list_schedules_in_range: { group: '查询', label: '查看日程', color: '#6B9BD2' },
  update_schedule:   { group: '修改', label: '修改日程', color: '#E8B959' },
  delete_schedule:   { group: '删除', label: '删除日程', color: '#E65C5C' },
  // 日记
  get_journal_by_date: { group: '查询', label: '读取日记', color: '#6B9BD2' },
  save_journal:      { group: '创建', label: '写入日记', color: '#58A968' },
  get_timeline:      { group: '查询', label: '日记时间线', color: '#6B9BD2' },
  settle_diary:      { group: '执行', label: '日记结算', color: '#7CB342' },
  // 人脉
  create_contact:    { group: '创建', label: '创建联系人', color: '#58A968' },
  search_contacts:   { group: '查询', label: '搜索联系人', color: '#6B9BD2' },
  list_contacts:     { group: '查询', label: '列出联系人', color: '#6B9BD2' },
  update_contact:    { group: '修改', label: '修改联系人', color: '#E8B959' },
  delete_contact:    { group: '删除', label: '删除联系人', color: '#E65C5C' },
  // 技能
  list_skills:       { group: '查询', label: '查看属性', color: '#6B9BD2' },
  get_task_skills:   { group: '查询', label: '查看任务属性', color: '#6B9BD2' },
};

/** 状态中文映射 */
export const STATUS_LABELS: Record<string, string> = {
  pending: '待办',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

/** 优先级中文映射 */
export const PRIORITY_LABELS: Record<string, string> = {
  high: '紧急',
  medium: '重要',
  low: '一般',
  none: '无',
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-white/10 text-white/50',
  none: 'bg-white/5 text-white/30',
};
