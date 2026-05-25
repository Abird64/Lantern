import { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer, GridBackground } from '@/components/layout';
import { NavBar } from '@/components/ui';
import { WeekView } from '@/components/schedule/WeekView';
import { MonthView } from '@/components/schedule/MonthView';
import { AgendaView } from '@/components/schedule/AgendaView';
import { DayView } from '@/components/schedule/DayView';
import { DateNavigator } from '@/components/schedule/DateNavigator';
import { EventForm } from '@/components/schedule/EventForm';
import { EventDetail } from '@/components/schedule/EventDetail';
import { useScheduleStore } from '@/stores/scheduleStore';
import { parseIcs } from '@/utils/icsParser';
import * as scheduleService from '@/services/scheduleService';
import { startNotificationChecker, stopNotificationChecker, setNotificationEnabled } from '@/services/notificationService';
import { useSettingStore } from '@/stores/settingStore';
import { addExdate } from '@/services/scheduleService';
import { usePageTheme } from '@/hooks/usePageTheme';
import { Plus } from 'lucide-react';
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from '@/types/schedule';

type ViewMode = 'week' | 'month' | 'agenda' | 'day';

const filters = [
  { id: 'all', label: '全部' },
  { id: '课表', label: '课表' },
  { id: '学习', label: '学习' },
  { id: '娱乐', label: '娱乐' },
  { id: '工作', label: '工作' },
  { id: '生活', label: '生活' },
];

/** 获取某天所在周的周一 */
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0=Sunday
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diff);
  return d;
}

/** 格式化周范围标签 */
function formatWeekLabel(weekMonday: Date): string {
  const end = new Date(weekMonday);
  end.setDate(end.getDate() + 6);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${weekMonday.getFullYear()}年${weekMonday.getMonth() + 1}月${pad(weekMonday.getDate())}日 - ${end.getMonth() + 1}月${pad(end.getDate())}日`;
}


export function SchedulePage() {
  const t = usePageTheme('schedule');
  const getSetting = useSettingStore((s) => s.get);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekMonday, setWeekMonday] = useState(() => getWeekMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [formDefaults, setFormDefaults] = useState<{ start?: string; end?: string }>({});
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { schedules, isLoading, error, fetchSchedules, createSchedule, updateSchedule, deleteSchedule, filter, setFilter } = useScheduleStore();

  // 月视图需要的月份
  const currentMonth = weekMonday.getMonth();
  const currentYear = weekMonday.getFullYear();

  // 计算范围
  const rangeStart = viewMode === 'month'
    ? new Date(currentYear, currentMonth, 1).toISOString()
    : viewMode === 'agenda'
      ? new Date().toISOString() // 近期视图从当前时刻开始
      : weekMonday.toISOString();

  const rangeEnd = viewMode === 'month'
    ? new Date(currentYear, currentMonth + 1, 1).toISOString()
    : viewMode === 'agenda'
      ? (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })().toISOString() // 近期视图显示未来 30 天
      : (() => { const d = new Date(weekMonday); d.setDate(d.getDate() + 7); return d; })().toISOString();

  // 加载数据
  useEffect(() => {
    fetchSchedules(rangeStart, rangeEnd);
  }, [weekMonday.getTime(), viewMode, selectedDay.getTime()]);

  // 启动通知检测
  useEffect(() => {
    const notifyEnabled = getSetting('notification.task_reminder') === 'true';
    setNotificationEnabled(notifyEnabled);

    startNotificationChecker(
      () => schedules,
      (event) => {
        // 浏览器通知由 sendNotification 处理，这里可以留给未来的 in-app toast
        console.log(`[日程提醒] ${event.title}`);
      }
    );

    return () => {
      stopNotificationChecker();
    };
  }, [schedules, getSetting]);

  // 筛选（使用 store 中的 filter 状态）
  const filteredSchedules = filter === 'all'
    ? schedules
    : schedules.filter((s) => s.category === filter);

  // 导航
  const handlePrev = useCallback(() => {
    const prev = new Date(weekMonday);
    prev.setDate(prev.getDate() - 7);
    setWeekMonday(prev);
  }, [weekMonday]);

  const handleNext = useCallback(() => {
    const next = new Date(weekMonday);
    next.setDate(next.getDate() + 7);
    setWeekMonday(next);
  }, [weekMonday]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setWeekMonday(getWeekMonday(today));
    setSelectedDay(today);
  }, []);

  // 月视图导航
  const handlePrevMonth = useCallback(() => {
    const prev = new Date(currentYear, currentMonth - 1, 1);
    setWeekMonday(prev);
  }, [currentYear, currentMonth]);

  const handleNextMonth = useCallback(() => {
    const next = new Date(currentYear, currentMonth + 1, 1);
    setWeekMonday(next);
  }, [currentYear, currentMonth]);

  // 记录从哪个视图进入日视图
  const [previousView, setPreviousView] = useState<ViewMode>('week');

  // 点击月视图中的某天，切换到日视图
  const handleDayClick = useCallback((date: Date) => {
    setSelectedDay(date);
    setPreviousView('month');
    setViewMode('day');
  }, []);

  // 从日视图返回
  const handleBackFromDay = useCallback(() => {
    if (previousView === 'month') {
      setViewMode('month');
    } else {
      setWeekMonday(getWeekMonday(selectedDay));
      setViewMode('week');
    }
  }, [selectedDay, previousView]);

  // 日视图导航
  const handlePrevDay = useCallback(() => {
    const prev = new Date(selectedDay);
    prev.setDate(prev.getDate() - 1);
    setSelectedDay(prev);
  }, [selectedDay]);

  const handleNextDay = useCallback(() => {
    const next = new Date(selectedDay);
    next.setDate(next.getDate() + 1);
    setSelectedDay(next);
  }, [selectedDay]);

  // 创建事件
  const handleSlotClick = useCallback((date: Date, hour: number) => {
    const endDate = new Date(date);
    endDate.setHours(hour + 1);
    setFormDefaults({
      start: date.toISOString(),
      end: endDate.toISOString(),
    });
    setShowForm(true);
  }, []);

  const handleCreateClick = useCallback(() => {
    setFormDefaults({});
    setShowForm(true);
  }, []);

  const handleFormSubmit = useCallback(async (input: CreateScheduleInput) => {
    await createSchedule(input);
    setShowForm(false);
    fetchSchedules(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd]);

  const handleEventClick = useCallback((event: Schedule) => {
    setSelectedEvent(event);
  }, []);

  const handleEventUpdate = useCallback(async (id: string, input: UpdateScheduleInput) => {
    await updateSchedule(id, input);
    setSelectedEvent(null);
    fetchSchedules(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd]);

  const handleEventDelete = useCallback(async (id: string) => {
    await deleteSchedule(id);
    setSelectedEvent(null);
    fetchSchedules(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd]);

  // 重复事件：只修改这一次
  const handleUpdateInstance = useCallback(async (baseId: string, dateStr: string, input: UpdateScheduleInput) => {
    // 1. 给父事件添加 exdate
    await addExdate(baseId, dateStr);
    // 2. 创建独立事件
    await createSchedule({
      title: input.title || '',
      description: input.description,
      start_at: input.start_at || '',
      end_at: input.end_at,
      category: input.category,
      location: input.location,
    });
    setSelectedEvent(null);
    fetchSchedules(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd]);

  // 重复事件：只删除这一次
  const handleDeleteInstance = useCallback(async (baseId: string, dateStr: string) => {
    await addExdate(baseId, dateStr);
    setSelectedEvent(null);
    fetchSchedules(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd]);

  // 导入 .ics 文件
  const handleImportIcs = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const events = parseIcs(content);

      if (events.length === 0) {
        setImportResult('未找到有效日程');
        setTimeout(() => setImportResult(null), 3000);
        return;
      }

      const result = await scheduleService.importIcsEvents(events);
      setImportResult(`导入 ${result.imported} 个，跳过 ${result.skipped} 个`);
      setTimeout(() => setImportResult(null), 3000);

      // 刷新数据
      fetchSchedules(rangeStart, rangeEnd);
    } catch (err) {
      setImportResult('导入失败：' + String(err));
      setTimeout(() => setImportResult(null), 3000);
    }

    // 清空 input
    e.target.value = '';
  }, [rangeStart, rangeEnd]);

  return (
    <PageContainer className="relative" bgColor={t.bg}>
      {/* 网格背景 */}
      <GridBackground isDark={t.isDark} />

      <NavBar title="日历" navColor={t.nav} quote="墙角数枝梅，凌寒独自开" />

      {/* 固定控制区：筛选 + 导航 */}
      <div className="flex-shrink-0 flex flex-col items-center px-8 pt-6 pb-4 relative z-10">
        {/* 筛选 + 导航 */}
        <div className="w-full max-w-[1000px] space-y-4">
          {/* 筛选标签 + 视图切换 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="min-w-[60px] px-4 py-1.5 rounded-full text-sm font-light tracking-wider transition-all"
                  style={{
                    backgroundColor: filter === f.id ? t.accent : `${t.accent}4D`,
                    color: filter === f.id ? t.cardText : t.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                    boxShadow: filter === f.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : undefined,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 视图切换 */}
            <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: `${t.accent}33` }}>
              {(['day', 'week', 'month', 'agenda'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="px-3 py-1 rounded-full text-sm transition-all"
                  style={{
                    backgroundColor: viewMode === mode ? t.accent : 'transparent',
                    color: viewMode === mode ? t.cardText : t.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  }}
                >
                  {mode === 'day' ? '日' : mode === 'week' ? '周' : mode === 'month' ? '月' : '近期'}
                </button>
              ))}
            </div>
          </div>

          {/* 日期导航 */}
          <DateNavigator
            weekLabel={viewMode === 'agenda'
              ? '近期'
              : viewMode === 'week'
                ? formatWeekLabel(weekMonday)
                : viewMode === 'month'
                  ? `${currentYear}年${currentMonth + 1}月`
                  : `${selectedDay.getMonth() + 1}月${selectedDay.getDate()}日`
            }
            onPrev={viewMode === 'agenda' ? undefined : viewMode === 'month' ? handlePrevMonth : viewMode === 'day' ? handlePrevDay : handlePrev}
            onNext={viewMode === 'agenda' ? undefined : viewMode === 'month' ? handleNextMonth : viewMode === 'day' ? handleNextDay : handleNext}
            onToday={handleToday}
            onImportIcs={handleImportIcs}
          />

          {/* 导入结果 / 错误提示 */}
          {(importResult || error) && (
            <div className="px-4 py-2 rounded-full text-sm text-center"
              style={{
                backgroundColor: error ? 'rgba(239,68,68,0.3)' : t.accent,
                color: error ? 'rgb(254,202,202)' : t.cardText,
              }}
            >
              {error || importResult}
            </div>
          )}
        </div>
      </div>

      {/* 可滚动内容区：日历视图 */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 pb-8 relative z-10">
        {/* 日历视图 */}
        <div className="w-full max-w-[1000px]">
          {viewMode === 'week' ? (
            <WeekView
              weekStart={weekMonday}
              schedules={filteredSchedules}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onEventUpdate={handleEventUpdate}
            />
          ) : viewMode === 'month' ? (
            <MonthView
              year={currentYear}
              month={currentMonth}
              schedules={filteredSchedules}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          ) : viewMode === 'day' ? (
            <DayView
              date={selectedDay}
              schedules={schedules}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onEventUpdate={handleEventUpdate}
              onBack={handleBackFromDay}
              backLabel={previousView === 'month' ? '返回月视图' : '返回周视图'}
            />
          ) : (
            <AgendaView
              schedules={filteredSchedules}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {/* 创建表单弹窗 */}
      {showForm && (
        <EventForm
          defaultStart={formDefaults.start}
          defaultEnd={formDefaults.end}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 事件详情弹窗 */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
          onUpdateInstance={handleUpdateInstance}
          onDeleteInstance={handleDeleteInstance}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ics"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* FAB 添加按钮 */}
      <button
        onClick={handleCreateClick}
        className="fixed bottom-8 right-8 z-30 w-14 h-14 rounded-full text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
        style={{ backgroundColor: t.accent }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

    </PageContainer>
  );
}
