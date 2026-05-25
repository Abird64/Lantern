import type { Task } from '@/types/task';
import type { Weights } from '@/stores/weightsStore';

/** 优先级数值 */
const PRIORITY_SCORE: Record<string, number> = {
  high: 1,
  medium: 0.6,
  low: 0.3,
  none: 0,
};

/**
 * 紧急度 (0-1): 距截止日期越近越高
 * 无截止日期 → 0.2（低但不为零）
 * 已过期 → 1
 * 7天内 → 线性映射 0.9→0.4
 */
function urgencyScore(task: Task): number {
  if (!task.deadline) return 0.2;
  const now = Date.now();
  const deadline = new Date(task.deadline).getTime();
  const daysLeft = (deadline - now) / (1000 * 60 * 60 * 24);

  if (daysLeft < 0) return 1;
  if (daysLeft <= 7) return 0.9 - (daysLeft / 7) * 0.5;
  if (daysLeft <= 30) return 0.4 - ((daysLeft - 7) / 23) * 0.2;
  return 0.2;
}

/**
 * 价值 (0-1): 基于优先级
 */
function valueScore(task: Task): number {
  if (!task.priority || task.priority === 'none') return 0.3;
  return PRIORITY_SCORE[task.priority] ?? 0.3;
}

/**
 * 成本得分 (0-1): 耗时越少得分越高（鼓励速赢）
 * 无预估 → 0.5
 * 5分钟 → 0.95, 30分钟 → 0.7, 60分钟 → 0.5, 120+ → 0.2
 */
function costScore(task: Task): number {
  const mins = task.estimated_minutes;
  if (!mins || mins <= 0) return 0.5;
  if (mins <= 5) return 0.95;
  if (mins <= 60) return 0.95 - ((mins - 5) / 55) * 0.45;
  if (mins <= 180) return 0.5 - ((mins - 60) / 120) * 0.3;
  return 0.2;
}

/** 计算单个任务的推荐分 */
export function scoreTask(task: Task, weights: Weights): number {
  const u = urgencyScore(task);
  const v = valueScore(task);
  const c = costScore(task);
  const total = weights.urgency + weights.value + weights.cost || 1;
  return (u * weights.urgency + v * weights.value + c * weights.cost) / total;
}

/** 从任务列表中推荐最优任务（排除已完成/已取消） */
export function recommendTask(tasks: Task[], weights: Weights): Task | null {
  const candidates = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  );
  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestScore = scoreTask(best, weights);

  for (let i = 1; i < candidates.length; i++) {
    const s = scoreTask(candidates[i], weights);
    if (s > bestScore) {
      best = candidates[i];
      bestScore = s;
    }
  }

  return best;
}
