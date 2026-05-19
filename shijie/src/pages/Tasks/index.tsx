import { useState } from 'react';
import { Circle } from 'lucide-react';
import { CapsuleTabs, NavBar, themes } from '@/components/ui';

const categories = [
  { id: 'wanxiang', label: '万象' },
  { id: 'jinchen', label: '今辰' },
  { id: 'yuanyuan', label: '圆满' },
  { id: 'qixu', label: '期许' },
  { id: 'chimu', label: '迟暮' },
];

const tasksData = [
  {
    id: 1,
    title: '高数作业',
    date: '2026-03-24',
    skills: [
      { name: '学识', xp: 3, color: '#4A90D9' },
      { name: '才情', xp: 3, color: '#D4A843' },
    ],
    completed: false,
  },
  {
    id: 2,
    title: '英语阅读',
    date: '2026-03-25',
    skills: [
      { name: '学识', xp: 5, color: '#4A90D9' },
      { name: '体魄', xp: 2, color: '#58A968' },
    ],
    completed: false,
  },
  {
    id: 3,
    title: '健身计划',
    date: '2026-03-23',
    skills: [
      { name: '体魄', xp: 10, color: '#58A968' },
    ],
    completed: true,
  },
  {
    id: 4,
    title: '项目文档',
    date: '2026-03-26',
    skills: [
      { name: '学识', xp: 5, color: '#4A90D9' },
      { name: '才情', xp: 2, color: '#D4A843' },
    ],
    completed: true,
  },
];

const theme = themes.tasks;

export function TasksPage() {
  const [activeCategory, setActiveCategory] = useState('wanxiang');
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredTasks = showCompleted
    ? tasksData.filter((t) => t.completed)
    : tasksData.filter((t) => !t.completed);

  return (
    <div
      className="min-h-screen px-4 md:px-6 lg:px-8 relative flex flex-col"
      style={{ backgroundColor: theme.bg }}
    >
      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 顶部导航栏 */}
      <NavBar
        title="尘事"
        navColor={theme.nav}
        quote="苔痕上阶绿，草色入帘青"
      />

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center px-8">
        {/* 顶部间隔 */}
        <div className="h-6" />

        {/* 胶囊分类栏 */}
        <div className="w-full max-w-[1000px]">
          <CapsuleTabs
            items={categories}
            activeId={activeCategory}
            onChange={setActiveCategory}
            accentColor={theme.accent}
          />
        </div>

        {/* 中间间隔 */}
        <div className="h-6" />

        {/* 任务卡片区 */}
        <div className="w-full max-w-[1000px]">
          <div className="grid grid-cols-2 gap-6">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/60 backdrop-blur-sm rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-5">
                    {/* 左侧五边形图标 */}
                    <div className="w-[72px] h-[72px] flex-shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <polygon
                          points="50,5 95,38 78,90 22,90 5,38"
                          fill="#E0F2FE"
                          stroke="#93C5FD"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    {/* 右侧信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-normal text-black mb-1.5 truncate">
                        {task.title}
                      </h3>
                      <p className="text-base text-[#666] mb-3">
                        {task.date}
                      </p>

                      {/* XP标签 */}
                      <div className="flex gap-4">
                        {task.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 text-sm"
                            style={{ color: skill.color }}
                          >
                            <Circle size={14} fill={skill.color} />
                            {skill.name}+{skill.xp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 flex items-center justify-center py-20">
                <p className="text-[#888] text-lg">
                  暂无{showCompleted ? '已完成' : '进行中'}的任务
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 左下角熊猫 */}
      <div className="absolute bottom-6 left-8 z-10">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={
            showCompleted
              ? 'opacity-90 hover:opacity-100 transition-opacity'
              : 'opacity-60 hover:opacity-80 transition-opacity'
          }
          title={showCompleted ? '返回进行中任务' : '查看已完成任务'}
        >
          <img
            src="/assets/CodeBuddyAssets/47_57/10.png"
            alt="已完成任务"
            className="w-[180px] h-auto object-contain"
          />
        </button>
      </div>

      {/* 已完成任务遮罩 */}
      {showCompleted && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setShowCompleted(false)}
        />
      )}
    </div>
  );
}
