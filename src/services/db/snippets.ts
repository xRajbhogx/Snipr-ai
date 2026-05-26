// All CRUD functions (createSnippet, getAll, etc.)
import db from './client'

export function createSnippet(
  title: string, code: string, language: string, tags: string
) {
  db.runSync(
    `INSERT INTO snippets (title, code, language, tags) VALUES (?, ?, ?, ?)`,
    [title, code, language, tags]
  )
}

export function getAllSnippets(language?: string) {
  if (language) {
    return db.getAllSync(`SELECT * FROM snippets WHERE language = ? ORDER BY created_at DESC`, [language])
  }
  return db.getAllSync(`SELECT * FROM snippets ORDER BY created_at DESC`)
}

export function getSnippetById(id: number) {
  return db.getFirstSync(`SELECT * FROM snippets WHERE id = ?`, [id])
}

export function updateSnippet(
  id: number, title: string, code: string, language: string, tags: string
) {
  db.runSync(
    `UPDATE snippets SET title=?, code=?, language=?, tags=?, updated_at=unixepoch() WHERE id=?`,
    [title, code, language, tags, id]
  )
}

export function deleteSnippet(id: number) {
  db.runSync(`DELETE FROM snippets WHERE id = ?`, [id])
}

export function toggleFavorite(id: number, current: number) {
  db.runSync(`UPDATE snippets SET favorite=? WHERE id=?`, [current ? 0 : 1, id])
}

export function getFavorites() {
  return db.getAllSync(`SELECT * FROM snippets WHERE favorite = 1 ORDER BY created_at DESC`)
}

export function searchSnippets(query: string) {
  const q = `%${query}%`
  return db.getAllSync(
    `SELECT * FROM snippets WHERE title LIKE ? OR tags LIKE ? OR language LIKE ? ORDER BY created_at DESC`,
    [q, q, q]
  )
}