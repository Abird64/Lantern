/** AI 对话收藏 */
export interface AiFavorite {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'conversation';
  conversation_title: string | null;
  message_id: string | null;
  created_at: string;
}
