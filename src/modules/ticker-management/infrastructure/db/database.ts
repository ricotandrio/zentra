import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function initDatabase(): Database.Database {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'zentra.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

export function closeDatabase(db: Database.Database): void {
  db.close();
}
