import { useEffect, useState, useRef } from 'react';
import { Card, LanternSvg, MascotModal } from '@/components/ui';
import { HeaderButton, PageContainer, WindowControls } from '@/components/layout';
import { TimelineDropdown } from '@/components/diary/TimelineDropdown';
import { useJournalStore } from '@/stores/journalStore';
import { SKILL_COLORS } from '@/styles/theme';
import type { CompleteResult } from '@/types/task';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${dateStr} ${WEEKDAYS[date.getDay()]}`;
}

export function DiaryPage() {
  const {
    currentDate,
    content,
    isLoading,
    isSaving,
    lastSaved,
    showTimeline,
    showAiPanel,
    aiContent,
    aiExists,
    updateContent,
    loadToday,
    saveNow,
    toggleTimeline,
    toggleAiPanel,
    completeDiary,
  } = useJournalStore();

  // 日记结算浮窗
  const [xpToast, setXpToast] = useState<CompleteResult | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化：加载今日日记
  useEffect(() => {
    loadToday();
  }, [loadToday]);

  // 卸载前强制保存
  useEffect(() => {
    return () => {
      saveNow();
    };
  }, [saveNow]);

  // 清理 toast 计时器
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleRixing = async () => {
    await saveNow();
    const result = await completeDiary();
    if (result) {
      setXpToast(result);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setXpToast(null), 4000);
    }
  };

  return (
    <PageContainer className="bg-[#F7F3E9] relative">
      {/* 顶部导航栏 */}
      <div data-tauri-drag-region className="flex-shrink-0 h-[72px] bg-[#2C3532] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 -mx-4 md:-mx-6 lg:-mx-8">
        <HeaderButton title="日记" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
          人闲桂花落，夜景春山空
        </h1>
        <WindowControls />
      </div>

      {/* 固定控制区：日期胶囊 + 时间线 */}
      <div className="flex-shrink-0 flex flex-col items-center pt-6 pb-3">
        {/* 日期胶囊 - 可点击打开时间线 */}
        <div className="flex justify-center px-8 w-full">
          <div className="max-w-[1000px] flex-1">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTimeline}
                className="min-w-[200px] py-4 bg-[#E6D9B8] rounded-full px-10 flex items-center justify-center hover:bg-[#d9c9a5] transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <span className="font-zhuque text-xl text-black/50">加载中...</span>
                ) : (
                  <span className="font-zhuque text-xl text-black">
                    {formatDisplayDate(currentDate)}
                  </span>
                )}
              </button>

              {/* 保存状态指示 */}
              {isSaving && (
                <span className="font-zhuque text-sm text-black/30">保存中...</span>
              )}
              {!isSaving && lastSaved && (
                <span className="font-zhuque text-sm text-black/30">已保存</span>
              )}
            </div>
          </div>
        </div>

        {/* 时间线下拉 */}
        <div className="h-3" />
        <TimelineDropdown />
      </div>

      {/* 日记正文 */}
      <div className="flex-1 flex justify-center items-center px-8 pb-20">
        <Card
          variant="diary"
          className="w-full max-w-[1000px] h-[600px]"
        >
          <textarea
            className="w-full h-full bg-transparent resize-none font-zhuque text-xl text-black/80 placeholder:text-black/30 focus:outline-none p-4"
            placeholder="在此记录今日点滴..."
            value={content}
            onChange={(e) => updateContent(e.target.value)}
          />
        </Card>
      </div>

      {/* 日省按钮 */}
      <div className="absolute right-20 bottom-16">
        <button
          className="w-[100px] h-[60px] bg-[#E65C5C] rounded-full flex items-center justify-center hover:bg-[#d14545] transition-colors shadow-lg"
          onClick={handleRixing}
        >
          <span className="font-zhuque text-xl text-white">日省</span>
        </button>
      </div>

      {/* XP 结算浮窗 */}
      {xpToast && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className="pointer-events-auto bg-[#2C3532] rounded-2xl px-8 py-6 shadow-2xl animate-in fade-in zoom-in duration-300"
            onClick={() => setXpToast(null)}
          >
            <p className="font-zhuque text-xl text-white/90 text-center mb-4 tracking-widest">
              日省完成
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-3">
              {xpToast.skill_xps.map((s) => {
                const color = SKILL_COLORS[s.skill_id]?.hex ?? '#999';
                return (
                  <div
                    key={s.skill_id}
                    className="rounded-full px-4 py-1.5 flex items-center gap-2"
                    style={{ backgroundColor: `${color}30` }}
                  >
                    <span className="font-zhuque text-sm" style={{ color }}>{s.skill_name}</span>
                    <span className="font-zhuque text-sm text-white/80">+{s.xp}</span>
                  </div>
                );
              })}
            </div>
            <p className="font-zhuque text-sm text-white/40 text-center">
              共获得 {xpToast.xp_earned} XP · 点击关闭
            </p>
          </div>
        </div>
      )}

      {/* 左下角提灯按钮 - 点击打开 AI 日记 */}
      <button
        onClick={toggleAiPanel}
        className="absolute bottom-6 left-6 z-30 w-16 h-16 rounded-full bg-[#1E2A3A] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-lg"
        title="AI 日记"
      >
        <div className="w-11 h-11">
          <LanternSvg />
        </div>
      </button>

      {/* AI 日记弹窗 */}
      <MascotModal
        show={showAiPanel}
        onClose={toggleAiPanel}
        title="提灯的日记"
      >
        <div className="mb-2">
          <span className="font-zhuque text-sm opacity-50">{currentDate}</span>
        </div>
        {aiExists ? (
          <div className="font-zhuque text-lg leading-relaxed whitespace-pre-wrap">
            {aiContent}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E6D9B8] flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <p className="font-zhuque text-lg opacity-50 mb-2">今日暂无旁白</p>
            <p className="font-zhuque text-sm opacity-40">点击「日省」，让提灯为你写一段今天的旁白</p>
          </div>
        )}
      </MascotModal>
    </PageContainer>
  );
}
