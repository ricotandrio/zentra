import { Pool } from 'pg';
import { IScheduledQueryRepository } from '@/modules/scheduled-queries/application/contracts/scheduled-query.repository.port';
import { ScheduledQuery } from '@/modules/scheduled-queries/domain/entities/scheduled-query.entity';

export class PostgresScheduledQueryRepository implements IScheduledQueryRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<ScheduledQuery[]> {
    const result = await this.pool.query(
      'SELECT * FROM scheduled_queries ORDER BY id ASC'
    );
    return result.rows.map(this.toEntity);
  }

  async findById(id: number): Promise<ScheduledQuery | null> {
    const result = await this.pool.query(
      'SELECT * FROM scheduled_queries WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.toEntity(result.rows[0]);
  }

  async updateLastRunAt(id: number, date: Date): Promise<void> {
    await this.pool.query(
      'UPDATE scheduled_queries SET last_run_at = $1, updated_at = NOW() WHERE id = $2',
      [date, id]
    );
  }

  private toEntity(row: Record<string, unknown>): ScheduledQuery {
    return new ScheduledQuery(
      row.id as number,
      row.name as string,
      row.schedule as string | null,
      row.sql_query as string,
      row.enabled as boolean,
      row.last_run_at ? new Date(row.last_run_at as string) : null,
      row.next_run_at ? new Date(row.next_run_at as string) : null,
      new Date(row.created_at as string),
      new Date(row.updated_at as string)
    );
  }
}
