import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, MessageSquare, Copy, StopCircle, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageContainer, GridBackground } from '@/components/layout';
import { LanternSvg, NavBar } from '@/components/ui';
import { ToolCallCard } from '@/components/ai/ToolCallCard';
import { useAiStore } from '@/stores/aiStore';
import { parseToolCalls } from '@/utils/aiParsers';
import { usePageTheme } from '@/hooks/usePageTheme';

async function copyText(text: string | null) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export function HomePage() {
  const t = usePageTheme('lantern');
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自适应叠加色
  const s = (o: number) => t.isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o})`;

  const {
    conversations,
    currentConversation,
    messages,
    isSending,
    isExecuting,
    error,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
    executeToolCalls,
    executeSingleToolCall,
    cancelToolCalls,
    modifyToolCalls,
    clearError,
  } = useAiStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');

    let convId = currentConversation;
    if (!convId) {
      convId = await createConversation(text.slice(0, 20));
    }

    await sendMessage(text);
    inputRef.current?.focus();
  };

  const handleNewConversation = async () => {
    await createConversation();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = useCallback(async (msgId: string, content: string | null) => {
    await copyText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  return (
    <PageContainer className="relative overflow-hidden flex flex-col" bgColor={t.bg}>
      {/* 网格背景 */}
      <GridBackground isDark={t.isDark} lineOpacity={0.05} />

      <NavBar title="拾阶" navColor={t.nav} quote="野径云俱黑，江船火独明" />

      {/* ========== 主内容区 ========== */}
      <div className="relative z-10 flex-1 flex overflow-hidden">

        {/* 左侧 - 对话列表 */}
        {sidebarOpen && (
          <div className="w-[240px] flex-shrink-0 border-r flex flex-col" style={{ borderColor: s(0.1) }}>
            <div className="p-3">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: s(0.08), color: s(0.8) }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = s(0.15))}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = s(0.08))}
              >
                <Plus size={16} />
                新对话
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: currentConversation === conv.id ? s(0.15) : 'transparent',
                    color: currentConversation === conv.id ? s(0.9) : s(0.6),
                  }}
                  onMouseEnter={(e) => {
                    if (currentConversation !== conv.id)
                      e.currentTarget.style.backgroundColor = s(0.08);
                  }}
                  onMouseLeave={(e) => {
                    if (currentConversation !== conv.id)
                      e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <MessageSquare size={14} className="flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = s(0.1))}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 中间 - 对话区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {!currentConversation || messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="relative w-[200px] h-[240px] flex items-center justify-center mb-6">
                  <div
                    className="absolute inset-0 blur-3xl opacity-40 rounded-full scale-110"
                    style={{ backgroundColor: `${t.accent}33` }}
                  />
                  <LanternSvg accentColor={t.accent} isDark={t.isDark} />
                </div>
                <p style={{ color: s(0.35) }} className="text-lg font-light">提灯在等你说话呢</p>
              </div>
            ) : (
              <div className="max-w-[700px] mx-auto space-y-4">
                {messages.map((msg, i) => {
                  const toolCalls = parseToolCalls(msg.tool_calls);
                  const hasAiReplyAfter = messages.slice(i + 1).some(
                    (m) => m.role === 'assistant' && m.content,
                  );

                  const isUser = msg.role === 'user';
                  const isTool = msg.role === 'tool';

                  return (
                    <div key={msg.id}>
                      <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[80%]">
                          <div
                            className="chat-bubble px-4 py-3 rounded-2xl text-sm leading-relaxed"
                            style={{
                              backgroundColor: isUser ? `${t.accent}33` : isTool ? s(0.03) : s(0.08),
                              color: isUser ? 'rgba(255,255,255,0.9)' : isTool ? s(0.3) : s(0.8),
                              borderBottomRightRadius: isUser ? '4px' : undefined,
                              borderBottomLeftRadius: !isUser ? '4px' : undefined,
                            }}
                          >
                            {msg.role === 'assistant' && msg.content ? (
                              <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                            ) : isTool ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: s(0.2) }} />
                                {msg.content}
                              </div>
                            ) : (
                              msg.content || ''
                            )}
                          </div>

                          {(isUser || msg.role === 'assistant') && msg.content && (
                            <div
                              className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                                isUser ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <button
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors"
                                style={{ color: s(0.25) }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = s(0.6);
                                  e.currentTarget.style.backgroundColor = s(0.08);
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = s(0.25);
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="复制"
                              >
                                {copiedId === msg.id ? (
                                  <Check size={12} style={{ color: t.accent }} />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 工具调用确认卡片 */}
                      {(() => {
                        if (hasAiReplyAfter || toolCalls.length === 0) return null;
                        const pendingCalls = toolCalls.filter((tc) =>
                          !messages.slice(i + 1).some(
                            (m) => m.role === 'tool' && m.tool_call_id === tc.id,
                          )
                        );
                        if (pendingCalls.length === 0) return null;
                        return (
                          <div className="flex justify-start mt-2">
                            <div className="w-[320px] space-y-2">
                              {pendingCalls.length >= 2 && (
                                <button
                                  onClick={() => executeToolCalls(msg.id)}
                                  disabled={isExecuting}
                                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                                  style={{ backgroundColor: s(0.1), color: s(0.7) }}
                                  onMouseEnter={(e) => {
                                    if (!isExecuting) e.currentTarget.style.backgroundColor = s(0.15);
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isExecuting) e.currentTarget.style.backgroundColor = s(0.1);
                                  }}
                                >
                                  全部确认（{pendingCalls.length} 项）
                                </button>
                              )}
                              {toolCalls.map((tc) => {
                                const isThisDone = messages.slice(i + 1).some(
                                  (m) => m.role === 'tool' && m.tool_call_id === tc.id,
                                );
                                if (isThisDone) return null;
                                return (
                                  <ToolCallCard
                                    key={tc.id}
                                    toolCall={tc}
                                    isExecuting={isExecuting}
                                    onConfirm={() => executeSingleToolCall(msg.id, tc.id)}
                                    onCancel={() => cancelToolCalls(msg.id)}
                                    onModify={(feedback) => modifyToolCalls(feedback)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: s(0.08), color: s(0.5), borderBottomLeftRadius: '4px' }}>
                      思考中...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mx-8 mb-2 px-4 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400/60 hover:text-red-400">
                &times;
              </button>
            </div>
          )}

          {/* 底部输入区 */}
          <div className="px-8 pb-8 pt-4 flex-shrink-0">
            <div className="flex items-end justify-center max-w-[600px] mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isSending ? '等待回复中...' : '说点什么...'}
                disabled={isSending}
                className="flex-1 h-[52px] bg-transparent text-lg font-light px-2 disabled:opacity-50 focus:outline-none transition-colors"
                style={{
                  borderBottom: `1px solid ${s(0.25)}`,
                  color: s(0.8),
                }}
              />
              {isSending ? (
                <button
                  onClick={stopGeneration}
                  className="h-[44px] px-5 rounded-full font-medium text-sm transition-all flex-shrink-0 ml-4 flex items-center gap-2 bg-red-500/15 text-red-400 hover:bg-red-500/25"
                >
                  <StopCircle size={16} />
                  中断
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-[44px] px-7 rounded-full font-medium text-base transition-all flex-shrink-0 ml-4"
                  style={{
                    backgroundColor: input.trim() ? s(0.15) : s(0.08),
                    color: input.trim() ? s(0.9) : s(0.4),
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (input.trim()) e.currentTarget.style.backgroundColor = s(0.25);
                  }}
                  onMouseLeave={(e) => {
                    if (input.trim()) e.currentTarget.style.backgroundColor = s(0.15);
                  }}
                >
                  发送
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
