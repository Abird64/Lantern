import { useEffect } from 'react';
import { Card } from '@/components/ui';
import { useWeightsStore, type Weights } from '@/stores/weightsStore';
import { useSettingStore } from '@/stores/settingStore';
import { HeaderButton, PageContainer, WindowControls } from '@/components/layout';

const weightLabels: Record<keyof Weights, string> = {
  urgency: '紧急度',
  value: '价值',
  cost: '成本（速赢）',
};

const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', defaultUrl: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic', defaultUrl: 'https://api.anthropic.com' },
  { id: 'deepseek', name: 'DeepSeek', defaultUrl: 'https://api.deepseek.com/v1' },
  { id: 'ollama', name: 'Ollama', defaultUrl: 'http://localhost:11434' },
];

/** 统一的深色主题色 */
const C = {
  bg: '#1B1A1B',
  nav: '#2D3A32',
  card: '#252525',
  cardBorder: '#333',
  text: '#E8E0D0',
  textSub: '#E8E0D080',
  accent: '#58A968',
  accentDim: '#58A96820',
  danger: '#E65C5C',
  dangerDim: '#E65C5C20',
  inputBg: '#1A1A1A',
  inputBorder: '#444',
};

export function SettingsPage() {
  const weights = useWeightsStore();
  const settings = useSettingStore();

  useEffect(() => {
    settings.loadAll();
  }, []);

  const get = (key: string, fallback = '') => settings.get(key, fallback);
  const set = (key: string, value: string) => settings.set(key, value);

  return (
    <PageContainer className="relative flex flex-col" bgColor={C.bg}>
      {/* ========== 顶部导航栏 ========== */}
      <div
        data-tauri-drag-region
        className="relative z-10 h-[72px] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 flex-shrink-0 -mx-4 md:-mx-6 lg:-mx-8"
        style={{ backgroundColor: C.nav }}
      >
        <HeaderButton title="设置" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
          静水流深，智者无言
        </h1>
        <WindowControls />
      </div>

      {/* ========== 主内容 ========== */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 pt-6 pb-8">
        <div className="w-full max-w-[800px] space-y-5">

          {/* ===== 主题设置 ===== */}
          <Section title="主题设置">
            <div className="flex items-center justify-between">
              <span className="text-base" style={{ color: C.textSub }}>当前主题</span>
              <span className="text-base" style={{ color: C.accent }}>默认深色</span>
            </div>
            <p className="text-xs" style={{ color: C.textSub }}>
              后续将支持多彩主题、自定义配色等，敬请期待
            </p>
          </Section>

          {/* ===== 通知设置 ===== */}
          <Section title="通知设置">
            <ToggleRow
              label="任务提醒"
              checked={get('notification.task_reminder') === 'true'}
              onChange={(v) => set('notification.task_reminder', String(v))}
            />
            <ToggleRow
              label="关系维护提醒"
              checked={get('notification.contact_reminder') === 'true'}
              onChange={(v) => set('notification.contact_reminder', String(v))}
            />
          </Section>

          {/* ===== 任务推荐权重 ===== */}
          <Section title="任务推荐权重">
            <p className="text-sm mb-4" style={{ color: C.textSub }}>
              点击左下角熊猫时，系统根据这三个维度加权评分推荐最优任务
            </p>
            {(['urgency', 'value', 'cost'] as const).map((key) => (
              <SliderRow
                key={key}
                label={weightLabels[key]}
                value={Math.round(weights[key] * 100)}
                onChange={(v) => weights.setWeights({ [key]: v / 100 })}
              />
            ))}
          </Section>

          {/* ===== AI 助手设置 ===== */}
          <Section title="AI 助手设置">
            {/* Provider 选择 */}
            <div className="mb-4">
              <label className="text-sm mb-1.5 block" style={{ color: C.textSub }}>AI 服务提供商</label>
              <select
                value={get('ai.provider', 'deepseek')}
                onChange={(e) => {
                  const p = AI_PROVIDERS.find(p => p.id === e.target.value);
                  set('ai.provider', e.target.value);
                  if (p) set('ai.api_url', p.defaultUrl);
                }}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.text }}
              >
                {AI_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* API 地址 */}
            <InputRow
              label="API 地址"
              value={get('ai.api_url')}
              placeholder="https://api.deepseek.com/v1"
              onChange={(v) => set('ai.api_url', v)}
            />

            {/* API Key */}
            <InputRow
              label="API Key"
              value={get('ai.api_key')}
              type="password"
              placeholder="sk-..."
              onChange={(v) => set('ai.api_key', v)}
            />

            {/* 模型名称 */}
            <InputRow
              label="模型名称"
              value={get('ai.model', 'deepseek-chat')}
              placeholder="deepseek-chat"
              onChange={(v) => set('ai.model', v)}
            />

            {/* 助手性格 */}
            <div>
              <label className="text-sm mb-1.5 block" style={{ color: C.textSub }}>助手性格</label>
              <textarea
                value={get('ai.personality', '你是一个温暖的人生管理助手，名叫提灯。')}
                onChange={(e) => set('ai.personality', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ backgroundColor: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.text }}
              />
            </div>
          </Section>

          {/* ===== 数据管理 ===== */}
          <Section title="数据管理">
            <button
              className="w-full py-3 px-4 rounded-xl text-lg transition-colors"
              style={{ backgroundColor: C.accentDim, color: C.accent }}
            >
              导出数据
            </button>
            <button
              className="w-full py-3 px-4 rounded-xl text-lg transition-colors"
              style={{ backgroundColor: C.dangerDim, color: C.danger }}
            >
              清除数据
            </button>
          </Section>

          {/* 版本信息 */}
          <div className="text-center pt-6 pb-4">
            <span className="text-sm" style={{ color: C.textSub }}>拾阶 v0.1</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

/* ========== 子组件 ========== */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card
      className="w-full p-5 rounded-xl"
      style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}
    >
      <h3 className="text-xl mb-4" style={{ color: C.text, fontFamily: '"Zhuque Fangsong", serif' }}>
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  );
}

function ToggleRow({ label, checked, onChange, disabled = false }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-base" style={{ color: C.textSub }}>{label}</span>
      <button
        onClick={() => !disabled && onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{
          backgroundColor: checked ? C.accent : '#555',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform"
          style={{ left: checked ? '22px' : '2px' }}
        />
      </button>
    </div>
  );
}

function SliderRow({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-base" style={{ color: C.textSub }}>{label}</span>
        <span className="text-sm" style={{ color: C.textSub }}>{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${C.accent} ${value}%, #555 ${value}%)`,
        }}
      />
    </div>
  );
}

function InputRow({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm mb-1.5 block" style={{ color: C.textSub }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ backgroundColor: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.text }}
      />
    </div>
  );
}
