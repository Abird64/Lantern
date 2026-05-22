import { useJournalStore } from '@/stores/journalStore';

export function AiDiaryPanel() {
  const { showAiPanel, toggleAiPanel, aiContent, aiExists, currentDate } =
    useJournalStore();

  if (!showAiPanel) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
        onClick={toggleAiPanel}
      />

      {/* 面板 */}
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-[#F7F3E9] z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* 头部 */}
        <div className="h-[72px] bg-[#2C3532] flex items-center justify-between px-6 border-b border-white/10">
          <h2 className="font-zhuque text-2xl text-white/90 tracking-widest">
            提灯的日记
          </h2>
          <button
            onClick={toggleAiPanel}
            className="text-white/60 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 日期标签 */}
        <div className="px-6 pt-4">
          <span className="font-zhuque text-sm text-black/40">
            {currentDate}
          </span>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {aiExists ? (
            <div className="font-zhuque text-lg text-black/70 leading-relaxed whitespace-pre-wrap">
              {aiContent}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-[#E6D9B8] flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <p className="font-zhuque text-lg text-black/40 mb-2">
                今日暂无旁白
              </p>
              <p className="font-zhuque text-sm text-black/30">
                点击「日省」，让提灯为你写一段今天的旁白
              </p>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
