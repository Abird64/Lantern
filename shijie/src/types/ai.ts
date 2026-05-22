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
