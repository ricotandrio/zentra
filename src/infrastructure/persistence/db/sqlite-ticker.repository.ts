import Database from 'better-sqlite3';
import { Ticker } from '@/domain/entities/ticker.entity';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';

export class SqliteTickerRepository implements ITickerRepository {
  constructor(private db: Database.Database) {}

  async add(ticker: Ticker): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO tickers (symbol, name, added_at)
        VALUES (?, ?, ?)
      `);

      stmt.run(ticker.symbol, ticker.name, ticker.addedAt.toISOString());
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`Ticker ${ticker.symbol} already exists`, { cause: error });
      }
      throw error;
    }
  }

  async getAll(): Promise<Ticker[]> {
    const stmt = this.db.prepare('SELECT symbol, name, added_at FROM tickers ORDER BY added_at DESC');
    const rows = stmt.all() as Array<{ symbol: string; name: string; added_at: string }>;

    return rows.map(
      (row) => new Ticker(row.symbol, row.name, new Date(row.added_at))
    );
  }

  async exists(symbol: string): Promise<boolean> {
    const stmt = this.db.prepare('SELECT 1 FROM tickers WHERE symbol = ?');
    const result = stmt.get(symbol);

    return !!result;
  }

  async remove(symbol: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM tickers WHERE symbol = ?');
    stmt.run(symbol);
  }
}
