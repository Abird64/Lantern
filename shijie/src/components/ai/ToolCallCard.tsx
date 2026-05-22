import { useState } from 'react';
import { Check, X, Clock, Tag, Trash2, Loader2, CircleCheck, Search, List, Send, Pencil } from 'lucide-react';
import type { ToolCallDef } from '@/types/ai';
import { parseCreateTaskArgs, parseQueryArgs, parseSearchArgs, PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS } from '@/types/ai';

interface ToolCallCardProps {
  toolCall: ToolCallDef;
  isExecuting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onModify?: (feedback: string) => void;
}

export function ToolCallCard(props: ToolCallCardProps) {
  const { toolCall } = props;

  switch (toolCall.function.name) {
    case 'create_task':
      return <CreateTaskCard {...props} />;
    case 'complete_task':
      return <CompleteTaskCard {...props} />;
    case 'delete_task':
      return <DeleteTaskCard {...props} />;
    case 'search_tasks':
      return <SearchTaskCard {...props} />;
    default:
      return (
        <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs">
          未知操作: {toolCall.function.name}
        </div>
      );
  }
}

// ========== 创建任务 ==========

function CreateTaskCard({ toolCall, isExecuting, onConfirm, onCancel, onModify }: ToolCallCardProps) {
  const params = parseCreateTaskArgs(toolCall);
  const [modifyMode, setModifyMode] = useState(false);

  return (
    <div className="mt-2 rounded-xl bg-[#1E2A1E]/60 border border-[#58A968]/30 overflow-hidden">
      <CardHeader icon={<Check size={12} />} color="#58A968" title="创建任务" />
      <div className="px-4 py-3 space-y-2.5">
        <div>
          <span className="text-white/80 text-sm font-medium">{params.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {params.priority && params.priority !== 'none' && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[params.priority]}`}>
              {PRIORITY_LABELS[params.priority]}
            </span>
          )}
          {params.deadline && (
            <span className="inline-flex items-center gap-1 text-xs text-white/40">
              <Clock size={11} />
              {formatDate(params.deadline)}
            </span>
          )}
          {params.estimated_minutes && (
            <span className="text-xs text-white/40">~{formatMinutes(params.estimated_minutes)}</span>
          )}
        </div>
        {params.tags && (
          <div className="flex items-center gap-1.5">
            <Tag size={11} className="text-white/30" />
            <div className="flex flex-wrap gap-1">
              {parseTags(params.tags).map((tag, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/8 text-white/40">{tag}</span>
              ))}
            </div>
          </div>
        )}
        {params.description && (
          <p className="text-xs text-white/40 leading-relaxed">{params.description}</p>
        )}
      </div>
      {modifyMode ? (
        <CardModifyInput onSubmit={(text) => { onModify?.(text); setModifyMode(false); }} onBack={() => setModifyMode(false)} />
      ) : (
        <CardActions
          isExecuting={isExecuting}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onModifyClick={onModify ? () => setModifyMode(true) : undefined}
          confirmLabel="确认"
          confirmColor="#58A968"
          borderColor="#58A968/20"
        />
      )}
    </div>
  );
}

// ========== 完成任务 ==========

function CompleteTaskCard({ toolCall, isExecuting, onConfirm, onCancel, onModify }: ToolCallCardProps) {
  const params = parseQueryArgs(toolCall);
  const [modifyMode, setModifyMode] = useState(false);

  return (
    <div className="mt-2 rounded-xl bg-[#232C1E]/60 border border-[#7CB342]/30 overflow-hidden">
      <CardHeader icon={<CircleCheck size={12} />} color="#7CB342" title="完成任务" />
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">搜索关键词：</span>
          <span className="text-white/80 text-sm font-medium">"{params.query}"</span>
        </div>
        <p className="text-xs text-white/30">
          将搜索匹配的待办任务并标记为完成
        </p>
      </div>
      {modifyMode ? (
        <CardModifyInput onSubmit={(text) => { onModify?.(text); setModifyMode(false); }} onBack={() => setModifyMode(false)} />
      ) : (
        <CardActions
          isExecuting={isExecuting}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onModifyClick={onModify ? () => setModifyMode(true) : undefined}
          confirmLabel="确认完成"
          confirmColor="#7CB342"
          borderColor="#7CB342/20"
        />
      )}
    </div>
  );
}

// ========== 删除任务 ==========

function DeleteTaskCard({ toolCall, isExecuting, onConfirm, onCancel, onModify }: ToolCallCardProps) {
  const params = parseQueryArgs(toolCall);
  const [modifyMode, setModifyMode] = useState(false);

  return (
    <div className="mt-2 rounded-xl bg-[#2A1E1E]/60 border border-red-500/30 overflow-hidden">
      <CardHeader icon={<Trash2 size={12} />} color="#E65C5C" title="删除任务" />
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">搜索关键词：</span>
          <span className="text-white/80 text-sm font-medium">"{params.query}"</span>
        </div>
        <p className="text-xs text-red-400/60">此操作不可撤销，请确认任务名称匹配</p>
      </div>
      {modifyMode ? (
        <CardModifyInput onSubmit={(text) => { onModify?.(text); setModifyMode(false); }} onBack={() => setModifyMode(false)} />
      ) : (
        <CardActions
          isExecuting={isExecuting}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onModifyClick={onModify ? () => setModifyMode(true) : undefined}
          confirmLabel="确认删除"
          confirmColor="#E65C5C"
          borderColor="red-500/20"
        />
      )}
    </div>
  );
}

// ========== 搜索/查看任务 ==========

function SearchTaskCard({ toolCall, isExecuting, onConfirm, onCancel, onModify }: ToolCallCardProps) {
  const params = parseSearchArgs(toolCall);
  const hasQuery = params.query && params.query.trim().length > 0;
  const hasStatus = params.status && params.status.length > 0;
  const [modifyMode, setModifyMode] = useState(false);

  return (
    <div className="mt-2 rounded-xl bg-[#1E2432]/60 border border-[#6B9BD2]/30 overflow-hidden">
      <CardHeader icon={<Search size={12} />} color="#6B9BD2" title="查看任务" />
      <div className="px-4 py-3 space-y-2">
        {/* 搜索条件 */}
        <div className="flex flex-wrap items-center gap-2">
          {hasQuery ? (
            <span className="text-white/80 text-sm font-medium">"{params.query}"</span>
          ) : (
            <span className="text-white/50 text-sm">列出所有任务</span>
          )}
          {hasStatus && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#6B9BD2]/15 text-[#6B9BD2]">
              {STATUS_LABELS[params.status!] || params.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          {hasQuery ? (
            <>
              <Search size={11} />
              按标题/描述/备注搜索
            </>
          ) : (
            <>
              <List size={11} />
              返回全部任务，按状态排序
            </>
          )}
        </div>
      </div>
      {modifyMode ? (
        <CardModifyInput onSubmit={(text) => { onModify?.(text); setModifyMode(false); }} onBack={() => setModifyMode(false)} />
      ) : (
        <CardActions
          isExecuting={isExecuting}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onModifyClick={onModify ? () => setModifyMode(true) : undefined}
          confirmLabel="查看"
          confirmColor="#6B9BD2"
          borderColor="#6B9BD2/20"
        />
      )}
    </div>
  );
}

// ========== 通用子组件 ==========

function CardHeader({ icon, color, title }: { icon: React.ReactNode; color: string; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5" style={{ backgroundColor: `${color}10` }}>
      <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <span className="text-sm font-medium" style={{ color }}>{title}</span>
    </div>
  );
}

function CardActions({
  isExecuting, onConfirm, onCancel, onModifyClick, confirmLabel, confirmColor, borderColor,
}: {
  isExecuting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onModifyClick?: () => void;
  confirmLabel: string;
  confirmColor: string;
  borderColor: string;
}) {
  return (
    <div className="flex border-t" style={{ borderColor: `rgba(255,255,255,0.06)` }}>
      <button
        onClick={onConfirm}
        disabled={isExecuting}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
        style={{ color: confirmColor }}
      >
        {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {confirmLabel}
      </button>
      {onModifyClick && (
        <>
          <div className="w-px" style={{ backgroundColor: `rgba(255,255,255,0.06)` }} />
          <button
            onClick={onModifyClick}
            disabled={isExecuting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-amber-400/80 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <Pencil size={14} />
            修改
          </button>
        </>
      )}
      <div className="w-px" style={{ backgroundColor: `rgba(255,255,255,0.06)` }} />
      <button
        onClick={onCancel}
        disabled={isExecuting}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white/40 hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        <X size={14} />
        取消
      </button>
    </div>
  );
}

function CardModifyInput({ onSubmit, onBack }: { onSubmit: (text: string) => void; onBack: () => void }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  return (
    <div className="border-t border-white/5 px-4 py-3 space-y-2.5">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="补充你的意见，让 AI 重新生成..."
        autoFocus
        className="w-full bg-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:bg-white/12 transition-colors"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-xs hover:bg-amber-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={12} />
          发送
        </button>
        <button
          onClick={() => { setText(''); onBack(); }}
          className="px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors"
        >
          返回
        </button>
      </div>
    </div>
  );
}

// ========== 工具函数 ==========

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
    if (iso.includes('T')) {
      return `${dateStr} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return dateStr;
  } catch {
    return iso;
  }
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

function parseTags(tagsStr: string): string[] {
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
