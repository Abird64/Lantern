import { useEffect } from 'react';
import { Card } from '@/components/ui';
import { HeaderButton, PageContainer, WindowControls } from '@/components/layout';
import { TimelineDropdown } from '@/components/diary/TimelineDropdown';
import { AiDiaryPanel } from '@/components/diary/AiDiaryPanel';
import { useJournalStore } from '@/stores/journalStore';

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
    updateContent,
    loadToday,
    saveNow,
    toggleTimeline,
    toggleAiPanel,
  } = useJournalStore();

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

  return (
    <PageContainer className="bg-[#F7F3E9] relative">
      {/* 顶部导航栏 */}
      <div className="h-[72px] bg-[#2C3532] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 -mx-4 md:-mx-6 lg:-mx-8">
        <HeaderButton title="尘笺" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
          人闲桂花落，夜景春山空
        </h1>
        <WindowControls />
      </div>

      {/* 顶部间隔 */}
      <div className="h-6" />

      {/* 日期胶囊 - 可点击打开时间线 */}
      <div className="flex justify-center px-8">
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
      <div className="h-3" />

      {/* 日记内容区 */}
      <div className="flex justify-center px-8 pb-20">
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
          onClick={() => alert('提灯将从任务、日程、日记多维度为你写一段今日旁白（即将上线）')}
        >
          <span className="font-zhuque text-xl text-white">日省</span>
        </button>
      </div>

      {/* 日晷图标 - 点击打开 AI 尘笺 */}
      <div className="absolute bottom-0 left-0 cursor-pointer" onClick={toggleAiPanel}>
        <img
          src="/assets/CodeBuddyAssets/47_57/13.png"
          alt="AI 尘笺"
          className="w-[117px] h-[136px] hover:opacity-80 transition-opacity"
        />
      </div>

      {/* AI 尘笺面板 */}
      <AiDiaryPanel />
    </PageContainer>
  );
}
