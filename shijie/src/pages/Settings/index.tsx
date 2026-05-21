import { Card } from '@/components/ui';
import { useUIStore } from '@/stores/uiStore';
import { useWeightsStore, type Weights } from '@/stores/weightsStore';
import { HeaderButton, PageContainer, WindowControls } from '@/components/layout';

const weightLabels: Record<keyof Weights, string> = {
  urgency: '紧急度',
  value: '价值',
  cost: '成本（速赢）',
};

export function SettingsPage() {
  const { activeTab } = useUIStore();
  const weights = useWeightsStore();

  const getBgColor = () => {
    switch (activeTab) {
      case 'tasks': return '#2D3A32';
      case 'schedule': return '#2A2A2A';
      case 'diary': return '#2C3532';
      case 'relations': return '#3A4652';
      default: return '#1B1B1B';
    }
  };

  const getPageBg = () => {
    switch (activeTab) {
      case 'tasks': return '#D0D0D0';
      case 'schedule': return '#953737';
      case 'diary': return '#F7F3E9';
      case 'relations': return '#2D3742';
      default: return '#1B1A1B';
    }
  };

  const getCardBg = () => {
    switch (activeTab) {
      case 'tasks': return '#E0F7FA';
      case 'schedule': return '#F8F5F0';
      case 'diary': return '#E6D9B8';
      case 'relations': return '#3A4652';
      default: return '#333';
    }
  };

  const getTextColor = () => {
    // 深色背景用浅色文字，浅色背景用深色文字
    return activeTab === 'tasks' || activeTab === 'schedule' || activeTab === 'diary' 
      ? 'text-[#1A1A1A]' 
      : 'text-white';
  };

  const getSecondaryTextColor = () => {
    return activeTab === 'tasks' || activeTab === 'schedule' || activeTab === 'diary'
      ? 'text-[#1A1A1A]/70'
      : 'text-white/70';
  };

  return (
    <PageContainer
      className="relative flex flex-col"
      bgColor={getPageBg()}
    >
      {/* ========== 顶部导航栏 ========== */}
      <div
        className="relative z-10 h-[72px] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 flex-shrink-0 -mx-4 md:-mx-6 lg:-mx-8"
        style={{ backgroundColor: getBgColor() }}
      >
        {/* 左上角 */}
        <HeaderButton title="设置" />

        {/* 中央 - 诗句标题 */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
          静水流深，智者无言
        </h1>

        {/* 右侧 - 窗口控制按钮 */}
        <WindowControls />
      </div>

      {/* ========== 主内容居中容器 ========== */}
      <div className="flex-1 flex flex-col items-center px-8">

        {/* 顶部间隔 */}
        <div className="h-6" />

        {/* ========== 设置卡片区 ========== */}
        <div className="w-full max-w-[800px] space-y-6">
          {/* 外观设置 */}
          <Card className="w-full p-6 rounded-2xl" style={{ backgroundColor: getCardBg() }}>
            <h3 className={`font-zhuque text-2xl mb-4 ${getTextColor()}`}>外观设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`font-zhuque text-lg ${getSecondaryTextColor()}`}>深色模式</span>
                <div className="w-12 h-6 bg-[#58A968] rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </Card>

          {/* 通知设置 */}
          <Card className="w-full p-6 rounded-2xl" style={{ backgroundColor: getCardBg() }}>
            <h3 className={`font-zhuque text-2xl mb-4 ${getTextColor()}`}>通知设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`font-zhuque text-lg ${getSecondaryTextColor()}`}>任务提醒</span>
                <div className="w-12 h-6 bg-[#58A968] rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-zhuque text-lg ${getSecondaryTextColor()}`}>关系维护提醒</span>
                <div className="w-12 h-6 bg-[#58A968] rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </Card>

          {/* 任务推荐权重 */}
          <Card className="w-full p-6 rounded-2xl" style={{ backgroundColor: getCardBg() }}>
            <h3 className={`font-zhuque text-2xl mb-4 ${getTextColor()}`}>任务推荐权重</h3>
            <p className={`font-zhuque text-sm mb-4 ${getSecondaryTextColor()}`}>
              点击左下角熊猫时，系统根据这三个维度加权评分推荐最优任务
            </p>
            <div className="space-y-5">
              {(['urgency', 'value', 'cost'] as const).map((key) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-zhuque text-lg ${getSecondaryTextColor()}`}>
                      {weightLabels[key]}
                    </span>
                    <span className={`font-zhuque text-sm ${getSecondaryTextColor()}`}>
                      {Math.round(weights[key] * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(weights[key] * 100)}
                    onChange={(e) => weights.setWeights({ [key]: parseInt(e.target.value) / 100 })}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #58A968 ${Math.round(weights[key] * 100)}%, #ddd ${Math.round(weights[key] * 100)}%)`,
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* 数据管理 */}
          <Card className="w-full p-6 rounded-2xl" style={{ backgroundColor: getCardBg() }}>
            <h3 className={`font-zhuque text-2xl mb-4 ${getTextColor()}`}>数据管理</h3>
            <div className="space-y-4">
              <button className={`w-full py-3 px-4 bg-[#58A968]/20 text-[#58A968] rounded-xl font-zhuque text-lg hover:bg-[#58A968]/30 transition-colors`}>
                导出数据
              </button>
              <button className="w-full py-3 px-4 bg-[#E65C5C]/20 text-[#E65C5C] rounded-xl font-zhuque text-lg hover:bg-[#E65C5C]/30 transition-colors">
                清除数据
              </button>
            </div>
          </Card>

          {/* 版本信息 */}
          <div className="text-center pt-8">
            <span className={`${getSecondaryTextColor()} font-zhuque text-sm`}>拾阶 v0.1</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
