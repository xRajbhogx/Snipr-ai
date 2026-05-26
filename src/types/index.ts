export interface Snippet {
  id: number;
  title: string;
  description?: string | null;
  code: string;
  language: string;
  tags?: string | null;
  favorite: number; // SQLite uses 0 or 1 for booleans
  file_path?: string | null;
  screenshot_path?: string | null;
  ai_summary?: string | null;
  created_at: number;
  updated_at: number;
}
