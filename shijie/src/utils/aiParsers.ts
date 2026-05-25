import type { ToolCallDef, CreateTaskParams, QueryParams, SearchTasksParams } from '@/types/ai';

/** 解析消息中的 tool_calls JSON */
export function parseToolCalls(json: string | null): ToolCallDef[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/** 解析 tool_call 的 arguments 为 create_task 参数 */
export function parseCreateTaskArgs(tc: ToolCallDef): CreateTaskParams {
  try {
    return JSON.parse(tc.function.arguments);
  } catch {
    return { title: '' };
  }
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
