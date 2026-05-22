import { useState, useRef, useCallback } from 'react';
import type { Schedule, UpdateScheduleInput } from '@/types/schedule';
import { EventBlock } from './EventBlock';

interface DayViewProps {
  date: Date;
  schedules: Schedule[];
  onEventClick: (event: Schedule) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onEventUpdate?: (id: string, input: UpdateScheduleInput) => void;
  onBack: () => void;
  backLabel?: string;
}

const HOUR_START = 0;
const HOUR_END = 24;

// 夜间压缩配置
const NIGHT_END = 7;
const NIGHT_RATIO = 0.1;
const DAY_RATIO = 0.9;

/** 将小时转换为显示位置的百分比 */
function hourToPercent(hour: number): number {
  if (hour <= NIGHT_END) {
    return (hour / NIGHT_END) * NIGHT_RATIO * 100;
  } else {
    const dayProgress = (hour - NIGHT_END) / (HOUR_END - NIGHT_END);
    return (NIGHT_RATIO + dayProgress * DAY_RATIO) * 100;
  }
}

const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function DayView({ date, schedules, onEventClick, onSlotClick, onEventUpdate, onBack, backLabel = '返回周视图' }: DayViewProps) {
  // 今天
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = date.getTime() === today.getTime();

  // 时间刻度
  const hours = [0, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

  // 当天事件
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const dayEvents = schedules.filter((e) => {
    const eStart = new Date(e.start_at);
    return eStart >= dayStart && eStart < dayEnd;
  });

  // 拖拽状态
  const [draggingEvent, setDraggingEvent] = useState<Schedule | null>(null);
  const [dragY, setDragY] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // 将 Y 坐标转换为小时（考虑夜间压缩）
  const yToHour = useCallback((clientY: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const ratio = (clientY - rect.top) / rect.height;

    if (ratio <= NIGHT_RATIO) {
      return (ratio / NIGHT_RATIO) * NIGHT_END;
    } else {
      const dayProgress = (ratio - NIGHT_RATIO) / DAY_RATIO;
      return NIGHT_END + dayProgress * (HOUR_END - NIGHT_END);
    }
  }, []);

  // 吸附到 30 分钟刻度
  const snapToGrid = useCallback((hour: number): number => {
    return Math.round(hour * 2) / 2;
  }, []);

  // 处理拖拽开始
  const handleDragStart = useCallback((event: Schedule, startY: number) => {
    if (event.source_type === 'task_sync') return;
    setDraggingEvent(event);
    setDragY(startY);
  }, []);

  // 处理拖拽中
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingEvent) return;
    setDragY(e.clientY);
  }, [draggingEvent]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    if (!draggingEvent || !onEventUpdate) {
      setDraggingEvent(null);
      return;
    }

    const newHour = snapToGrid(yToHour(dragY));

    const oldStart = new Date(draggingEvent.start_at);
    const newStart = new Date(oldStart);
    newStart.setHours(Math.floor(newHour), (newHour % 1) * 60, 0, 0);

    let newEnd: Date | undefined;
    if (draggingEvent.end_at) {
      const oldEnd = new Date(draggingEvent.end_at);
      const duration = oldEnd.getTime() - oldStart.getTime();
      newEnd = new Date(newStart.getTime() + duration);
    }

    onEventUpdate(draggingEvent.id, {
      start_at: newStart.toISOString(),
      end_at: newEnd?.toISOString(),
    });

    setDraggingEvent(null);
  }, [draggingEvent, dragY, yToHour, snapToGrid, onEventUpdate]);

  // 检测重叠并分栏
  interface EventWithLayout {
    event: Schedule;
    col: number;
    totalCols: number;
  }

  const sorted = [...dayEvents].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const layouts: EventWithLayout[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    if (processed.has(sorted[i].id)) continue;

    const overlapGroup: Schedule[] = [sorted[i]];
    const eventEnd = sorted[i].end_at || sorted[i].start_at;

    for (let j = i + 1; j < sorted.length; j++) {
      if (processed.has(sorted[j].id)) continue;
      const otherEnd = sorted[j].end_at || sorted[j].start_at;
      if (eventEnd > sorted[j].start_at) {
        overlapGroup.push(sorted[j]);
      }
    }

    if (overlapGroup.length === 1) {
      layouts.push({ event: overlapGroup[0], col: 0, totalCols: 1 });
      processed.add(overlapGroup[0].id);
    } else {
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

  return (
    <div className="w-full bg-[#F8F5F0] rounded-2xl overflow-hidden flex flex-col">
      {/* 表头 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#D4A017]/20">
        <button
          onClick={onBack}
          className="text-sm text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
        >
          &larr; {backLabel}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-light text-[#1A1A1A]">
            {date.getMonth() + 1}月{date.getDate()}日
          </span>
          <span className="text-sm text-[#1A1A1A]/50">
            {weekDayNames[date.getDay()]}
          </span>
          {isToday && (
            <span className="text-xs bg-[#F2C94C] text-[#1A1A1A] px-2 py-0.5 rounded-full">
              今天
            </span>
          )}
        </div>
        <div className="w-20" />
      </div>

      {/* 网格主体 */}
      <div
        ref={gridRef}
        className="flex overflow-y-auto"
        style={{ height: 700 }}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* 时间轴 */}
        <div className="w-[60px] flex-shrink-0 relative" style={{ height: '100%' }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full text-right pr-3 text-xs text-[#1A1A1A]/40 -translate-y-1/2"
              style={{ top: `${hourToPercent(hour)}%` }}
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
          {/* 夜间压缩区标记 */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#D4A017]/30"
            style={{ top: `${hourToPercent(7)}%` }}
          />
        </div>

        {/* 事件区 */}
        <div className="flex-1 relative" style={{ height: '100%' }}>
          {/* 水平网格线 */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full h-[1px] bg-[#D4A017]/20 left-0"
              style={{ top: `${hourToPercent(hour)}%` }}
            />
          ))}

          {/* 今天高亮 */}
          {isToday && (
            <div className="absolute top-0 h-full left-0 right-0 bg-[#F2C94C]/5" />
          )}

          {/* 点击空白区域创建事件 */}
          <div
            className="absolute top-0 h-full left-0 right-0 cursor-pointer"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const y = e.clientY - rect.top;
              const ratio = y / rect.height;
              let hour: number;
              if (ratio <= NIGHT_RATIO) {
                hour = Math.floor((ratio / NIGHT_RATIO) * NIGHT_END);
              } else {
                const dayProgress = (ratio - NIGHT_RATIO) / DAY_RATIO;
                hour = Math.floor(NIGHT_END + dayProgress * (HOUR_END - NIGHT_END));
              }
              const clickDate = new Date(date);
              clickDate.setHours(hour, 0, 0, 0);
              onSlotClick(clickDate, hour);
            }}
          />

          {/* 事件色块 */}
          {layouts.map(({ event, col, totalCols }) => {
            const colWidthPercent = 100 / totalCols;
            const colLeft = col * colWidthPercent;

            const startDate = new Date(event.start_at);
            const startHour = startDate.getHours() + startDate.getMinutes() / 60;
            const top = hourToPercent(startHour);

            let height: number;
            if (event.end_at) {
              const endDate = new Date(event.end_at);
              const endHour = endDate.getHours() + endDate.getMinutes() / 60;
              height = hourToPercent(endHour) - top;
            } else {
              height = hourToPercent(startHour + 1) - top;
            }

            if (startHour >= HOUR_END || top >= 100) return null;
            const maxHeight = 100 - top;
            const clampedHeight = Math.min(height, maxHeight);

            return (
              <EventBlock
                key={event.id}
                event={event}
                top={top}
                height={clampedHeight}
                left={colLeft}
                width={colWidthPercent}
                onClick={onEventClick}
                onDragStart={handleDragStart}
              />
            );
          })}

          {/* 当前时间指示线 */}
          <CurrentTimeLine />

          {/* 拖拽指示器 */}
          {draggingEvent && (
            <DragIndicator
              event={draggingEvent}
              y={dragY}
              gridRef={gridRef}
              yToHour={yToHour}
              snapToGrid={snapToGrid}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** 当前时间红色指示线 */
function CurrentTimeLine() {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  if (hour < HOUR_START || hour > HOUR_END) return null;

  const top = hourToPercent(hour);

  return (
    <div
      className="absolute w-full left-0 z-20 pointer-events-none"
      style={{ top: `${top}%` }}
    >
      <div className="w-full h-[2px] bg-red-500" />
      <div className="absolute -left-1 -top-[4px] w-[10px] h-[10px] rounded-full bg-red-500" />
    </div>
  );
}

/** 拖拽指示器 */
function DragIndicator({
  event,
  y,
  gridRef,
  yToHour,
  snapToGrid,
}: {
  event: Schedule;
  y: number;
  gridRef: React.RefObject<HTMLDivElement>;
  yToHour: (y: number) => number;
  snapToGrid: (hour: number) => number;
}) {
  if (!gridRef.current) return null;

  const hour = snapToGrid(yToHour(y));
  const top = hourToPercent(hour);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(Math.floor(hour))}:${pad(Math.round((hour % 1) * 60))}`;

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none"
      style={{ top: `${top}%` }}
    >
      {/* 时间标签 */}
      <div className="absolute -left-14 -top-3 bg-[#F2C94C] text-[#1A1A1A] text-xs px-2 py-1 rounded shadow-lg">
        {timeStr}
      </div>
      {/* 指示线 */}
      <div className="w-full h-[2px] bg-[#F2C94C] shadow-lg" />
    </div>
  );
}
