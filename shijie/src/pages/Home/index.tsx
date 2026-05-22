import { useState, useRef } from 'react';
import { Clock, X } from 'lucide-react';
import { HeaderButton, PageContainer, WindowControls } from '@/components/layout';
import { LanternSvg } from '@/components/ui';

export function HomePage() {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 模拟历史记录数据
  const historyItems = [
    { id: 1, title: '学习 React 基础', time: '今天 14:30' },
    { id: 2, title: '准备周报内容', time: '今天 10:15' },
    { id: 3, title: '制定健身计划', time: '昨天 20:00' },
    { id: 4, title: '阅读《原子习惯》', time: '昨天 15:45' },
  ];

  return (
    <PageContainer className="bg-[#1a1a1a] relative overflow-hidden flex flex-col">
      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ========== 历史记录侧边栏 ========== */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-[#222] border-l border-white/10 z-50 transform transition-transform duration-300 ${
          showHistory ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-[72px] px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-white/60" />
            <span className="text-lg text-white/90 font-light">历史记录</span>
          </div>
          <button
            onClick={() => setShowHistory(false)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/5"
            >
              <p className="text-white/90 text-base font-light mb-1">{item.title}</p>
              <p className="text-white/40 text-sm">{item.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 历史记录遮罩层 */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowHistory(false)}
        />
      )}

      {/* ========== 顶部标题栏 ========== */}
      <div data-tauri-drag-region className="relative z-10 h-[72px] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 flex-shrink-0 -mx-4 md:-mx-6 lg:-mx-8">
        {/* 左上角 - 提灯按钮 */}
        <HeaderButton title="助手" />

        {/* 中央 - 诗句标题 */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
          野径云俱黑，江船火独明
        </h1>

        {/* 右侧 - 窗口控制按钮 */}
        <WindowControls />
      </div>

      {/* ========== 主内容区 - 提灯图 + AI回答区 ========== */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-16 py-12">
        <div className="flex items-start justify-center gap-24 max-w-5xl w-full">

          {/* 左侧 - 提灯意象图 */}
          <div className="relative flex-shrink-0 group">
            {/* 发光效果层 */}
            <div className="absolute inset-0 blur-3xl opacity-40 bg-blue-400/20 rounded-full scale-110" />

            {/* 提灯图片容器 */}
            <div className="relative w-[280px] h-[340px] flex items-center justify-center">
              <LanternSvg />
            </div>
          </div>

          {/* 右侧 - AI 回答卡片 */}
          <div className="flex-1 max-w-[480px] flex flex-col items-center">
            <div
              className="w-full min-h-[280px] rounded-[28px] border border-white/20 bg-black/20 backdrop-blur-sm p-12 flex flex-col"
              onClick={() => inputRef.current?.focus()}
            >
              {/* 卡片内容区 */}
              <div className="flex-1 flex items-center justify-center">
                {!input ? (
                  <p className="text-white/35 text-lg font-light text-center leading-relaxed">
                    提灯在等你说话呢
                  </p>
                ) : (
                  <p className="text-white/70 text-lg font-light text-left leading-relaxed break-words whitespace-pre-wrap w-full">
                    {input}
                  </p>
                )}
              </div>

              {/* 隐藏的真实输入框 */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder=""
                className="sr-only"
                tabIndex={0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========== 底部输入区 ========== */}
      <div className="relative z-10 px-16 pb-10 pt-6 flex-shrink-0">
        {/* 输入行居中容器 */}
        <div className="flex items-end justify-center">
          {/* 输入框 */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder=""
            className="w-[500px] h-[52px] bg-transparent border-b border-white/25 text-white/80 text-lg font-light placeholder:text-white/20 focus:outline-none focus:border-[#58A968]/60 transition-colors px-2"
          />

          {/* 发送按钮 */}
          <button
            className={`h-[44px] px-7 rounded-full font-medium text-base transition-all flex-shrink-0 ml-4 ${
              input.trim()
                ? 'bg-white/15 text-white/90 hover:bg-white/25'
                : 'bg-white/8 text-white/40 cursor-not-allowed'
            }`}
            disabled={!input.trim()}
          >
            发送
          </button>
        </div>

        {/* 左下角小船 - 历史记录 */}
        <button
          onClick={() => setShowHistory(true)}
          className="mt-8 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
          title="历史记录"
        >
          <img
            src="/assets/CodeBuddyAssets/47_57/9.png"
            alt="历史记录"
            className="w-[160px] h-auto object-contain"
          />
        </button>
      </div>
    </PageContainer>
  );
}
