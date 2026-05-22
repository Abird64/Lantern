import { useState, useRef, useCallback } from 'react';
import type { Schedule, UpdateScheduleInput } from '@/types/schedule';
import { EventBlock, getEventPosition, layoutEvents } from './EventBlock';

interface WeekViewProps {
  weekStart: Date;
  schedules: Schedule[];
  onEventClick: (event: Schedule) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onEventUpdate?: (id: string, input: UpdateScheduleInput) => void;
}

const HOUR_START = 0;
const HOUR_END = 24;

// 夜间压缩配置
const NIGHT_END = 7;

// 各区段占比（总和 = 1）
const NIGHT_RATIO = 0.1;  // 0-7 点占 10%
const DAY_RATIO = 0.9;    // 7-24 点占 90%

/** 将小时转换为显示位置的百分比 */
function hourToPercent(hour: number): number {
  if (hour <= NIGHT_END) {
    // 0-7 点：压缩
    return (hour / NIGHT_END) * NIGHT_RATIO * 100;
  } else {
    // 7-24 点：正常
    const dayProgress = (hour - NIGHT_END) / (HOUR_END - NIGHT_END);
    return (NIGHT_RATIO + dayProgress * DAY_RATIO) * 100;
  }
}

const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function WeekView({ weekStart, schedules, onEventClick, onSlotClick, onEventUpdate }: WeekViewProps) {
  // 生成 7 天的日期
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
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

    // 反向计算小时
    if (ratio <= NIGHT_RATIO) {
      return (ratio / NIGHT_RATIO) * NIGHT_END;
    } else {
      const dayProgress = (ratio - NIGHT_RATIO) / DAY_RATIO;
      return NIGHT_END + dayProgress * (HOUR_END - NIGHT_END);
    }
  }, []);

  // 吸附到 30 分钟刻度
  const snapToGrid = useCallback((hour: number): number => {
    return Math.round(hour * 2) / 2; // 四舍五入到 0.5 小时
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

    // 计算新的开始时间
    const oldStart = new Date(draggingEvent.start_at);
    const newStart = new Date(oldStart);
    newStart.setHours(Math.floor(newHour), (newHour % 1) * 60, 0, 0);

    // 计算新的结束时间（保持原有时长）
    let newEnd: Date | undefined;
    if (draggingEvent.end_at) {
      const oldEnd = new Date(draggingEvent.end_at);
      const duration = oldEnd.getTime() - oldStart.getTime();
      newEnd = new Date(newStart.getTime() + duration);
    }

    // 更新事件
    onEventUpdate(draggingEvent.id, {
      start_at: newStart.toISOString(),
      end_at: newEnd?.toISOString(),
    });

    setDraggingEvent(null);
  }, [draggingEvent, dragY, yToHour, snapToGrid, onEventUpdate]);

  // 今天日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 时间刻度（显示关键时间点）
  const hours = [0, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

  // 按天分组事件（排除全天事件）
  const eventsByDay: Schedule[][] = days.map((day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return schedules.filter((e) => {
      if (e.is_all_day) return false; // 全天事件单独处理
      const eStart = new Date(e.start_at);
      return eStart >= dayStart && eStart < dayEnd;
    });
  });

  // 全天事件按天分组
  const allDayEventsByDay: Schedule[][] = days.map((day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return schedules.filter((e) => {
      if (!e.is_all_day) return false;
      const eStart = new Date(e.start_at);
      return eStart >= dayStart && eStart < dayEnd;
    });
  });

  // 是否有全天事件
  const hasAllDayEvents = allDayEventsByDay.some((events) => events.length > 0);

  return (
    <div className="w-full bg-[#F8F5F0] rounded-2xl relative overflow-hidden flex flex-col">
      {/* ========== 表头：星期标签 + 日期 ========== */}
      <div className="flex border-b border-[#D4A017]/40 flex-shrink-0">
        {/* 时间轴占位 */}
        <div className="w-[52px] flex-shrink-0" />
        {/* 7 列标题 */}
        {days.map((day, idx) => {
          const isToday = day.getTime() === today.getTime();
          return (
            <div
              key={idx}
              className={`flex-1 py-2 text-center ${
                isToday ? 'bg-[#F2C94C]/10' : ''
              }`}
            >
              <div className="text-xs text-[#1A1A1A]/50">{weekDayNames[idx]}</div>
              <div
                className={`text-lg font-light mt-0.5 ${
                  isToday
                    ? 'text-[#1A1A1A] bg-[#F2C94C] rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                    : 'text-[#1A1A1A]/80'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========== 全天事件区域 ========== */}
      {hasAllDayEvents && (
        <div className="flex border-b border-[#D4A017]/20 flex-shrink-0 min-h-[32px]">
          <div className="w-[52px] flex-shrink-0 flex items-center justify-center">
            <span className="text-[10px] text-[#1A1A1A]/40">全天</span>
          </div>
          {allDayEventsByDay.map((dayEvents, dayIdx) => (
            <div key={dayIdx} className="flex-1 flex flex-col gap-1 py-1 px-0.5">
              {dayEvents.map((event) => {
                const bgColor = event.color || '#F2C94C';
                const isTaskSync = event.source_type === 'task_sync';
                return (
                  <div
                    key={event.id}
                    className="rounded px-1.5 py-0.5 text-xs truncate cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: isTaskSync ? 'transparent' : bgColor,
                      border: isTaskSync ? `1px dashed ${bgColor}` : 'none',
                      color: isTaskSync ? bgColor : '#FFF',
                      opacity: isTaskSync ? 0.7 : 1,
                    }}
                    onClick={() => onEventClick(event)}
                  >
                    {event.title}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ========== 网格主体 ========== */}
      <div
        ref={gridRef}
        className="flex overflow-y-auto"
        style={{ height: 800 }}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* 时间轴 */}
        <div className="w-[52px] flex-shrink-0 relative" style={{ height: '100%' }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full text-right pr-2 text-[10px] text-[#1A1A1A]/40 -translate-y-1/2"
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

        {/* 7 列事件区 */}
        <div className="flex-1 relative" style={{ height: '100%' }}>
          {/* 水平网格线 */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full h-[1px] bg-[#D4A017]/20 left-0"
              style={{ top: `${hourToPercent(hour)}%` }}
            />
          ))}

          {/* 垂直分隔线 */}
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full w-[1px] bg-[#D4A017]/20"
              style={{ left: `${((i + 1) / 7) * 100}%` }}
            />
          ))}

          {/* 今天高亮列 */}
          {days.map((day, idx) => {
            const isToday = day.getTime() === today.getTime();
            if (!isToday) return null;
            return (
              <div
                key={`today-${idx}`}
                className="absolute top-0 h-full bg-[#F2C94C]/5"
                style={{
                  left: `${(idx / 7) * 100}%`,
                  width: `${100 / 7}%`,
                }}
              />
            );
          })}

          {/* 点击空白区域创建事件 */}
          {days.map((day, dayIdx) => (
            <div
              key={`click-${dayIdx}`}
              className="absolute top-0 h-full cursor-pointer"
              style={{
                left: `${(dayIdx / 7) * 100}%`,
                width: `${100 / 7}%`,
              }}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const y = e.clientY - rect.top;
                const ratio = y / rect.height;
                // 反向计算小时（考虑夜间压缩）
                let hour: number;
                if (ratio <= NIGHT_RATIO) {
                  hour = Math.floor((ratio / NIGHT_RATIO) * NIGHT_END);
                } else if (ratio <= NIGHT_RATIO + DAY_RATIO) {
                  const dayProgress = (ratio - NIGHT_RATIO) / DAY_RATIO;
                  hour = Math.floor(NIGHT_END + dayProgress * (LATE_NIGHT_START - NIGHT_END));
                } else {
                  const lateProgress = (ratio - NIGHT_RATIO - DAY_RATIO) / LATE_NIGHT_RATIO;
                  hour = Math.floor(LATE_NIGHT_START + lateProgress * (LATE_NIGHT_END - LATE_NIGHT_START));
                }
                const clickDate = new Date(day);
                clickDate.setHours(hour, 0, 0, 0);
                onSlotClick(clickDate, hour);
              }}
            />
          ))}

          {/* 事件色块 */}
          {eventsByDay.map((dayEvents, dayIdx) => {
            if (dayEvents.length === 0) return null;

            // 按开始时间排序
            const sorted = [...dayEvents].sort((a, b) =>
              a.start_at.localeCompare(b.start_at)
            );

            // 检测重叠组：只有真正重叠的事件才分栏
            interface EventWithLayout {
              event: Schedule;
              col: number;
              totalCols: number;
            }

            const layouts: EventWithLayout[] = [];
            const processed = new Set<string>();

            for (let i = 0; i < sorted.length; i++) {
              if (processed.has(sorted[i].id)) continue;

              // 找出与当前事件重叠的所有事件
              const overlapGroup: Schedule[] = [sorted[i]];
              const eventEnd = sorted[i].end_at || sorted[i].start_at;

              for (let j = i + 1; j < sorted.length; j++) {
                if (processed.has(sorted[j].id)) continue;
                const otherEnd = sorted[j].end_at || sorted[j].start_at;
                // 检查是否重叠：当前事件的结束时间 > 下一事件的开始时间
                if (eventEnd > sorted[j].start_at) {
                  overlapGroup.push(sorted[j]);
                }
              }

              if (overlapGroup.length === 1) {
                // 无重叠，全宽显示
                layouts.push({ event: overlapGroup[0], col: 0, totalCols: 1 });
                processed.add(overlapGroup[0].id);
              } else {
                // 有重叠，分栏显示
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

            // 渲染事件
            return layouts.map(({ event, col, totalCols }) => {
              const colWidthPercent = (100 / 7) / totalCols;
              const colLeft = (dayIdx / 7) * 100 + col * colWidthPercent;

              // 计算 top 和 height（考虑夜间压缩）
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

              // 跳过超出显示范围的事件
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
            });
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
      <div className="absolute -left-12 -top-3 bg-[#F2C94C] text-[#1A1A1A] text-xs px-2 py-1 rounded shadow-lg">
        {timeStr}
      </div>
      {/* 指示线 */}
      <div className="w-full h-[2px] bg-[#F2C94C] shadow-lg" />
    </div>
  );
}
