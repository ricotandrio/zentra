import { Ticker } from '@/modules/ticker-management/domain/entities/ticker.entity';
import { ITickerRepository } from '@/modules/ticker-management/domain/repositories/ticker.repository';
import { QueryExecutor } from '@/modules/common/application/ports/db';

export class SqliteTickerRepository implements ITickerRepository {
  constructor(private readonly db: QueryExecutor) {}

  async add(ticker: Ticker): Promise<void> {
    try {
      await this.db.execute(
        `
          INSERT INTO tickers (symbol, added_at)
          VALUES (?, ?)
        `,
        [ticker.symbol, ticker.addedAt.toISOString()]
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('UNIQUE constraint failed')
      ) {
        // eslint-disable-next-line preserve-caught-error
        throw new Error(`Ticker ${ticker.symbol} already exists`);
      }

      throw error;
    }
  }

  async get(symbol: string): Promise<Ticker | null> {
    const rows = await this.db.query<{
      symbol: string;
      added_at: string;
    }>(
      'SELECT symbol, added_at FROM tickers WHERE symbol = ?',
      [symbol]
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return new Ticker(row.symbol, new Date(row.added_at));
  }

  async getAll(): Promise<Ticker[]> {
    const rows = await this.db.query<{
      symbol: string;
      added_at: string;
    }>(
      'SELECT symbol, added_at FROM tickers ORDER BY added_at DESC'
    );

    return rows.map(
      row => new Ticker(row.symbol, new Date(row.added_at))
    );
  }

  async remove(symbol: string): Promise<void> {
    await this.db.execute(
      'DELETE FROM tickers WHERE symbol = ?',
      [symbol]
    );
  }
}
