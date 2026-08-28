import { Pool } from 'pg';
import { IQueryExecutorPort } from '@/modules/scheduled-queries/application/contracts/query-executor.port';

export class PostgresAdapter implements IQueryExecutorPort {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async execute(sql: string): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
    const result = await this.pool.query(sql);
    const columns = result.fields.map((field) => field.name);
    const rows = result.rows;
    return { columns, rows };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
