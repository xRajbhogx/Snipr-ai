// All CRUD functions (createSnippet, getAll, etc.)
import db from './client'
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


export function deleteAllSnippets() {
  db.runSync(`DELETE FROM snippets`);
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


export function getDashboardStats() {
  try {
    const snippets = db.getFirstSync(`SELECT COUNT(*) as count FROM snippets`) as { count: number } | null;
    const favorites = db.getFirstSync(`SELECT COUNT(*) as count FROM snippets WHERE favorite = 1`) as { count: number } | null;
    const files = db.getFirstSync(`SELECT COUNT(*) as count FROM snippets WHERE file_path IS NOT NULL`) as { count: number } | null;
    const screenshots = db.getFirstSync(`SELECT COUNT(*) as count FROM snippets WHERE screenshot_path IS NOT NULL`) as { count: number } | null;

    return {
      snippets: snippets?.count || 0,
      favorites: favorites?.count || 0,
      files: files?.count || 0,
      screenshots: screenshots?.count || 0,
      downloads: 0,
      trash: 0,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      snippets: 0,
      favorites: 0,
      files: 0,
      screenshots: 0,
      downloads: 0,
      trash: 0,
    };
  }
}

export function seedDemoSnippets() {
  const demos = [
    {
      title: "Flexbox Centering Wrapper",
      description: "Standard React Native style helper to center child components vertically and horizontally.",
      language: "TypeScript",
      code: `import React from 'react';
import { StyleSheet, View } from 'react-native';

export const CenteredContainer = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});`,
      tags: "react-native,layout,flexbox",
      ai_summary: "A layout wrapper component for React Native that centers content using flexbox properties."
    },
    {
      title: "FastAPI Boilerplate Route",
      description: "Basic GET endpoint boilerplate for FastAPI with metadata description.",
      language: "Python",
      code: `from fastapi import FastAPI

app = FastAPI(title="Snipr API")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "offline_first": True,
        "features": ["speed", "portability"]
    }`,
      tags: "fastapi,python,backend,api",
      ai_summary: "FastAPI initialization code with a root path mapping returning a JSON dictionary status response."
    },
    {
      title: "Debounce Function Helper",
      description: "Limits the rate at which a function can fire. Highly useful for search inputs and scroll listeners.",
      language: "TypeScript",
      code: `export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}`,
      tags: "utils,performance,debounce,typescript",
      ai_summary: "TypeScript implementation of debounce utility to throttle function executions using setTimeout."
    }
  ];

  try {
    for (const demo of demos) {
      db.runSync(
        `INSERT INTO snippets (title, code, language, tags, description, ai_summary) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [demo.title, demo.code, demo.language, demo.tags, demo.description, demo.ai_summary]
      );
    }
  } catch (error) {
    console.error("Failed to seed demo snippets:", error);
  }
}