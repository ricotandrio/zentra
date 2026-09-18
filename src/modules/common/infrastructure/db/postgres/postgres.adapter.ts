import { Pool } from 'pg';

import {
  DatabaseConnection,
  QueryExecutor,
  QueryResultExecutor,
} from '@/modules/common/application/ports';

export class PostgresAdapter implements DatabaseConnection, QueryExecutor, QueryResultExecutor {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async query<T extends Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> {
    const result = await this.pool.query<T>(sql, params);

    return result.rows;
  }

  async execute(
    sql: string,
    params: unknown[] = []
  ): Promise<void> {
    await this.pool.query(sql, params);
  }

  async executeQuery(
    sql: string,
    params: unknown[] = []
  ): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
    const result = await this.pool.query(sql, params);

    return {
      columns: result.fields.map(field => field.name),
      rows: result.rows,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
