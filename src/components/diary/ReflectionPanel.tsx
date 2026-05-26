import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Sparkles } from 'lucide-react';
import { SKILL_COLORS } from '@/styles/theme';
import { usePageTheme } from '@/hooks/usePageTheme';
import type { CompleteResult } from '@/types/task';
import type { ExtractedContact } from '@/types/journal';
import { ContactSyncCard } from './ContactSyncCard';

function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}


interface ReflectionPanelProps {
  show: boolean;
  date: string;
  xpResult: CompleteResult | null;
  reflection: string;
  contacts: ExtractedContact[];
  onClose: () => void;
  onContactSync: (index: number) => void;
  onContactIgnore: (index: number) => void;
  onConfirmAll: () => void;
}

export function ReflectionPanel({
  show,
  date,
  xpResult,
  reflection,
  contacts,
  onClose,
  onContactSync,
  onContactIgnore,
  onConfirmAll,
}: ReflectionPanelProps) {
  const t = usePageTheme('diary');
  if (!show) return null;

  const hasContacts = contacts.length > 0;
  const hasReflection = !!reflection;

  // 根据面板背景色（nav）动态计算文字颜色
  const navIsDark = isDarkColor(t.nav);
  const TXT = navIsDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const TXT_DIM = navIsDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const TXT_PROSE = navIsDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)';
  const SURFACE_BG = navIsDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const BTN_BG = navIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const BTN_HOVER = navIsDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)';
  const BTN_TEXT = navIsDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  const LABEL_DIM = navIsDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const MUTED = navIsDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const BORDER = navIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 面板 */}
      <div
        className="relative w-full max-w-[640px] max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        style={{ backgroundColor: t.nav }}
      >
        {/* 头部 */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 pt-6 pb-4 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3">
            <Sparkles size={22} style={{ color: t.accent }} />
            <h2 className="text-xl font-zhuque" style={{ color: TXT }}>日省 · {date}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={18} style={{ color: TXT_DIM }} />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-8 py-5 space-y-6">
          {/* ─── XP 结算 ─── */}
          {xpResult && xpResult.skill_xps.length > 0 && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: SURFACE_BG }}>
              <p className="font-zhuque text-sm mb-3 tracking-wider" style={{ color: LABEL_DIM }}>属性成长</p>
              <div className="flex items-center gap-3 flex-wrap">
                {xpResult.skill_xps.map((s) => {
                  const color = SKILL_COLORS[s.skill_id]?.hex ?? '#999';
                  return (
                    <div
                      key={s.skill_id}
                      className="rounded-full px-4 py-2 flex items-center gap-2"
                      style={{ backgroundColor: `${color}25` }}
                    >
                      <span className="font-zhuque text-sm" style={{ color }}>
                        {SKILL_COLORS[s.skill_id]?.name ?? s.skill_name}
                      </span>
                      <span className="font-zhuque text-base font-semibold" style={{ color: TXT }}>
                        +{s.xp}
                      </span>
                    </div>
                  );
                })}
                <span className="font-zhuque text-sm ml-1" style={{ color: MUTED }}>
                  共 {xpResult.xp_earned} XP
                </span>
              </div>
            </div>
          )}

          {/* ─── AI 旁白 ─── */}
          {hasReflection ? (
            <div className="rounded-2xl p-5" style={{ backgroundColor: SURFACE_BG }}>
              <p className="font-zhuque text-sm mb-3 tracking-wider" style={{ color: LABEL_DIM }}>提灯的旁白</p>
              <div
                className={`font-zhuque text-base leading-relaxed prose-sm max-w-none ${navIsDark ? 'prose-invert' : ''}`}
                style={{ color: TXT_PROSE }}
              >
                <Markdown remarkPlugins={[remarkGfm]}>{reflection}</Markdown>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: SURFACE_BG }}>
              <p className="font-zhuque text-base" style={{ color: MUTED }}>旁白生成中或未生成...</p>
            </div>
          )}

          {/* ─── 联系人同步 ─── */}
          {hasContacts && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: SURFACE_BG }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-zhuque text-sm tracking-wider" style={{ color: LABEL_DIM }}>
                  联系人同步 · {contacts.length} 人
                </p>
                <button
                  onClick={onConfirmAll}
                  className="px-4 py-1.5 rounded-full text-sm font-zhuque transition-colors"
                  style={{ backgroundColor: BTN_BG, color: BTN_TEXT }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BTN_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BTN_BG)}
                >
                  一键全部确认
                </button>
              </div>
              <div className="space-y-3">
                {contacts.map((c, i) => (
                  <ContactSyncCard
                    key={`${c.name}-${i}`}
                    contact={c}
                    onSync={() => onContactSync(i)}
                    onIgnore={() => onContactIgnore(i)}
                    dark={navIsDark}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 空状态：无联系人需要同步 */}
          {!hasContacts && hasReflection && (
            <div className="text-center py-2">
              <p className="font-zhuque text-sm" style={{ color: MUTED }}>暂无待处理的联系人信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
