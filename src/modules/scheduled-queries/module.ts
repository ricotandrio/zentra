import { Pool } from 'pg';
import { Module, Runtime } from '@/shared/runtime';
import { PostgresAdapter } from './infrastructure/postgres/postgres.adapter';
import { PostgresScheduledQueryRepository } from './infrastructure/postgres/scheduled-query.repository';
import { ListQueriesUseCase } from './application/use-cases/list-queries.usecase';
import { ExecuteQueryUseCase } from './application/use-cases/execute-query.usecase';

export interface ScheduledQueriesModule {
  listQueriesUseCase: ListQueriesUseCase;
  executeQueryUseCase: ExecuteQueryUseCase;
}

export function createScheduledQueriesModule(): Module {
  let pool: Pool | null = null;

  return {
    async register(runtime: Runtime) {
      const connectionString = runtime.config.POSTGRESQL.URL;

      pool = new Pool({ connectionString });

      await pool.query(`
        CREATE TABLE IF NOT EXISTS scheduled_queries (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          schedule TEXT,
          sql_query TEXT,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          last_run_at TIMESTAMPTZ,
          next_run_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const queryExecutor = new PostgresAdapter(connectionString);
      const queryRepository = new PostgresScheduledQueryRepository(pool);

      const scheduledQueries: ScheduledQueriesModule = {
        listQueriesUseCase: new ListQueriesUseCase(queryRepository),
        executeQueryUseCase: new ExecuteQueryUseCase(queryRepository, queryExecutor),
      };

      runtime.modules.set('scheduledQueries', scheduledQueries);
    },

    async shutdown() {
      await pool?.end();
    },
  };
}
