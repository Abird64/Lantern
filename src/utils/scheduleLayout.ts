import type { Schedule } from '@/types/schedule';

// ========== 夜间压缩配置 ==========

export const HOUR_START = 0;
export const HOUR_END = 24;
export const NIGHT_END = 7;       // 0-7 点为夜间压缩区
export const NIGHT_RATIO = 0.1;   // 夜间占 10%
export const DAY_RATIO = 0.9;     // 白天占 90%

/** 将小时转换为显示位置的百分比（考虑夜间压缩） */
export function hourToPercent(hour: number): number {
  if (hour <= NIGHT_END) {
    return (hour / NIGHT_END) * NIGHT_RATIO * 100;
  }
  const dayProgress = (hour - NIGHT_END) / (HOUR_END - NIGHT_END);
  return (NIGHT_RATIO + dayProgress * DAY_RATIO) * 100;
}

/** 将显示位置百分比转换回小时（考虑夜间压缩） */
export function percentToHour(ratio: number): number {
  if (ratio <= NIGHT_RATIO) {
    return (ratio / NIGHT_RATIO) * NIGHT_END;
  }
  const dayProgress = (ratio - NIGHT_RATIO) / DAY_RATIO;
  return NIGHT_END + dayProgress * (HOUR_END - NIGHT_END);
}

/** 吸附到 30 分钟刻度 */
export function snapToGrid(hour: number): number {
  return Math.round(hour * 2) / 2;
}

/** 补零 */
export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// ========== 事件重叠检测与分栏 ==========

export interface EventLayout {
  event: Schedule;
  col: number;
  totalCols: number;
}

/**
 * 对一天内的事件做重叠检测，用贪心算法分配列。
 * 输入的事件应已过滤为同一天。
 */
export function layoutOverlappingEvents(events: Schedule[]): EventLayout[] {
  const sorted = [...events].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const layouts: EventLayout[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    if (processed.has(sorted[i].id)) continue;

    // 找出与当前事件重叠的所有事件
    const overlapGroup: Schedule[] = [sorted[i]];
    const eventEnd = sorted[i].end_at || sorted[i].start_at;

    for (let j = i + 1; j < sorted.length; j++) {
      if (processed.has(sorted[j].id)) continue;
      if (eventEnd > sorted[j].start_at) {
        overlapGroup.push(sorted[j]);
      }
    }

    if (overlapGroup.length === 1) {
      layouts.push({ event: overlapGroup[0], col: 0, totalCols: 1 });
      processed.add(overlapGroup[0].id);
    } else {
      // 贪心分栏
      const columns: { endTime: string; events: Schedule[] }[] = [];
      for (const evt of overlapGroup) {
        let placed = false;
        for (const col of columns) {
          const evtEnd = evt.end_at || evt.start_at;
          if (evt.start_at >= col.endTime) {
            col.events.push(evt);
            col.endTime = evtEnd;
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push({
            endTime: evt.end_at || evt.start_at,
            events: [evt],
          });
        }
      }

      const totalCols = columns.length;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        for (const evt of columns[colIdx].events) {
          layouts.push({ event: evt, col: colIdx, totalCols });
          processed.add(evt.id);
        }
      }
    }
  }

  return layouts;
}
