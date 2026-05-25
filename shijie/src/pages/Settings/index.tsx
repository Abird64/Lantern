import { useEffect, useState } from 'react';
import { Card, ThemeCard, NavBar } from '@/components/ui';
import { useWeightsStore, type Weights } from '@/stores/weightsStore';
import { useSettingStore } from '@/stores/settingStore';
import { useThemeStore } from '@/stores/themeStore';
import { ThemeEditor } from '@/components/settings/ThemeEditor';
import type { PageTheme } from '@/styles/theme';
import { usePageTheme } from '@/hooks/usePageTheme';
import { PageContainer } from '@/components/layout';
import { BUILTIN_PROMPTS } from '@/utils/builtinPrompts';
import { selectableThemes } from '@/styles/theme';
import type { PromptTemplate } from '@/utils/builtinPrompts';
import { Plus, Pencil, Trash2, X, Check, Lock, Palette, Download, AlertTriangle } from 'lucide-react';
import * as scheduleService from '@/services/scheduleService';
import { invoke } from '@tauri-apps/api/core';

const weightLabels: Record<keyof Weights, string> = {
  urgency: '紧急度',
  value: '价值',
  cost: '成本（速赢）',
};

const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', defaultUrl: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic', defaultUrl: 'https://api.anthropic.com' },
  { id: 'deepseek', name: 'DeepSeek', defaultUrl: 'https://api.deepseek.com' },
  { id: 'ollama', name: 'Ollama', defaultUrl: 'http://localhost:11434' },
];

const DANGER = '#E65C5C';
const DANGER_DIM = '#E65C5C20';

interface SettingsStyles {
  card: string;
  cardBorder: string;
  text: string;
  textSub: string;
  accent: string;
  accentDim: string;
  danger: string;
  dangerDim: string;
  inputBg: string;
  inputBorder: string;
  overlay: (opacity: number) => string;
}

function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function makeStyles(t: typeof themes.settings): SettingsStyles {
  const cardIsDark = isDarkColor(t.card);
  const overlay = (opacity: number) =>
    cardIsDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
  return {
    card: t.card,
    cardBorder: cardIsDark ? '#333' : '#DDD',
    text: t.cardText,
    textSub: `${t.cardText}99`,
    accent: t.accent,
    accentDim: t.accentLight,
    danger: DANGER,
    dangerDim: DANGER_DIM,
    inputBg: cardIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    inputBorder: cardIsDark ? '#444' : '#CCC',
    overlay,
  };
}

export function SettingsPage() {
  const t = usePageTheme('settings');
  const themeStore = useThemeStore();
  const s = makeStyles(t);
  const weights = useWeightsStore();
  const settings = useSettingStore();

  // 自定义主题
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [editingTheme, setEditingTheme] = useState<PageTheme | null>(null);

  // 导出对话框
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportCategory, setExportCategory] = useState('all');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // 清除数据对话框
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearCategories, setClearCategories] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 自定义锦囊
  const [customPrompts, setCustomPrompts] = useState<PromptTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', prompt: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', prompt: '' });

  const handleExport = async () => {
    try {
      const category = exportCategory === 'all' ? undefined : exportCategory;
      const icsContent = await scheduleService.exportIcsEvents(category);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const catSuffix = category ? `_${category}` : '';
      a.download = `schedule_export${catSuffix}_${new Date().toISOString().slice(0, 10)}.ics`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage('导出成功，文件已保存到下载文件夹');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err) {
      setExportMessage('导出失败：' + String(err));
      setTimeout(() => setExportMessage(null), 4000);
    }
  };

  const handleClear = async () => {
    if (clearCategories.size === 0) return;
    try {
      const cats = Array.from(clearCategories);
      const msg: string = await invoke('clear_data', { categories: cats });
      setClearCategories(new Set());
      setShowClearDialog(false);
      settings.loadAll();
      setToast({ message: msg, type: 'success' });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setShowClearDialog(false);
      setToast({ message: '清除失败：' + String(err), type: 'error' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const clearOptions = [
    { id: 'tasks', label: '任务', description: '所有任务、子任务及关联数据' },
    { id: 'schedules', label: '日程', description: '所有日程安排' },
    { id: 'contacts', label: '人脉', description: '所有联系人及联系方式' },
    { id: 'journals', label: '日记', description: '用户自己写的日记正文（.md 文件）' },
    { id: 'ai_diary', label: 'AI日省', description: 'AI 生成的日省反思和尘笺' },
    { id: 'skills', label: '技能', description: '所有属性和经验记录' },
    { id: 'ai_conversations', label: 'AI对话', description: '所有提灯对话历史' },
    { id: 'settings', label: '设置', description: '所有自定义设置和配置' },
  ];

  useEffect(() => {
    settings.loadAll();
  }, []);

  useEffect(() => {
    loadCustomPrompts();
  }, []);

  const get = (key: string, fallback = '') => settings.get(key, fallback);
  const set = (key: string, value: string) => settings.set(key, value);

  const loadCustomPrompts = () => {
    try {
      const raw = localStorage.getItem('lantern_custom_prompts');
      if (raw) setCustomPrompts(JSON.parse(raw));
    } catch { /* ignore */ }
  };

  const persistCustomPrompts = (prompts: PromptTemplate[]) => {
    localStorage.setItem('lantern_custom_prompts', JSON.stringify(prompts));
    setCustomPrompts(prompts);
  };

  const handleDeleteCustom = (id: string) => {
    persistCustomPrompts(customPrompts.filter((p) => p.id !== id));
  };

  const handleStartEdit = (p: PromptTemplate) => {
    setEditingId(p.id);
    setEditForm({ title: p.title, prompt: p.prompt });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    persistCustomPrompts(
      customPrompts.map((p) =>
        p.id === editingId ? { ...p, title: editForm.title, prompt: editForm.prompt } : p,
      ),
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!addForm.title.trim() || !addForm.prompt.trim()) return;
    const nextOrder = customPrompts.length > 0
      ? Math.max(...customPrompts.map((p) => p.sort_order)) + 1
      : 1;
    const newPrompt: PromptTemplate = {
      id: `custom_${Date.now()}`,
      title: addForm.title.trim(),
      prompt: addForm.prompt.trim(),
      builtin: false,
      sort_order: nextOrder,
    };
    persistCustomPrompts([...customPrompts, newPrompt]);
    setAddForm({ title: '', prompt: '' });
    setIsAdding(false);
  };

  return (
    <PageContainer className="relative flex flex-col" bgColor={t.bg}>
      <NavBar title="设置" navColor={t.nav} quote="静水流深，智者无言" />

      {/* ========== 主内容 ========== */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 pt-6 pb-8">
        <div className="w-full max-w-[800px] space-y-5">

          {/* ===== 主题设置 ===== */}
          <Section title="主题设置" styles={s}>
            <div className="flex flex-wrap gap-4 items-start">
              <ColorfulCard
                isSelected={themeStore.mode === 'colorful'}
                onClick={() => themeStore.setMode('colorful')}
              />
              {[...selectableThemes, ...themeStore.customThemes].map((theme) => {
                const isCustom = theme.id.startsWith('custom_');
                return (
                  <div key={theme.id} className="relative group">
                    <ThemeCard
                      theme={theme}
                      isSelected={themeStore.mode === 'uniform' && themeStore.uniformTheme === theme.id}
                      onClick={() => themeStore.setUniformTheme(theme.id)}
                    />
                    {isCustom && (
                      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingTheme(theme); setShowThemeEditor(true); }}
                          className="w-5 h-5 rounded-full flex items-center justify-center shadow"
                          style={{ backgroundColor: s.accent }}
                          title="编辑"
                        >
                          <Pencil size={10} className="text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); themeStore.deleteCustomTheme(theme.id); }}
                          className="w-5 h-5 rounded-full flex items-center justify-center shadow"
                          style={{ backgroundColor: s.danger }}
                          title="删除"
                        >
                          <Trash2 size={10} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* 新建主题 */}
              <button
                onClick={() => { setEditingTheme(null); setShowThemeEditor(true); }}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors hover:opacity-80"
                style={{
                  width: 140,
                  height: 88,
                  borderColor: s.inputBorder,
                  color: s.textSub,
                }}
              >
                <Plus size={20} />
                <span className="text-xs mt-1 font-zhuque">新建主题</span>
              </button>
            </div>
          </Section>

          {/* ===== 通知设置 ===== */}
          <Section title="通知设置" styles={s}>
            <ToggleRow
              label="任务提醒"
              checked={get('notification.task_reminder') === 'true'}
              onChange={(v) => set('notification.task_reminder', String(v))}
              styles={s}
            />
            <ToggleRow
              label="关系维护提醒"
              checked={get('notification.contact_reminder') === 'true'}
              onChange={(v) => set('notification.contact_reminder', String(v))}
              styles={s}
            />
          </Section>

          {/* ===== 任务推荐权重 ===== */}
          <Section title="任务推荐权重" styles={s}>
            <p className="text-sm mb-4" style={{ color: s.textSub }}>
              系统根据这三个维度加权评分推荐最优任务
            </p>
            {(['urgency', 'value', 'cost'] as const).map((key) => (
              <SliderRow
                key={key}
                label={weightLabels[key]}
                value={Math.round(weights[key] * 100)}
                onChange={(v) => weights.setWeights({ [key]: v / 100 })}
                styles={s}
              />
            ))}
          </Section>

          {/* ===== AI 助手设置 ===== */}
          <Section title="AI 助手设置" styles={s}>
            {/* Provider 选择 */}
            <div className="mb-4">
              <label className="text-sm mb-1.5 block" style={{ color: s.textSub }}>AI 服务提供商</label>
              <select
                value={get('ai.provider', 'deepseek')}
                onChange={(e) => {
                  const p = AI_PROVIDERS.find(p => p.id === e.target.value);
                  set('ai.provider', e.target.value);
                  if (p) set('ai.api_url', p.defaultUrl);
                }}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                style={{
                  backgroundColor: s.inputBg,
                  border: `1px solid ${s.inputBorder}`,
                  color: s.text,
                }}
              >
                {AI_PROVIDERS.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    style={{ backgroundColor: t.card, color: t.cardText }}
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* API 地址 */}
            <InputRow
              label="API 地址"
              value={get('ai.api_url')}
              placeholder="https://api.deepseek.com"
              onChange={(v) => set('ai.api_url', v)}
              styles={s}
            />

            {/* API Key */}
            <InputRow
              label="API Key"
              value={get('ai.api_key')}
              type="password"
              placeholder="sk-..."
              onChange={(v) => set('ai.api_key', v)}
              styles={s}
            />

            {/* 模型名称 */}
            <InputRow
              label="模型名称"
              value={get('ai.model', 'deepseek-v4-flash')}
              placeholder="deepseek-v4-flash"
              onChange={(v) => set('ai.model', v)}
              styles={s}
            />

          </Section>

          {/* ===== 锦囊管理 ===== */}
          <Section title="锦囊管理" styles={s}>
            <p className="text-sm mb-4" style={{ color: s.textSub }}>
              自定义提灯弹窗中的快捷提示词（锦囊），点击即可自动发送
            </p>

            {/* 内置锦囊（只读） */}
            <div className="mb-5">
              <h4 className="text-xs mb-2 flex items-center gap-1.5" style={{ color: s.textSub }}>
                <Lock size={11} /> 系统内置
              </h4>
              <div className="space-y-1.5">
                {BUILTIN_PROMPTS.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: s.overlay(0.04), border: `1px solid ${s.cardBorder}` }}
                  >
                    <span className="text-sm w-20 flex-shrink-0" style={{ color: s.overlay(0.35) }}>{p.title}</span>
                    <span className="text-xs truncate" style={{ color: s.overlay(0.18) }}>{p.prompt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 自定义锦囊 */}
            <div>
              <h4 className="text-xs mb-2" style={{ color: s.textSub }}>我的锦囊</h4>
              {customPrompts.length === 0 && !isAdding ? (
                <p className="text-xs mb-3" style={{ color: s.overlay(0.18) }}>暂无自定义锦囊</p>
              ) : (
                <div className="space-y-1.5 mb-3">
                  {customPrompts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: s.inputBg, border: `1px solid ${s.inputBorder}` }}
                    >
                      {editingId === p.id ? (
                        /* 编辑模式 */
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="标题"
                            className="w-full px-2 py-1 rounded text-sm outline-none"
                            style={{ backgroundColor: t.card, border: `1px solid ${s.inputBorder}`, color: t.cardText }}
                          />
                          <textarea
                            value={editForm.prompt}
                            onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                            placeholder="提示词内容"
                            rows={2}
                            className="w-full px-2 py-1 rounded text-sm outline-none resize-none"
                            style={{ backgroundColor: t.card, border: `1px solid ${s.inputBorder}`, color: t.cardText }}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                              style={{ backgroundColor: s.accentDim, color: s.accent }}
                            >
                              <Check size={12} /> 保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                              style={{ backgroundColor: 'transparent', color: s.textSub }}
                            >
                              <X size={12} /> 取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 显示模式 */
                        <>
                          <span className="text-sm w-20 flex-shrink-0" style={{ color: s.text }}>{p.title}</span>
                          <span className="text-xs truncate flex-1" style={{ color: s.overlay(0.3) }}>{p.prompt}</span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                              style={{ color: s.overlay(0.3) }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = s.overlay(0.1))}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustom(p.id)}
                              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                              style={{ color: s.overlay(0.3) }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = s.overlay(0.1))}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 添加表单 */}
              {isAdding ? (
                <div
                  className="px-3 py-3 rounded-lg space-y-2"
                  style={{ backgroundColor: s.inputBg, border: `1px solid ${t.accent}` }}
                >
                  <input
                    type="text"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    placeholder="锦囊标题"
                    className="w-full px-2 py-1 rounded text-sm outline-none"
                    style={{ backgroundColor: t.card, border: `1px solid ${s.inputBorder}`, color: t.cardText }}
                  />
                  <textarea
                    value={addForm.prompt}
                    onChange={(e) => setAddForm({ ...addForm, prompt: e.target.value })}
                    placeholder="提示词内容（发送给 AI 的完整提示）"
                    rows={2}
                    className="w-full px-2 py-1 rounded text-sm outline-none resize-none"
                    style={{ backgroundColor: t.card, border: `1px solid ${s.inputBorder}`, color: t.cardText }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={!addForm.title.trim() || !addForm.prompt.trim()}
                      className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors disabled:opacity-40"
                      style={{ backgroundColor: t.accent, color: '#fff' }}
                    >
                      <Check size={12} /> 添加
                    </button>
                    <button
                      onClick={() => { setIsAdding(false); setAddForm({ title: '', prompt: '' }); }}
                      className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                      style={{ backgroundColor: 'transparent', color: s.textSub }}
                    >
                      <X size={12} /> 取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ backgroundColor: s.inputBg, color: t.accent, border: `1px dashed ${t.accent}40` }}
                >
                  <Plus size={14} /> 添加锦囊
                </button>
              )}
            </div>
          </Section>

          {/* ===== 数据管理 ===== */}
          <Section title="数据管理" styles={s}>
            <button
              onClick={() => setShowExportDialog(true)}
              className="w-full py-3 px-4 rounded-xl text-lg transition-colors"
              style={{ backgroundColor: s.accentDim, color: s.accent }}
            >
              导出数据
            </button>
            <button
              onClick={() => { setClearCategories(new Set()); setShowClearDialog(true); }}
              className="w-full py-3 px-4 rounded-xl text-lg transition-colors"
              style={{ backgroundColor: DANGER_DIM, color: DANGER }}
            >
              清除数据
            </button>
          </Section>

          {/* 版本信息 */}
          <div className="text-center pt-6 pb-4">
            <span className="text-sm" style={{ color: s.textSub }}>拾阶 v0.1</span>
          </div>
        </div>
      </div>
      {/* ===== 主题编辑器弹窗 ===== */}
      {showThemeEditor && (
        <ThemeEditor
          existing={editingTheme}
          styles={s}
          onSave={(theme) => {
            if (editingTheme) {
              themeStore.updateCustomTheme(editingTheme.id, theme);
            } else {
              themeStore.addCustomTheme(theme);
            }
            setShowThemeEditor(false);
            setEditingTheme(null);
          }}
          onCancel={() => { setShowThemeEditor(false); setEditingTheme(null); }}
        />
      )}

      {/* ===== 导出对话框 ===== */}
      {showExportDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowExportDialog(false)}
        >
          <div
            className="rounded-[28px] p-6 w-[420px] shadow-2xl"
            style={{ backgroundColor: t.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium mb-5 tracking-wider" style={{ color: t.cardText }}>
              导出数据
            </h2>

            <div className="space-y-4">
              {/* 导出日程 */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: s.overlay(0.04), border: `1px solid ${s.cardBorder}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Download size={16} style={{ color: s.accent }} />
                  <span className="text-sm font-medium" style={{ color: s.text }}>导出日程</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs" style={{ color: s.textSub }}>分类：</span>
                  <select
                    value={exportCategory}
                    onChange={(e) => setExportCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: s.inputBg,
                      border: `1px solid ${s.inputBorder}`,
                      color: s.text,
                    }}
                  >
                    <option value="all" style={{ backgroundColor: t.card, color: t.cardText }}>全部日程</option>
                    <option value="课表" style={{ backgroundColor: t.card, color: t.cardText }}>课表</option>
                    <option value="学习" style={{ backgroundColor: t.card, color: t.cardText }}>学习</option>
                    <option value="娱乐" style={{ backgroundColor: t.card, color: t.cardText }}>娱乐</option>
                    <option value="工作" style={{ backgroundColor: t.card, color: t.cardText }}>工作</option>
                    <option value="生活" style={{ backgroundColor: t.card, color: t.cardText }}>生活</option>
                  </select>
                </div>
                <button
                  onClick={handleExport}
                  className="w-full py-2 rounded-lg text-sm transition-colors"
                  style={{ backgroundColor: s.accentDim, color: s.accent }}
                >
                  导出 ICS 文件
                </button>
              </div>

              {/* 导出任务（预留） */}
              <div
                className="rounded-xl p-4 opacity-50"
                style={{ backgroundColor: s.overlay(0.04), border: `1px solid ${s.cardBorder}` }}
              >
                <div className="flex items-center gap-2">
                  <Download size={16} style={{ color: s.textSub }} />
                  <span className="text-sm font-medium" style={{ color: s.text }}>导出任务</span>
                  <span className="text-xs ml-auto" style={{ color: s.textSub }}>即将推出</span>
                </div>
              </div>

              {/* 导出人脉（预留） */}
              <div
                className="rounded-xl p-4 opacity-50"
                style={{ backgroundColor: s.overlay(0.04), border: `1px solid ${s.cardBorder}` }}
              >
                <div className="flex items-center gap-2">
                  <Download size={16} style={{ color: s.textSub }} />
                  <span className="text-sm font-medium" style={{ color: s.text }}>导出人脉</span>
                  <span className="text-xs ml-auto" style={{ color: s.textSub }}>即将推出</span>
                </div>
              </div>
            </div>

            {/* 导出结果提示 */}
            {exportMessage && (
              <div
                className="mt-4 px-4 py-2 rounded-full text-sm text-center"
                style={{
                  backgroundColor: exportMessage.startsWith('导出成功') ? s.accentDim : DANGER_DIM,
                  color: exportMessage.startsWith('导出成功') ? s.accent : DANGER,
                }}
              >
                {exportMessage}
              </div>
            )}

            {/* 关闭按钮 */}
            <button
              onClick={() => setShowExportDialog(false)}
              className="w-full mt-4 py-2 rounded-full text-sm transition-colors"
              style={{ color: s.textSub }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* ===== 清除数据对话框 ===== */}
      {showClearDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowClearDialog(false)}
        >
          <div
            className="rounded-[24px] p-5 w-[380px] max-h-[85vh] flex flex-col shadow-2xl"
            style={{ backgroundColor: t.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-1 flex-shrink-0">
              <AlertTriangle size={16} style={{ color: DANGER }} />
              <h2 className="text-base font-medium tracking-wider" style={{ color: t.cardText }}>
                清除数据
              </h2>
            </div>
            <p className="text-xs mb-3 flex-shrink-0" style={{ color: s.textSub }}>
              选择要清除的数据类型。此操作不可撤销，建议先导出备份。
            </p>

            <div className="space-y-1.5 mb-4 overflow-y-auto flex-1" style={{ maxHeight: 280 }}>
              {clearOptions.map((opt) => {
                const isSelected = clearCategories.has(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected ? DANGER_DIM : s.overlay(0.04),
                      border: `1px solid ${isSelected ? DANGER : s.cardBorder}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setClearCategories((prev) => {
                          const next = new Set(prev);
                          if (next.has(opt.id)) next.delete(opt.id); else next.add(opt.id);
                          return next;
                        });
                      }}
                      className="mt-0.5 flex-shrink-0"
                      style={{ accentColor: DANGER }}
                    />
                    <div>
                      <div className="text-sm font-medium" style={{ color: isSelected ? DANGER : s.text }}>{opt.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: s.textSub }}>{opt.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowClearDialog(false)}
                className="flex-1 py-2 rounded-full text-sm transition-colors"
                style={{ color: s.textSub }}
              >
                取消
              </button>
              <button
                onClick={handleClear}
                disabled={clearCategories.size === 0}
                className="flex-1 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-30"
                style={{
                  backgroundColor: clearCategories.size > 0 ? DANGER : DANGER_DIM,
                  color: clearCategories.size > 0 ? '#fff' : DANGER,
                }}
              >
                {clearCategories.size > 0
                  ? `确认清除（${clearCategories.size} 项）`
                  : '请选择要清除的数据'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toast 提示 ===== */}
      {toast && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        >
          <div
            className="px-5 py-3 rounded-full text-sm shadow-lg"
            style={{
              backgroundColor: toast.type === 'success' ? s.accentDim : DANGER_DIM,
              color: toast.type === 'success' ? s.accent : DANGER,
            }}
          >
            {toast.message}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

/* ========== 子组件 ========== */

function Section({ title, children, styles }: { title: string; children: React.ReactNode; styles: SettingsStyles }) {
  return (
    <Card
      className="w-full p-5 rounded-xl"
      style={{ backgroundColor: styles.card, border: `1px solid ${styles.cardBorder}` }}
    >
      <h3 className="text-xl mb-4" style={{ color: styles.text, fontFamily: '"Zhuque Fangsong", serif' }}>
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  );
}

function ToggleRow({ label, checked, onChange, styles, disabled = false }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  styles: SettingsStyles;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-base" style={{ color: styles.textSub }}>{label}</span>
      <button
        onClick={() => !disabled && onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{
          backgroundColor: checked ? styles.accent : styles.overlay(0.2),
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

function SliderRow({ label, value, onChange, styles }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  styles: SettingsStyles;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-base" style={{ color: styles.textSub }}>{label}</span>
        <span className="text-sm" style={{ color: styles.textSub }}>{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          accentColor: styles.accent,
          background: `linear-gradient(to right, ${styles.accent} ${value}%, ${styles.overlay(0.12)} ${value}%)`,
        }}
      />
    </div>
  );
}

function InputRow({ label, value, onChange, styles, type = 'text', placeholder = '' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  styles: SettingsStyles;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm mb-1.5 block" style={{ color: styles.textSub }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ backgroundColor: styles.inputBg, border: `1px solid ${styles.inputBorder}`, color: styles.text }}
      />
    </div>
  );
}

/** 万象彩模式卡片 — 5 个主题 accent 竖条 */
const COLORFUL_ACCENTS = ['#58A968', '#F2C94C', '#E65C5C', '#D98B58', '#8A6DA7'];

function ColorfulCard({ isSelected, onClick }: {
  isSelected: boolean;
  onClick: () => void;
  allThemes?: unknown;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        width: 140,
        border: isSelected ? '2px solid #F2C94C' : '2px solid transparent',
        boxShadow: isSelected ? '0 0 0 2px rgba(242,201,76,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#F2C94C] flex items-center justify-center z-10">
          <Check size={12} strokeWidth={3} className="text-[#1A1A1A]" />
        </div>
      )}

      <div className="flex gap-1 p-3" style={{ height: 52 }}>
        {COLORFUL_ACCENTS.map((color, i) => (
          <div key={i} className="flex-1 rounded-md" style={{ backgroundColor: color }} title={`主题色 ${i + 1}`} />
        ))}
      </div>

      <div className="pb-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Palette size={12} style={{ color: '#F2C94C' }} />
          <span className="text-xs font-zhuque tracking-wider" style={{ color: '#F2C94C' }}>
            万象彩
          </span>
        </div>
      </div>
    </button>
  );
}
