/** AI 对话收藏 */
export interface AiFavorite {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  conversation_title: string | null;
  created_at: string;
}
