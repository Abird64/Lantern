import { useState } from 'react';
import { X } from 'lucide-react';
import type { PageTheme } from '@/styles/theme';

interface ThemeEditorProps {
  /** 编辑已有主题时传入，新建则为 null */
  existing?: PageTheme | null;
  onSave: (theme: PageTheme) => void;
  onCancel: () => void;
  /** 用于生成文字颜色 */
  styles: {
    card: string;
    cardBorder: string;
    text: string;
    textSub: string;
    accent: string;
    inputBg: string;
    inputBorder: string;
  };
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  styles: ThemeEditorProps['styles'];
}

function ColorField({ label, value, onChange, hint, styles }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-20 text-sm flex-shrink-0" style={{ color: styles.textSub }}>{label}</label>
      <div className="relative flex-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v); }}
          maxLength={7}
          placeholder="#000000"
          className="flex-1 px-3 py-1.5 rounded-lg text-sm focus:outline-none"
          style={{ color: styles.text, backgroundColor: styles.inputBg, border: `1px solid ${styles.inputBorder}` }}
        />
        {hint && <span className="text-xs flex-shrink-0" style={{ color: styles.textSub }}>{hint}</span>}
      </div>
    </div>
  );
}

export function ThemeEditor({ existing, onSave, onCancel, styles }: ThemeEditorProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [bg, setBg] = useState(existing?.bg ?? '#1B1B1B');
  const [nav, setNav] = useState(existing?.nav ?? '#2D3A32');
  const [accent, setAccent] = useState(existing?.accent ?? '#58A968');
  const [text, setText] = useState(existing?.text ?? '#FFFFFF');
  const [card, setCard] = useState(existing?.card ?? '#252525');
  const [cardText, setCardText] = useState(existing?.cardText ?? '#E8E0D0');
  const [isDark, setIsDark] = useState(existing?.isDark ?? true);

  const isValid = name.trim() && /^#[0-9a-fA-F]{6}$/.test(bg) && /^#[0-9a-fA-F]{6}$/.test(nav)
    && /^#[0-9a-fA-F]{6}$/.test(accent) && /^#[0-9a-fA-F]{6}$/.test(text)
    && /^#[0-9a-fA-F]{6}$/.test(card) && /^#[0-9a-fA-F]{6}$/.test(cardText);

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      id: existing?.id ?? `custom_${Date.now()}`,
      name: name.trim(),
      bg,
      nav,
      accent,
      accentLight: accent + (isDark ? '50' : '66'),
      text,
      card,
      cardText,
      isDark,
      danger: isDark ? '#FF5F57' : '#E74C3C',
      warning: '#F2C94C',
      success: accent,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative w-full max-w-[440px] rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: styles.card, border: `1px solid ${styles.cardBorder}` }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-zhuque" style={{ color: styles.text }}>
            {existing ? '编辑主题' : '新建主题'}
          </h3>
          <button onClick={onCancel} className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80"
            style={{ backgroundColor: styles.inputBg }}>
            <X size={14} style={{ color: styles.textSub }} />
          </button>
        </div>

        {/* 预览条 */}
        <div className="flex gap-1 rounded-xl overflow-hidden" style={{ height: 40 }}>
          <div className="flex-1" style={{ backgroundColor: nav }} title="导航栏" />
          <div className="flex-1" style={{ backgroundColor: accent }} title="强调色" />
          <div className="flex-1" style={{ backgroundColor: card }} title="卡片色" />
          <div className="flex-1 flex items-center justify-center text-[10px]" style={{ backgroundColor: card, color: cardText }} title="卡片文字">Aa</div>
          <div className="flex-1" style={{ backgroundColor: bg }} title="页面背景" />
        </div>

        {/* 名称 */}
        <div className="flex items-center gap-3">
          <label className="w-20 text-sm flex-shrink-0" style={{ color: styles.textSub }}>名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：春晓"
            maxLength={8}
            className="flex-1 px-3 py-1.5 rounded-lg text-sm focus:outline-none"
            style={{ color: styles.text, backgroundColor: styles.inputBg, border: `1px solid ${styles.inputBorder}` }}
          />
        </div>

        {/* 颜色字段 */}
        <div className="space-y-3">
          <ColorField label="页面背景" value={bg} onChange={setBg} hint="bg" styles={styles} />
          <ColorField label="导航栏" value={nav} onChange={setNav} hint="nav" styles={styles} />
          <ColorField label="强调色" value={accent} onChange={setAccent} hint="按钮/选中" styles={styles} />
          <ColorField label="页面文字" value={text} onChange={setText} hint="text" styles={styles} />
          <ColorField label="卡片底色" value={card} onChange={setCard} hint="card" styles={styles} />
          <ColorField label="卡片文字" value={cardText} onChange={setCardText} hint="cardText" styles={styles} />
        </div>

        {/* 深色/浅色 */}
        <div className="flex items-center gap-3">
          <label className="w-20 text-sm flex-shrink-0" style={{ color: styles.textSub }}>类型</label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDark(true)}
              className="px-4 py-1.5 rounded-full text-sm transition-all"
              style={{
                backgroundColor: isDark ? styles.accent : styles.inputBg,
                color: isDark ? '#fff' : styles.textSub,
              }}
            >深色</button>
            <button
              onClick={() => setIsDark(false)}
              className="px-4 py-1.5 rounded-full text-sm transition-all"
              style={{
                backgroundColor: !isDark ? styles.accent : styles.inputBg,
                color: !isDark ? '#fff' : styles.textSub,
              }}
            >浅色</button>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full text-sm transition-colors"
            style={{ color: styles.textSub, backgroundColor: styles.inputBg }}
          >取消</button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-full text-sm text-white transition-colors disabled:opacity-30"
            style={{ backgroundColor: styles.accent }}
          >
            {existing ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}
