import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, MessageSquare, Copy, StopCircle, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import { HeaderButton, PageContainer, WindowControls } from '@/components/layout';
import { LanternSvg } from '@/components/ui';
import { ToolCallCard } from '@/components/ai/ToolCallCard';
import { useAiStore } from '@/stores/aiStore';
import { parseToolCalls } from '@/types/ai';

/** 复制文字到剪贴板 */
async function copyText(text: string | null) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback: execCommand
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
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    cancelToolCalls,
    modifyToolCalls,
    clearError,
  } = useAiStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');

    // 如果没有当前对话，先创建
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
    <PageContainer className="bg-[#1a1a1a] relative overflow-hidden flex flex-col">
      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ========== 顶部标题栏 ========== */}
      <div
        data-tauri-drag-region
        className="relative z-10 h-[72px] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 flex-shrink-0 -mx-4 md:-mx-6 lg:-mx-8"
      >
        <HeaderButton title="助手" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
          野径云俱黑，江船火独明
        </h1>
        <WindowControls />
      </div>

      {/* ========== 主内容区 ========== */}
      <div className="relative z-10 flex-1 flex overflow-hidden">

        {/* 左侧 - 对话列表 */}
        {sidebarOpen && (
          <div className="w-[240px] flex-shrink-0 border-r border-white/10 flex flex-col">
            <div className="p-3">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/8 hover:bg-white/15 text-white/80 text-sm transition-colors"
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
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    currentConversation === conv.id
                      ? 'bg-white/15 text-white'
                      : 'hover:bg-white/8 text-white/60'
                  }`}
                >
                  <MessageSquare size={14} className="flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
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
              /* 空状态 - 提灯 */
              <div className="h-full flex flex-col items-center justify-center">
                <div className="relative w-[200px] h-[240px] flex items-center justify-center mb-6">
                  <div className="absolute inset-0 blur-3xl opacity-40 bg-blue-400/20 rounded-full scale-110" />
                  <LanternSvg />
                </div>
                <p className="text-white/35 text-lg font-light">提灯在等你说话呢</p>
              </div>
            ) : (
              /* 消息气泡 */
              <div className="max-w-[700px] mx-auto space-y-4">
                {messages.map((msg, i) => {
                  const toolCalls = parseToolCalls(msg.tool_calls);
                  // 只给"最后一个有工具调用的 AI 消息"显示确认卡片
                  const showCard =
                    toolCalls.length > 0 &&
                    !messages.slice(i + 1).some(
                      (m) => m.role === 'tool' || m.role === 'assistant',
                    );

                  const isUser = msg.role === 'user';
                  const isTool = msg.role === 'tool';

                  return (
                    <div
                      key={msg.id}
                      className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[80%]">
                        {/* 气泡 */}
                        <div
                          className={`chat-bubble px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? 'bg-[#58A968]/20 text-white/90 rounded-br-md whitespace-pre-wrap'
                              : isTool
                                ? 'bg-white/3 text-white/30 rounded-bl-md text-xs italic'
                                : 'bg-white/8 text-white/80 rounded-bl-md markdown-body'
                          }`}
                        >
                          {msg.role === 'assistant' && msg.content ? (
                            <Markdown>{msg.content}</Markdown>
                          ) : isTool ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-white/20" />
                              {msg.content}
                            </div>
                          ) : (
                            msg.content || ''
                          )}

                          {/* 工具调用确认卡片 */}
                          {showCard && (
                            <div className="mt-2">
                              {toolCalls.map((tc) => (
                                <ToolCallCard
                                  key={tc.id}
                                  toolCall={tc}
                                  isExecuting={isExecuting}
                                  onConfirm={() => executeToolCalls(msg.id)}
                                  onCancel={() => cancelToolCalls(msg.id)}
                                  onModify={(feedback) => modifyToolCalls(feedback)}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 操作栏：hover 时显示在气泡下方 */}
                        {(isUser || msg.role === 'assistant') && msg.content && (
                          <div
                            className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                              isUser ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white/25 hover:text-white/60 hover:bg-white/8 transition-colors"
                              title="复制"
                            >
                              {copiedId === msg.id ? (
                                <Check size={12} className="text-[#58A968]" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-white/8 text-white/50 px-4 py-3 rounded-2xl rounded-bl-md text-sm">
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
                className="flex-1 h-[52px] bg-transparent border-b border-white/25 text-white/80 text-lg font-light placeholder:text-white/20 focus:outline-none focus:border-[#58A968]/60 transition-colors px-2 disabled:opacity-50"
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
                  className={`h-[44px] px-7 rounded-full font-medium text-base transition-all flex-shrink-0 ml-4 ${
                    input.trim()
                      ? 'bg-white/15 text-white/90 hover:bg-white/25'
                      : 'bg-white/8 text-white/40 cursor-not-allowed'
                  }`}
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
