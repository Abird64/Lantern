/** 日程 - 对应后端 schedule_repo::Schedule */
export interface Schedule {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  rrule: string | null;
  reminder: string | null;
  color: string | null;
  is_all_day: number;
  location: string | null;
  source_type: 'manual' | 'ics_import' | 'task_sync';
  source_id: string | null;
  category: string | null;
  exdates: string | null;
  created_at: string;
  updated_at: string;
}

/** 创建日程的输入参数 */
export interface CreateScheduleInput {
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  rrule?: string;
  reminder?: string;
  color?: string;
  is_all_day?: number;
  location?: string;
  source_type?: string;
  source_id?: string;
  category?: string;
}

/** 更新日程的输入参数 */
export interface UpdateScheduleInput {
  title?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  rrule?: string;
  reminder?: string;
  color?: string;
  is_all_day?: number;
  location?: string;
  category?: string;
}

/** 查询时间范围 */
export interface ListSchedulesInput {
  range_start: string;
  range_end: string;
}
