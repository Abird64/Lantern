import { useState, useRef, useCallback } from 'react';
import type { Schedule, UpdateScheduleInput } from '@/types/schedule';
import { usePageTheme } from '@/hooks/usePageTheme';
import { EventBlock } from './EventBlock';
import {
  HOUR_START,
  HOUR_END,
  hourToPercent,
  percentToHour,
  snapToGrid,
  pad,
  layoutOverlappingEvents,
} from '@/utils/scheduleLayout';


interface DayViewProps {
  date: Date;
  schedules: Schedule[];
  onEventClick: (event: Schedule) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onEventUpdate?: (id: string, input: UpdateScheduleInput) => void;
  onBack: () => void;
  backLabel?: string;
}

const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function DayView({ date, schedules, onEventClick, onSlotClick, onEventUpdate, onBack, backLabel = '返回周视图' }: DayViewProps) {
  const t = usePageTheme('schedule');
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
    return percentToHour(ratio);
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
  const layouts = layoutOverlappingEvents(dayEvents);

  return (
    <div className="w-full rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: t.card }}>
      {/* 表头 */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${t.accent}33` }}>
        <button
          onClick={onBack}
          className="text-sm transition-colors"
          style={{ color: `${t.cardText}99` }}
          onMouseEnter={(e) => (e.currentTarget.style.color = t.cardText)}
          onMouseLeave={(e) => (e.currentTarget.style.color = `${t.cardText}99`)}
        >
          &larr; {backLabel}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-light" style={{ color: t.cardText }}>
            {date.getMonth() + 1}月{date.getDate()}日
          </span>
          <span className="text-sm" style={{ color: `${t.cardText}80` }}>
            {weekDayNames[date.getDay()]}
          </span>
          {isToday && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: t.accent, color: t.cardText }}>
              今天
            </span>
          )}
        </div>
        <div className="w-20" />
      </div>

      {/* 网格主体 */}
      <div
        ref={gridRef}
        className="flex"
        style={{ height: 1200 }}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* 时间轴 */}
        <div className="w-[60px] flex-shrink-0 relative" style={{ height: '100%' }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full text-right pr-3 text-xs -translate-y-1/2"
              style={{ top: `${hourToPercent(hour)}%`, color: `${t.cardText}66` }}
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
          {/* 夜间压缩区标记 */}
          <div
            className="absolute left-0 right-0 border-t border-dashed" style={{ borderColor: `${t.accent}4D`, top: `${hourToPercent(7)}%` }}
          />
        </div>

        {/* 事件区 */}
        <div className="flex-1 relative" style={{ height: '100%' }}>
          {/* 水平网格线 */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full h-[1px] left-0" style={{ top: `${hourToPercent(hour)}%`, backgroundColor: `${t.accent}33` }}
            />
          ))}

          {/* 今天高亮 */}
          {isToday && (
            <div className="absolute top-0 h-full left-0 right-0" style={{ backgroundColor: `${t.accent}0D` }} />
          )}

          {/* 点击空白区域创建事件 */}
          <div
            className="absolute top-0 h-full left-0 right-0 cursor-pointer"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const y = e.clientY - rect.top;
              const ratio = y / rect.height;
              const hour = Math.floor(percentToHour(ratio));
              const clickDate = new Date(date);
              clickDate.setHours(hour, 0, 0, 0);
              onSlotClick(clickDate, hour);
            }}
          />

          {/* 事件色块 */}
          {layouts.map(({ event, col, totalCols }) => {
            const colWidthPercent = 100 / totalCols;
            const colLeft = col * colWidthPercent;
            const gap = 1.6; // 卡片两侧留白，视觉居中
            const cardLeft = colLeft + gap / 2;
            const cardWidth = colWidthPercent - gap;

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
                left={cardLeft}
                width={cardWidth}
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
  y,
  gridRef,
  yToHour,
  snapToGrid,
}: {
  y: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  yToHour: (y: number) => number;
  snapToGrid: (hour: number) => number;
}) {
  const t = usePageTheme('schedule');
  if (!gridRef.current) return null;

  const hour = snapToGrid(yToHour(y));
  const top = hourToPercent(hour);

  const timeStr = `${pad(Math.floor(hour))}:${pad(Math.round((hour % 1) * 60))}`;

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none"
      style={{ top: `${top}%` }}
    >
      {/* 时间标签 */}
      <div className="absolute -left-14 -top-3 text-xs px-2 py-1 rounded shadow-lg" style={{ backgroundColor: t.accent, color: t.cardText }}>
        {timeStr}
      </div>
      {/* 指示线 */}
      <div className="w-full h-[2px] shadow-lg" style={{ backgroundColor: t.accent }} />
    </div>
  );
}
