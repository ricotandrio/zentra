import Database from 'better-sqlite3';
import { Ticker } from '@/modules/ticker-management/domain/entities/ticker.entity';
import { ITickerRepository } from '@/modules/ticker-management/domain/repositories/ticker.repository';

export class SqliteTickerRepository implements ITickerRepository {
  constructor(private db: Database.Database) {}

  async add(ticker: Ticker): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO tickers (symbol, added_at)
        VALUES (?, ?)
      `);

      stmt.run(ticker.symbol, ticker.addedAt.toISOString());
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        // eslint-disable-next-line preserve-caught-error
        throw new Error(`Ticker ${ticker.symbol} already exists`);
      }
      throw error;
    }
  }

  async get(symbol: string): Promise<Ticker | null> {
    const stmt = this.db.prepare('SELECT symbol, added_at FROM tickers WHERE symbol = ?');
    const row = stmt.get(symbol) as { symbol: string; added_at: string } | undefined;

    if (!row) {
      return null;
    }

    return new Ticker(row.symbol, new Date(row.added_at));
  }

  async getAll(): Promise<Ticker[]> {
    const stmt = this.db.prepare('SELECT symbol, added_at FROM tickers ORDER BY added_at DESC');
    const rows = stmt.all() as Array<{ symbol: string; added_at: string }>;

    return rows.map(
      (row) => new Ticker(row.symbol, new Date(row.added_at))
    );
  }
  
  async remove(symbol: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM tickers WHERE symbol = ?');
    stmt.run(symbol);
  }
}
