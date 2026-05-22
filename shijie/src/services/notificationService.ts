/**
 * 通知服务 - 检测即将开始的日程并发送提醒
 */
import type { Schedule } from '@/types/schedule';

const CHECK_INTERVAL = 60 * 1000; // 每分钟检查一次
const REMINDER_MINUTES = 10; // 提前 10 分钟提醒

let timer: ReturnType<typeof setInterval> | null = null;
let notifiedEvents = new Set<string>();

/** 启动通知检测 */
export function startNotificationChecker(
  getSchedules: () => Schedule[],
  onReminder: (event: Schedule) => void
) {
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // 清除旧定时器
  if (timer) {
    clearInterval(timer);
  }

  // 每分钟检查一次
  timer = setInterval(() => {
    checkReminders(getSchedules(), onReminder);
  }, CHECK_INTERVAL);

  // 立即检查一次
  checkReminders(getSchedules(), onReminder);
}

/** 停止通知检测 */
export function stopNotificationChecker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  notifiedEvents.clear();
}

/** 检查是否有需要提醒的日程 */
function checkReminders(schedules: Schedule[], onReminder: (event: Schedule) => void) {
  const now = new Date();
  const reminderTime = new Date(now.getTime() + REMINDER_MINUTES * 60 * 1000);

  for (const event of schedules) {
    // 跳过已通知的事件
    if (notifiedEvents.has(event.id)) continue;

    // 跳过无开始时间的事件
    if (!event.start_at) continue;

    const startTime = new Date(event.start_at);

    // 检查是否在提醒范围内（现在到 10 分钟后）
    if (startTime > now && startTime <= reminderTime) {
      // 发送通知
      sendNotification(event);
      onReminder(event);
      notifiedEvents.add(event.id);
    }
  }

  // 清理过期的通知记录
  for (const id of notifiedEvents) {
    const event = schedules.find((e) => e.id === id);
    if (!event || new Date(event.start_at) < now) {
      notifiedEvents.delete(id);
    }
  }
}

/** 发送系统通知 */
function sendNotification(event: Schedule) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const startTime = new Date(event.start_at);
    const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;

    new Notification('日程提醒', {
      body: `${event.title} 将在 ${REMINDER_MINUTES} 分钟后开始（${timeStr}）`,
      icon: '/favicon.ico',
      tag: event.id, // 防止重复通知
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
