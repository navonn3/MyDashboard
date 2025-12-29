/**
 * Database Configuration and Schema
 * Uses better-sqlite3 for synchronous SQLite operations
 */

import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

// Use in-memory database for Railway/cloud environments, file-based for local dev
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProduction ? ':memory:' : path.join(__dirname, '..', 'dashboard.db');
const db: DatabaseType = new Database(dbPath);

console.log(`Database mode: ${isProduction ? 'in-memory' : 'file-based'} at ${dbPath}`);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize all database tables
 */
export function initializeDatabase(): void {
  // Applications table - stores all managed applications
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      github_url TEXT,
      database_url TEXT,
      database_platform TEXT,
      frontend_url TEXT,
      frontend_platform TEXT,
      live_url TEXT,
      build_platform TEXT NOT NULL,
      platform_config TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Application notes - rich text notes for each application
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_notes (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      content TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Application ideas - feature ideas for each application
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_ideas (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    )
  `);

  // Global ideas - new application ideas not tied to existing apps
  db.exec(`
    CREATE TABLE IF NOT EXISTS global_ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      target_platform TEXT,
      complexity TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'idea',
      converted_app_id TEXT REFERENCES applications(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Settings table - stores API keys and user preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      encrypted INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Generated prompts history - tracks all AI-generated prompts
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_prompts (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      ideas_snapshot TEXT,
      generated_prompt TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  console.log('Database initialized successfully');
}

export default db;
