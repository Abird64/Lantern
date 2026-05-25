import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, Star, Bookmark, ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageContainer, GridBackground } from '@/components/layout';
import { NavBar } from '@/components/ui';
import { ChatView } from '@/components/ai/ChatView';
import { useAiStore } from '@/stores/aiStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { usePageTheme } from '@/hooks/usePageTheme';

export function HomePage() {
  const t = usePageTheme('lantern');
  const [input, setInput] = useState('');
  const [sidebarOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自适应叠加色
  const s = (o: number) => t.isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o})`;

  const {
    conversations,
    currentConversation,
    isSending,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
  } = useAiStore();

  const {
    favorites,
    fetchFavorites,
    toggleFavorite,
    deleteFavorite,
    isFavorited,
  } = useFavoriteStore();

  // 收藏盒：选中的收藏项
  const [selectedFavorite, setSelectedFavorite] = useState<string | null>(null);
  // 收藏盒模式：true 时右侧显示收藏盒替代对话区
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchFavorites();
  }, []);

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

  const selectedFav = favorites.find(f => f.id === selectedFavorite);

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
            <div className="p-3 space-y-2">
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
              <button
                onClick={() => {
                  setShowFavorites(true);
                  setSelectedFavorite(null);
                  fetchFavorites();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: s(0.05), color: s(0.6) }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = s(0.1); e.currentTarget.style.color = s(0.8); }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = s(0.05); e.currentTarget.style.color = s(0.6); }}
              >
                <Bookmark size={16} />
                收藏盒
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
                    onClick={async (e) => {
                      e.stopPropagation();
                      const msgId = `conv_${conv.id}`;
                      const favorited = isFavorited(msgId);
                      if (favorited) {
                        await toggleFavorite('', 'conversation', msgId, conv.title);
                      } else {
                        // 获取对话所有消息，构建收藏内容
                        try {
                          const msgs = await import('@/services/aiService').then(m =>
                            m.listMessages(conv.id)
                          );
                          const content = msgs
                            .filter((m: { role: string; content: string | null }) => m.content)
                            .map((m: { role: string; content: string | null }) =>
                              `**${m.role === 'user' ? '你' : '提灯'}**：${m.content}`
                            )
                            .join('\n\n');
                          await toggleFavorite(content || conv.title, 'conversation', msgId, conv.title);
                        } catch {
                          await toggleFavorite(conv.title, 'conversation', msgId, conv.title);
                        }
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity mr-0.5"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#E8B959'; e.currentTarget.style.backgroundColor = s(0.08); }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = s(0.3); e.currentTarget.style.backgroundColor = 'transparent'; }}
                    style={{ color: isFavorited(`conv_${conv.id}`) ? '#E8B959' : s(0.3) }}
                    title={isFavorited(`conv_${conv.id}`) ? '取消收藏' : '收藏对话'}
                  >
                    <Star size={12} fill={isFavorited(`conv_${conv.id}`) ? '#E8B959' : 'none'} />
                  </button>
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
        )}{/* end sidebar */}

        {/* 中间 - 对话区 / 收藏盒 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ====== 收藏详情 ====== */}
          {showFavorites && selectedFav && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-6 py-3 flex items-center gap-3 border-b" style={{ borderColor: s(0.08) }}>
                <button
                  onClick={() => setSelectedFavorite(null)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: s(0.4) }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = s(0.08); e.currentTarget.style.color = s(0.7); }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = s(0.4); }}
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="flex-1 min-w-0">
                  {selectedFav.conversation_title
                    ? <span className="text-sm truncate block" style={{ color: s(0.6) }}>{selectedFav.conversation_title}</span>
                    : null}
                </div>
                <button
                  onClick={() => setShowFavorites(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: s(0.3) }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = s(0.08); e.currentTarget.style.color = s(0.6); }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = s(0.3); }}
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-[700px] mx-auto">
                  <div className="chat-bubble px-4 py-3 rounded-2xl text-sm leading-relaxed" style={{ backgroundColor: s(0.05), color: s(0.8) }}>
                    {selectedFav.role === 'conversation' ? (
                      <Markdown remarkPlugins={[remarkGfm]}>{selectedFav.content}</Markdown>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: selectedFav.role === 'user' ? `${t.accent}25` : s(0.08), color: selectedFav.role === 'user' ? t.accent : s(0.35) }}>
                            {selectedFav.role === 'user' ? '你' : '提灯'}
                          </span>
                          <span className="text-[10px]" style={{ color: s(0.2) }}>
                            {new Date(selectedFav.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Markdown remarkPlugins={[remarkGfm]}>{selectedFav.content}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}{/* end 收藏详情 */}

          {/* ====== 收藏列表 ====== */}
          {showFavorites && !selectedFav && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between border-b" style={{ borderColor: s(0.08) }}>
                <h3 className="text-sm font-medium" style={{ color: s(0.8) }}>收藏盒</h3>
                <button
                  onClick={() => setShowFavorites(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: s(0.3) }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = s(0.08); e.currentTarget.style.color = s(0.6); }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = s(0.3); }}
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full" style={{ color: s(0.3) }}>
                    <Bookmark size={40} className="mb-4 opacity-30" />
                    <p className="text-sm">还没有收藏</p>
                    <p className="text-xs mt-1" style={{ color: s(0.2) }}>hover 任意消息点击星标即可收藏</p>
                  </div>
                ) : (
                  <div className="max-w-[700px] mx-auto px-8 py-6 space-y-2">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        onClick={() => setSelectedFavorite(fav.id)}
                        className="group rounded-xl p-3 cursor-pointer transition-colors"
                        style={{ backgroundColor: s(0.03) }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = s(0.06); }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = s(0.03); }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {fav.conversation_title && (
                              <div className="text-xs mb-1 truncate" style={{ color: s(0.3) }}>
                                {fav.conversation_title}
                              </div>
                            )}
                            <div className="text-sm leading-relaxed line-clamp-3" style={{ color: s(0.65) }}>
                              {fav.content.slice(0, 250)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteFavorite(fav.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded flex-shrink-0 transition-opacity"
                            style={{ color: s(0.25) }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#C83C3C'; e.currentTarget.style.backgroundColor = s(0.08); }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = s(0.25); e.currentTarget.style.backgroundColor = 'transparent'; }}
                            title="删除"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: fav.role === 'user' ? `${t.accent}25` : fav.role === 'conversation' ? s(0.06) : s(0.08),
                              color: fav.role === 'user' ? t.accent : s(0.35),
                            }}
                          >
                            {fav.role === 'user' ? '你' : fav.role === 'conversation' ? '对话' : '提灯'}
                          </span>
                          <span className="text-[10px]" style={{ color: s(0.2) }}>
                            {new Date(fav.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}{/* end 收藏列表 */}

          {/* 正常对话视图 */}
          {!showFavorites && (
            <ChatView
              s={s}
              t={t}
              input={input}
              setInput={setInput}
              inputRef={inputRef}
              messagesEndRef={messagesEndRef}
              handleSend={handleSend}
              handleKeyDown={handleKeyDown}
            />
          )}{/* end 正常对话视图 */}
        </div>{/* end 中间 - 对话区 */}
      </div>{/* end 主内容区 */}
    </PageContainer>
  );
}
