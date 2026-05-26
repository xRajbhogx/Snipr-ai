// CREATE TABLE IF NOT EXISTS statements
// This sets up your database structure.

// This file should be imported and run once when the app starts, to ensure the database is set up before any CRUD operations are performed.
import db from './client'

export function runMigrations() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      code       TEXT NOT NULL,
      language   TEXT,
      tags       TEXT,
      favorite   INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );
  `)
}