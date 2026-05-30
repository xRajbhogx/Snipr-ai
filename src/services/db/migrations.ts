// CREATE TABLE IF NOT EXISTS statements
// This sets up your database structure.

// This file should be imported and run once when the app starts, to ensure the database is set up before any CRUD operations are performed.

import db from './client'

export function runMigrations() {
  // Alter existing table if columns are missing
  try {
    db.execSync(`ALTER TABLE snippets ADD COLUMN ai_explanation TEXT;`);
  } catch (e) {
    // Ignore if column already exists
  }
  try {
    db.execSync(`ALTER TABLE snippets ADD COLUMN ai_improvement TEXT;`);
  } catch (e) {
    // Ignore if column already exists
  }
  try {
    db.execSync(`ALTER TABLE snippets ADD COLUMN ai_improved_code TEXT;`);
  } catch (e) {
    // Ignore if column already exists
  }

  db.execSync(`
    
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      title TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL,
      language TEXT NOT NULL,

      tags TEXT,

      favorite INTEGER DEFAULT 0,

      file_path TEXT,
      screenshot_path TEXT,

      ai_summary TEXT,
      ai_explanation TEXT,
      ai_improvement TEXT,
      ai_improved_code TEXT,

      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_language
    ON snippets(language);

    CREATE INDEX IF NOT EXISTS idx_favorite
    ON snippets(favorite);

    CREATE INDEX IF NOT EXISTS idx_created_at
    ON snippets(created_at);

    CREATE INDEX IF NOT EXISTS idx_title
    ON snippets(title);

  `)
}