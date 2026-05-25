/**
 * 通知服务 - 检测即将开始的日程并发送提醒
 * 支持每个日程独立的 reminder 字段（提前分钟数）
 */
import type { Schedule } from '@/types/schedule';

const CHECK_INTERVAL = 60 * 1000; // 每分钟检查一次
const DEFAULT_REMINDER_MINUTES = 10; // 默认提前 10 分钟

let timer: ReturnType<typeof setInterval> | null = null;
let notifiedEvents = new Set<string>();

/** 是否启用通知（由设置页控制） */
let enabled = true;

export function setNotificationEnabled(v: boolean) {
  enabled = v;
}

/** 启动通知检测 */
export function startNotificationChecker(
  getSchedules: () => Schedule[],
  onReminder: (event: Schedule) => void
) {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(() => {
    if (enabled) {
      checkReminders(getSchedules(), onReminder);
    }
  }, CHECK_INTERVAL);

  // 立即检查一次
  if (enabled) {
    checkReminders(getSchedules(), onReminder);
  }
}

/** 停止通知检测 */
export function stopNotificationChecker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  notifiedEvents.clear();
}

/** 获取事件的提醒分钟数 */
function getReminderMinutes(event: Schedule): number | null {
  if (!event.reminder) return null;
  const n = parseInt(event.reminder, 10);
  if (isNaN(n) || n <= 0) return null;
  return n;
}

/** 检查是否有需要提醒的日程 */
function checkReminders(schedules: Schedule[], onReminder: (event: Schedule) => void) {
  const now = new Date();

  for (const event of schedules) {
    if (notifiedEvents.has(event.id)) continue;
    if (!event.start_at) continue;

    const reminderMinutes = getReminderMinutes(event) ?? DEFAULT_REMINDER_MINUTES;
    const startTime = new Date(event.start_at);
    const reminderTime = new Date(now.getTime() + reminderMinutes * 60 * 1000);

    // 检查开始时间是否在提醒窗口内
    if (startTime > now && startTime <= reminderTime) {
      sendNotification(event, reminderMinutes);
      onReminder(event);
      notifiedEvents.add(event.id);
    }
  }

  // 清理已过期的通知记录
  for (const id of notifiedEvents) {
    const event = schedules.find((e) => e.id === id);
    if (!event || new Date(event.start_at) < now) {
      notifiedEvents.delete(id);
    }
  }
}

/** 发送系统通知 */
function sendNotification(event: Schedule, minutesBefore: number) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const startTime = new Date(event.start_at);
    const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    const body = minutesBefore > 1
      ? `${event.title} 将在 ${minutesBefore} 分钟后开始（${timeStr}）`
      : `${event.title} 即将开始（${timeStr}）`;

    new Notification('日程提醒', {
      body,
      tag: event.id,
    });
  }
}

/** 手动发送通知（用于测试） */
export function sendTestNotification(title: string, body: string) {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }
}
