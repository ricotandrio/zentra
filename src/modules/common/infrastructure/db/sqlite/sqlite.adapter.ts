import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

import {
  DatabaseConnection,
  QueryExecutor,
} from '@/modules/common/application/ports/db';

export class SQLiteAdapter implements DatabaseConnection, QueryExecutor {
  private readonly db: Database.Database;

  constructor() {
    const dbPath =
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), 'data', 'zentra.db');

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    this.db = new Database(dbPath);

    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tickers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL UNIQUE,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async query<T extends Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> {
    const statement = this.db.prepare(sql);

    return statement.all(...params) as T[];
  }

  async execute(
    sql: string,
    params: unknown[] = []
  ): Promise<void> {
    this.db.prepare(sql).run(...params);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
