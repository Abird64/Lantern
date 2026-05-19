import { Card } from '@/components/ui';
import { HeaderButton, PageContainer, WindowControls } from '@/components/layout';

export function DiaryPage() {
  return (
    <PageContainer className="bg-[#F7F3E9] relative">
      {/* 顶部导航栏 */}
      <div className="h-[72px] bg-[#2C3532] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 -mx-4 md:-mx-6 lg:-mx-8">
        <HeaderButton title="尘笺" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
          人闲桂花落，夜景春山空
        </h1>
        {/* 右侧 - 窗口控制按钮 */}
        <WindowControls />
      </div>

      {/* 顶部间隔 */}
      <div className="h-6" />
      
      {/* 日期选择器 - 居中容器 */}
      <div className="flex justify-center px-8">
        <div className="max-w-[1000px] flex-1">
          <div className="flex items-center gap-4">
            <div className="min-w-[200px] py-4 bg-[#E6D9B8] rounded-full px-10 flex items-center justify-center">
              <span className="font-zhuque text-xl text-black">2026-03-23 周一</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 中间间隔 */}
      <div className="h-6" />

      {/* 日记内容区 - 居中显示 */}
      <div className="flex justify-center px-8 pb-20">
        <Card
          variant="diary"
          className="w-full max-w-[1000px] h-[600px]"
        >
          <textarea
            className="w-full h-full bg-transparent resize-none font-zhuque text-xl text-black/80 placeholder:text-black/30 focus:outline-none p-4"
            placeholder="在此记录今日点滴..."
          />
        </Card>
      </div>

      {/* 日省按钮 */}
      <div className="absolute right-20 bottom-16">
        <button className="w-[100px] h-[60px] bg-[#E65C5C] rounded-full flex items-center justify-center hover:bg-[#d14545] transition-colors shadow-lg">
          <span className="font-zhuque text-xl text-white">日省</span>
        </button>
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 pointer-events-none">
        <img
          src="/assets/CodeBuddyAssets/47_57/13.png"
          alt="装饰"
          className="w-[117px] h-[136px]"
        />
      </div>
    </PageContainer>
  );
}
