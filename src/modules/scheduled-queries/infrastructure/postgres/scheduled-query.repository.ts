import { ScheduledQuery } from '@/modules/scheduled-queries/domain/entities/scheduled-query.entity';
import { IScheduledQueryRepository } from '../../application/contracts/scheduled-query.repository.port';
import { QueryExecutor } from '@/modules/common/application/ports';

interface ScheduledQueryRow extends Record<string, unknown> {
  id: number;
  name: string;
  schedule: string | null;
  sql_query: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export class PostgresScheduledQueryRepository implements IScheduledQueryRepository {
  constructor(private readonly db: QueryExecutor) {}

  async findAll(): Promise<ScheduledQuery[]> {
    const rows = await this.db.query<ScheduledQueryRow>(
      'SELECT * FROM scheduled_queries ORDER BY id ASC'
    );

    return rows.map(row => this.toEntity(row));
  }

  async findById(id: number): Promise<ScheduledQuery | null> {
    const rows = await this.db.query<ScheduledQueryRow>(
      'SELECT * FROM scheduled_queries WHERE id = $1',
      [id]
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return this.toEntity(row);
  }

  async updateLastRunAt(id: number, date: Date): Promise<void> {
    await this.db.execute(
      `
        UPDATE scheduled_queries
        SET last_run_at = $1,
            updated_at = NOW()
        WHERE id = $2
      `,
      [date, id]
    );
  }

  private toEntity(row: ScheduledQueryRow): ScheduledQuery {
    return new ScheduledQuery(
      row.id,
      row.name,
      row.schedule,
      row.sql_query,
      row.enabled,
      row.last_run_at ? new Date(row.last_run_at) : null,
      row.next_run_at ? new Date(row.next_run_at) : null,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
