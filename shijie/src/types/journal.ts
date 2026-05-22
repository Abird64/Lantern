export interface Journal {
  id: string;
  title: string;
  summary: string | null;
  file_path: string;
  mood: string | null;
  journal_date: string;
  word_count: number;
  entry_type: 'user' | 'ai';
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  journal: Journal;
  content: string;
}

export interface AiDiary {
  content: string;
  exists: boolean;
}
