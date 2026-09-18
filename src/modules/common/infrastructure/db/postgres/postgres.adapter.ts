import { Pool } from 'pg';

import {
  DatabaseConnection,
  QueryExecutor,
} from '@/modules/common/application/ports';

export class PostgresAdapter implements DatabaseConnection, QueryExecutor {
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

  async close(): Promise<void> {
    await this.pool.end();
  }
}
