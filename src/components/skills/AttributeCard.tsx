import type { Skill } from '@/types/skill';
import { SKILL_COLORS } from '@/styles/theme';
import { usePageTheme } from '@/hooks/usePageTheme';

interface AttributeCardProps {
  skill: Skill;
}

const LEVEL_TITLES: Record<number, string> = {
  1: '入门', 2: '初窥', 3: '略懂',
  4: '通晓', 5: '精熟', 6: '专深',
  7: '卓越', 8: '宗师', 9: '入圣',
  10: '化境',
};

function getLevelInfo(totalXp: number, level: number) {
  const xpAtLevelStart = 100 * level * (level - 1) / 2;
  const xpForNextLevel = 100 * level;
  const currentLevelXp = totalXp - xpAtLevelStart;
  const progress = Math.min(currentLevelXp / xpForNextLevel, 1);
  return { level, currentXp: currentLevelXp, xpToNext: xpForNextLevel - currentLevelXp, progress };
}

export function AttributeCard({ skill }: AttributeCardProps) {
  const t = usePageTheme('skills');
  const surface = (o: number) => t.isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o})`;

  const info = SKILL_COLORS[skill.id];
  const color = info?.hex || '#888';
  const name = info?.name || skill.name;
  const { level, currentXp, xpToNext, progress } = getLevelInfo(skill.total_xp, skill.level);
  const title = LEVEL_TITLES[level] || '超凡';

  return (
    <div
      className="backdrop-blur-sm rounded-2xl p-5 transition-colors"
      style={{ backgroundColor: surface(0.05) }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = surface(0.08))}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = surface(0.05))}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-lg font-normal" style={{ color: surface(0.85) }}>{name}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color }}>Lv.{level}</span>
          <span className="text-xs ml-1" style={{ color: surface(0.3) }}>{title}</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-2.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: surface(0.08) }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress * 100}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex justify-between text-xs" style={{ color: surface(0.35) }}>
        <span>{currentXp} / {100 * level} XP</span>
        <span>{xpToNext > 0 ? `距下一级 +${xpToNext}XP` : '已满级'}</span>
      </div>
    </div>
  );
}
