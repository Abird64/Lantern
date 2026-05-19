import { useState } from 'react';
import { HeaderButton, PageContainer, WindowControls } from '@/components/layout';

const filters = [
  { id: 'all', label: '全部' },
  { id: 'schedule', label: '课表' },
  { id: 'study', label: '学习' },
  { id: 'entertainment', label: '娱乐' },
];

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function SchedulePage() {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <PageContainer className="bg-[#953737] relative flex flex-col">
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

      {/* ========== 顶部导航栏 ========== */}
      <div className="relative z-10 h-[72px] bg-[#2A2A2A] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 flex-shrink-0 -mx-4 md:-mx-6 lg:-mx-8">
        <HeaderButton title="时序" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
          墙角数枝梅，凌寒独自开
        </h1>
        {/* 右侧 - 窗口控制按钮 */}
        <WindowControls />
      </div>

      {/* ========== 主内容居中容器 ========== */}
      <div className="flex-1 flex flex-col items-center px-8">
        
        {/* 顶部间隔 */}
        <div className="h-6" />
        
        {/* ========== 筛选标签栏 ========== */}
        <div className="w-full max-w-[1000px]">
          <div className="flex items-center gap-6">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`min-w-[80px] px-6 py-4 rounded-full text-lg font-light tracking-wider transition-all ${
                  activeFilter === filter.id
                    ? 'bg-[#F2C94C] text-[#1A1A1A] shadow-lg'
                    : 'bg-[#F2C94C]/30 text-white/80 hover:bg-[#F2C94C]/50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* 中间间隔 */}
        <div className="h-6" />

        {/* ========== 日历网格 - 居中显示 ========== */}
        <div className="w-full max-w-[1000px] pb-8">
          <div className="w-full h-[500px] bg-[#F8F5F0] rounded-[40px] relative overflow-hidden">
            {/* 水平分隔线 */}
            {[60, 120, 180, 240, 300, 360, 420, 480].map((top) => (
              <div
                key={`h-${top}`}
                className="absolute w-full h-[1px] bg-[#D4A017]/40 left-0"
                style={{ top }}
              />
            ))}

            {/* 垂直分隔线 */}
            {[140, 280, 420, 560, 700, 840].map((left) => (
              <div
                key={`v-${left}`}
                className="absolute h-full w-[1px] bg-[#D4A017]/40 top-0"
                style={{ left }}
              />
            ))}

            {/* 星期标签 */}
            <div className="absolute top-0 left-0 w-full h-[60px] flex">
              {weekDays.map((day, idx) => {
                const leftPos = 140 + idx * 140;
                return (
                  <div
                    key={day}
                    className="absolute h-full flex items-center justify-center"
                    style={{ left: leftPos, width: 140 }}
                  >
                    <span className="font-zhuque text-2xl text-[#1A1A1A]">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========== 底部装饰 ========== */}
      <div className="absolute bottom-0 left-0 pointer-events-none">
        <img
          src="/assets/CodeBuddyAssets/47_57/11.png"
          alt="装饰"
          className="w-[180px] h-auto"
        />
      </div>
    </PageContainer>
  );
}
