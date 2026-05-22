import { useEffect } from 'react';
import { NavBar } from '@/components/ui';
import { useSkillStore } from '@/stores/skillStore';
import { SKILL_COLORS, SKILL_ORDER, themes } from '@/styles/theme';

const theme = themes.skills;

/** 等级信息：每100 XP 升一级 */
function getLevelInfo(totalXp: number) {
  const xpPerLevel = 100;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const currentXp = totalXp % xpPerLevel;
  const progress = currentXp / xpPerLevel;
  return { level, currentXp, xpToNext: xpPerLevel - currentXp, progress };
}

export function SkillsPage() {
  const { skills, fetchSkills } = useSkillStore();

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return (
    <div
      className="h-screen px-4 md:px-6 lg:px-8 relative flex flex-col overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 顶部导航栏 */}
      <NavBar
        title="修为"
        navColor={theme.nav}
        quote="博观而约取，厚积而薄发"
      />

      {/* 主内容 */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 pb-8">
        <div className="h-6" />

        {/* 六维属性卡片 */}
        <div className="w-full max-w-[1000px] grid grid-cols-2 gap-6">
          {SKILL_ORDER.map((skillId) => {
            const info = SKILL_COLORS[skillId];
            const skill = skills.find((s) => s.id === skillId);
            const totalXp = skill?.total_xp ?? 0;
            const { level, currentXp, progress } = getLevelInfo(totalXp);

            return (
              <div
                key={skillId}
                className="bg-white/10 backdrop-blur-sm rounded-[28px] p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: info.hex + '30' }}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: info.hex }}
                      />
                    </div>
                    <span className="text-xl font-normal" style={{ color: theme.text }}>
                      {info.name}
                    </span>
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: info.hex }}
                  >
                    Lv.{level}
                  </span>
                </div>

                {/* XP 进度条 */}
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: info.hex,
                    }}
                  />
                </div>

                <div className="flex justify-between text-sm" style={{ color: theme.text + '80' }}>
                  <span>{currentXp} / 100 XP</span>
                  <span>总计: {totalXp} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
