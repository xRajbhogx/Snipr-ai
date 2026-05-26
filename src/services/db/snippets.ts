// All CRUD functions (createSnippet, getAll, etc.)
import db from './client'
import { Snippet } from '@/types' // Assumes you have an alias for src or we use relative path. Actually let's use relative path to be safe.
// Let's use relative path `../types`

import type { Snippet as SnippetType } from '../../types'

export type CreateSnippetParams = {
  title: string;
  code: string;
  language: string;
  tags?: string;
  description?: string;
  file_path?: string;
  screenshot_path?: string;
  ai_summary?: string;
};

export function createSnippet(params: CreateSnippetParams) {
  const { title, code, language, tags, description, file_path, screenshot_path, ai_summary } = params;
  
  const result = db.runSync(
    `INSERT INTO snippets (title, code, language, tags, description, file_path, screenshot_path, ai_summary) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, code, language, tags || null, description || null, file_path || null, screenshot_path || null, ai_summary || null]
  );
  
  return result.lastInsertRowId;
}


export function getAllSnippets(language?: string): SnippetType[] {
  if (language) {
    return db.getAllSync(`SELECT * FROM snippets WHERE language = ? ORDER BY created_at DESC`, [language]) as SnippetType[];
  }
  return db.getAllSync(`SELECT * FROM snippets ORDER BY created_at DESC`) as SnippetType[];
}


export function getSnippetById(id: number): SnippetType | null {
  const result = db.getFirstSync(`SELECT * FROM snippets WHERE id = ?`, [id]);
  return (result as SnippetType) || null;
}


export type UpdateSnippetParams = CreateSnippetParams & { id: number };


export function updateSnippet(params: UpdateSnippetParams) {
  const { id, title, code, language, tags, description, file_path, screenshot_path, ai_summary } = params;
  db.runSync(
    `UPDATE snippets SET 
      title=?, code=?, language=?, tags=?, description=?, 
      file_path=?, screenshot_path=?, ai_summary=?, updated_at=unixepoch() 
     WHERE id=?`,
    [title, code, language, tags || null, description || null, file_path || null, screenshot_path || null, ai_summary || null, id]
  );
}


export function updateSnippetAiSummary(id: number, summary: string) {
  db.runSync(
    `UPDATE snippets SET ai_summary=?, updated_at=unixepoch() WHERE id=?`,
    [summary, id]
  );
}


export function deleteSnippet(id: number) {
  db.runSync(`DELETE FROM snippets WHERE id = ?`, [id]);
}


export function toggleFavorite(id: number, current: number) {
  db.runSync(`UPDATE snippets SET favorite=? WHERE id=?`, [current ? 0 : 1, id]);
}


export function getFavorites(): SnippetType[] {
  return db.getAllSync(`SELECT * FROM snippets WHERE favorite = 1 ORDER BY created_at DESC`) as SnippetType[];
}


export function searchSnippets(query: string): SnippetType[] {
  const q = `%${query}%`;
  return db.getAllSync(
    `SELECT * FROM snippets WHERE 
      title LIKE ? OR 
      tags LIKE ? OR 
      language LIKE ? OR 
      code LIKE ? OR 
      ai_summary LIKE ? OR
      description LIKE ?
     ORDER BY created_at DESC`,
    [q, q, q, q, q, q]
  ) as SnippetType[];
}