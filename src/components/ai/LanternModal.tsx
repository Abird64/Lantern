import { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAiStore } from '@/stores/aiStore';
import { usePageTheme } from '@/hooks/usePageTheme';
import { parseToolCalls } from '@/utils/aiParsers';
import { BUILTIN_PROMPTS } from '@/utils/builtinPrompts';
import type { PromptTemplate } from '@/utils/builtinPrompts';
import { PromptPouch } from './PromptPouch';
import { ToolCallCard } from './ToolCallCard';

interface LanternModalProps {
  show: boolean;
  onClose: () => void;
}

function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function LanternModal({ show, onClose }: LanternModalProps) {
  const t = usePageTheme('lantern');
  const [input, setInput] = useState('');
  const [customPrompts, setCustomPrompts] = useState<PromptTemplate[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isSending,
    isExecuting,
    currentConversation,
    sendMessage,
    executeToolCalls,
    executeSingleToolCall,
    cancelToolCalls,
    modifyToolCalls,
    createConversation,
  } = useAiStore();

  useEffect(() => {
    if (show && !currentConversation) {
      createConversation();
    }
  }, [show, currentConversation, createConversation]);

  useEffect(() => {
    if (show) {
      setTimeout(() => inputRef.current?.focus(), 150);
      loadCustomPrompts();
    }
  }, [show]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCustomPrompts = () => {
    try {
      const raw = localStorage.getItem('lantern_custom_prompts');
      if (raw) setCustomPrompts(JSON.parse(raw));
    } catch { /* ignore */ }
  };

  const allPrompts = [...BUILTIN_PROMPTS, ...customPrompts];

  const recentMessages = getRecentMessages(messages);

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isSending) return;
    setInput('');

    if (!currentConversation) {
      await createConversation(content.slice(0, 20));
    }
    await sendMessage(content);
  };

  const handlePromptSelect = (prompt: PromptTemplate) => {
    handleSend(prompt.prompt);
  };

  if (!show) return null;

  // 根据卡片自身明暗派生气泡色（而非页面背景）
  const cardIsDark = isDarkColor(t.card);
  const bubbleUserBg = t.accent + '33';
  const bubbleAiBg = cardIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inputBg = cardIsDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const dividerColor = cardIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const titleColor = t.cardText;
  const dimColor = cardIsDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  const placeholderColor = cardIsDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const userTextColor = t.cardText;
  const aiTextColor = cardIsDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)';
  const toolTextColor = cardIsDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const inputTextColor = cardIsDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)';
  const closeBtnHover = cardIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  const closeBtnColor = cardIsDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start pl-6 pb-24">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 弹窗：窄高比例 */}
      <div
        className="relative w-full max-w-[370px] rounded-3xl shadow-2xl flex flex-col mx-4 animate-in slide-in-from-bottom-4 duration-300 max-h-[82vh]"
        style={{ backgroundColor: t.card }}
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${dividerColor}` }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: t.accent }} />
            <h2 className="text-base font-zhuque" style={{ color: titleColor }}>提灯</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ color: closeBtnColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = closeBtnHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* 锦囊区 */}
        {allPrompts.length > 0 && (
          <div className="px-4 pt-3 flex-shrink-0">
            <PromptPouch
              prompts={allPrompts}
              onSelect={handlePromptSelect}
              accentColor={t.accent}
              textColor={t.cardText}
            />
          </div>
        )}

        {/* 对话区 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[60px] max-h-[320px]">
          {recentMessages.length === 0 && !isSending && (
            <p className="text-sm text-center py-4" style={{ color: dimColor }}>
              点上方锦囊或输入内容开始对话
            </p>
          )}

          {recentMessages.map((msg, i) => {
            const toolCalls = parseToolCalls(msg.tool_calls);
            const hasAiReplyAfter = recentMessages.slice(i + 1).some(
              (m) => m.role === 'assistant' && m.content,
            );

            return (
              <div key={msg.id}>
                {/* 消息气泡 */}
                {msg.content && (
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-br-md'
                          : msg.role === 'tool'
                            ? 'rounded-bl-md text-xs italic'
                            : 'rounded-bl-md'
                      }`}
                      style={{
                        backgroundColor: msg.role === 'user' ? bubbleUserBg
                          : msg.role === 'tool' ? 'transparent'
                          : bubbleAiBg,
                        color: msg.role === 'tool' ? toolTextColor
                          : msg.role === 'user' ? userTextColor
                          : aiTextColor,
                      }}
                    >
                      {msg.role === 'assistant' ? (
                        <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                )}

                {/* 工具调用卡片 */}
                {!hasAiReplyAfter && toolCalls.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {toolCalls.map((tc) => {
                      const isDone = recentMessages.slice(i + 1).some(
                        (m) => m.role === 'tool' && m.tool_call_id === tc.id,
                      );
                      if (isDone) return null;
                      return (
                        <ToolCallCard
                          key={tc.id}
                          toolCall={tc}
                          isExecuting={isExecuting}
                          onConfirm={() => executeSingleToolCall(msg.id, tc.id)}
                          onCancel={() => cancelToolCalls(msg.id, tc.id)}
                          onModify={(feedback) => modifyToolCalls(feedback, msg.id, tc.id)}
                        />
                      );
                    })}
                    {/* 全部确认按钮 */}
                    {toolCalls.filter((tc) => !recentMessages.slice(i + 1).some(
                      (m) => m.role === 'tool' && m.tool_call_id === tc.id,
                    )).length >= 2 && (
                      <button
                        onClick={() => executeToolCalls(msg.id)}
                        disabled={isExecuting}
                        className="w-full py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: cardIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                          color: cardIsDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = cardIsDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = cardIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
                        }}
                      >
                        全部确认
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex justify-start">
              <div
                className="px-4 py-2 rounded-2xl rounded-bl-md text-sm"
                style={{ backgroundColor: bubbleAiBg, color: cardIsDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
              >
                思考中...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <div
            className="flex items-center gap-2 rounded-2xl px-3.5 py-2"
            style={{ backgroundColor: inputBg }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入内容，或点上方锦囊..."
              disabled={isSending}
              className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
              style={{ color: inputTextColor }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0"
              style={{
                backgroundColor: input.trim() && !isSending ? t.accent : 'transparent',
                color: input.trim() && !isSending ? '#fff' : placeholderColor,
                opacity: input.trim() && !isSending ? 1 : 0.5,
              }}
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 取最近一轮对话：从最后一条用户消息开始 */
function getRecentMessages(messages: AiMessage[]): AiMessage[] {
  if (messages.length === 0) return [];
  let startIdx = messages.length - 1;
  for (; startIdx >= 0; startIdx--) {
    if (messages[startIdx].role === 'user') break;
  }
  if (startIdx < 0) return [];
  return messages.slice(startIdx);
}

import type { AiMessage } from '@/types/ai';
