import Database from 'better-sqlite3';
import path from 'path';

export function initDatabase(): Database.Database {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), '/data/zentra.db');
  const db = new Database(dbPath);

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      level TEXT NOT NULL,
      message TEXT NOT NULL
    )
  `);

  return db;
}

export function closeDatabase(db: Database.Database): void {
  db.close();
}
